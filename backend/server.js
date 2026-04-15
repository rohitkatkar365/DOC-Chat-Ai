import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { ingestFile, indexExists, indexedFiles, IMAGE_EXTENSIONS, setInvalidateCache } from "./ingest.js";
import { runQA, runQAStream, invalidateCache } from "./qa_chain.js";
import { connectDB } from "./db.js";
import authRouter from "./routes/auth.js";
import { requireAuth } from "./middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";
import { ChatHistory } from "./models/ChatHistory.js";

// Wire cache invalidation
setInvalidateCache(invalidateCache);

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const safeName = path.parse(filename).name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const publicId = `pdf-qa-bot/${safeName}-${Date.now()}`;
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", public_id: publicId },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : ["http://localhost:5173"];

// Automatically allow the Vercel deployment URLs
if (process.env.VERCEL_URL) ALLOWED_ORIGINS.push(`https://${process.env.VERCEL_URL}`);
if (process.env.VERCEL_PROJECT_PRODUCTION_URL) ALLOWED_ORIGINS.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman) or matching allowed origins
    if (!origin || ALLOWED_ORIGINS.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      const err = new Error(`CORS: origin '${origin}' not allowed`);
      err.status = 403;
      callback(err);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to DB on each request (cached after first connection — safe for serverless)
app.use(async (_req, _res, next) => {
  try { await connectDB(); next(); }
  catch (err) { next(err); }
});

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use("/api/", limiter);

// Multer
const ACCEPTED_EXTENSIONS = new Set([".pdf", ".txt", ".xlsx", ".xls", ...IMAGE_EXTENSIONS]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ACCEPTED_EXTENSIONS.has(ext)) cb(null, true);
    else cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only PDF, TXT, XLSX, XLS, and image files are accepted."));
  },
});

// ── PUBLIC routes (no auth) ───────────────────────────────────────────────────
app.use("/api/auth", authRouter);

// ── All routes below require authentication ───────────────────────────────────
app.use("/api", requireAuth);

// GET /api/status
app.get("/api/status", (req, res) => {
  const uid = req.user.id;
  res.json({ indexed: indexExists(uid), files: indexedFiles(uid) });
});

// POST /api/upload
function splitQuestions(text) {
  const parts = text.split("?").map(s => s.trim()).filter(Boolean);
  if (parts.length <= 1) return [text.trim()];
  return parts.map(p => p + "?");
}

app.post("/api/upload", upload.array("file"), async (req, res, next) => {
  const uid = req.user.id;
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded.", chunks: 0 });
    }

    const MAX_DOCS = 5;
    const currentFiles = indexedFiles(uid);
    const currentCount = currentFiles.length;
    const incoming = req.files.length;

    if (currentCount >= MAX_DOCS) {
      return res.status(400).json({
        success: false,
        message: `Document limit reached (${MAX_DOCS}). Remove documents before adding more.`,
        chunks: 0,
      });
    }
    if (currentCount + incoming > MAX_DOCS) {
      return res.status(400).json({
        success: false,
        message: `Adding ${incoming} file(s) would exceed the ${MAX_DOCS}-document limit (${currentCount} already indexed).`,
        chunks: 0,
      });
    }

    let totalChunks = 0;
    for (const file of req.files) {
      const cloudinaryData = await uploadToCloudinary(file.buffer, file.originalname);
      const { chunks } = await ingestFile(file.buffer, file.originalname, cloudinaryData, uid);
      totalChunks += chunks;
    }

    const names = req.files.map(f => `"${f.originalname}"`).join(", ");
    res.json({
      success: true,
      message: `${names} ingested successfully.`,
      chunks: totalChunks,
      files: indexedFiles(uid),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/ask
app.post("/api/ask", async (req, res, next) => {
  const uid = req.user.id;
  try {
    const { question, k, chainType, history, model, filterFile, queryExpansion } = req.body;

    if (!question || typeof question !== "string" || question.trim() === "") {
      return res.status(400).json({ results: [], error: "A non-empty 'question' string is required." });
    }
    if (!indexExists(uid)) {
      return res.status(400).json({ results: [], error: "No index found. Upload a document first." });
    }

    const questions = splitQuestions(question.trim());
    const kVal = k ? parseInt(k, 10) : 4;
    const chainTypeVal = chainType || "stuff";
    const conversationHistory = Array.isArray(history) ? history : [];
    const modelVal = model || "openai/gpt-4o-mini";
    const filterFileVal = filterFile || undefined;
    const queryExpansionVal = queryExpansion === true;

    const results = await Promise.all(
      questions.map(async (q) => {
        const result = await runQA({ question: q, k: kVal, chainType: chainTypeVal, userId: uid, history: conversationHistory, model: modelVal, filterFile: filterFileVal, queryExpansion: queryExpansionVal });
        return { question: q, ...result };
      })
    );

    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// POST /api/ask/stream — Server-Sent Events streaming response
app.post("/api/ask/stream", async (req, res) => {
  const uid = req.user.id;
  const { question, k, chainType, history, model, filterFile, queryExpansion } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  if (!question || typeof question !== "string" || question.trim() === "") {
    send({ type: "error", message: "A non-empty 'question' string is required." });
    return res.end();
  }
  if (!indexExists(uid)) {
    send({ type: "error", message: "No index found. Upload a document first." });
    return res.end();
  }

  try {
    const kVal = k ? parseInt(k, 10) : 4;
    const chainTypeVal = chainType || "stuff";
    const conversationHistory = Array.isArray(history) ? history : [];
    const modelVal = model || "openai/gpt-4o-mini";
    const filterFileVal = filterFile || undefined;
    const queryExpansionVal = queryExpansion === true;

    for await (const event of runQAStream({
      question: question.trim(),
      k: kVal,
      chainType: chainTypeVal,
      userId: uid,
      history: conversationHistory,
      model: modelVal,
      filterFile: filterFileVal,
      queryExpansion: queryExpansionVal,
    })) {
      send(event);
      if (event.type === "error" || event.type === "done") break;
    }
  } catch (err) {
    send({ type: "error", message: err.message || "Streaming failed." });
  } finally {
    res.end();
  }
});

// DELETE /api/index/:filename
app.delete("/api/index/:filename", async (req, res, next) => {
  const uid = req.user.id;
  try {
    const filename = decodeURIComponent(req.params.filename);
    const indexDir = path.join("./vector_index", uid);
    const indexFile = path.join(indexDir, "store.json");

    if (!fs.existsSync(indexFile)) {
      return res.status(404).json({ success: false, message: "No index found." });
    }

    const data = JSON.parse(fs.readFileSync(indexFile, "utf8"));
    const filteredVectors = (data.vectors ?? []).filter(v => v.metadata?.source !== filename);
    const filteredFiles = (data.files ?? []).filter(f => (typeof f === "string" ? f : f.name) !== filename);
    const cloudinaryMeta = { ...(data.cloudinaryMeta ?? {}) };

    const fileCloudinary = cloudinaryMeta[filename];
    if (fileCloudinary?.publicId) {
      try {
        await cloudinary.uploader.destroy(fileCloudinary.publicId, { resource_type: "raw" });
      } catch (e) {
        console.warn(`[Cloudinary] Failed to delete "${fileCloudinary.publicId}": ${e.message}`);
      }
    }
    delete cloudinaryMeta[filename];

    invalidateCache(uid);

    if (filteredFiles.length === 0) {
      fs.rmSync(indexDir, { recursive: true, force: true });
      return res.json({ success: true, files: [], indexed: false });
    }

    fs.writeFileSync(indexFile, JSON.stringify({ vectors: filteredVectors, files: filteredFiles, cloudinaryMeta }), "utf8");
    res.json({ success: true, files: filteredFiles, indexed: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/index
app.delete("/api/index", async (req, res, next) => {
  const uid = req.user.id;
  const indexDir = path.join("./vector_index", uid);
  const indexFile = path.join(indexDir, "store.json");

  try {
    if (fs.existsSync(indexFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(indexFile, "utf8"));
        const meta = data.cloudinaryMeta ?? {};
        await Promise.all(
          Object.values(meta).map(({ publicId }) =>
            cloudinary.uploader.destroy(publicId, { resource_type: "raw" }).catch(e =>
              console.warn(`[Cloudinary] Failed to delete "${publicId}": ${e.message}`)
            )
          )
        );
      } catch (e) {
        console.warn(`[Cloudinary] Bulk delete error: ${e.message}`);
      }
    }

    invalidateCache(uid);

    if (!fs.existsSync(indexDir)) {
      return res.json({ success: true, message: "No index to delete." });
    }

    fs.rmSync(indexDir, { recursive: true, force: true });
    res.json({ success: true, message: "Index deleted successfully." });
  } catch (err) {
    next(err);
  }
});

// ── Chat history routes ───────────────────────────────────────────────────────

// GET /api/chat/history
app.get("/api/chat/history", async (req, res, next) => {
  try {
    const doc = await ChatHistory.findOne({ userId: req.user.id });
    res.json({ messages: doc?.messages ?? [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/chat/history — append messages
app.post("/api/chat/history", async (req, res, next) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) return res.status(400).json({ error: "messages must be an array" });
    await ChatHistory.findOneAndUpdate(
      { userId: req.user.id },
      { $push: { messages: { $each: messages } } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// PUT /api/chat/history — replace all messages
app.put("/api/chat/history", async (req, res, next) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) return res.status(400).json({ error: "messages must be an array" });
    await ChatHistory.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { messages } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/chat/history — clear messages
app.delete("/api/chat/history", async (req, res, next) => {
  try {
    await ChatHistory.findOneAndUpdate({ userId: req.user.id }, { $set: { messages: [] } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// 404
app.use((_req, res) => res.status(404).json({ error: "Route not found." }));

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "File too large. Maximum size is 50 MB." : err.message || "File upload error.";
    return res.status(400).json({ success: false, message, chunks: 0 });
  }
  const status = err.status || 500;
  const message = err.message || "Internal server error.";
  if (process.env.NODE_ENV !== "production") console.error("[Error]", err);
  else console.error(`[Error] ${status}: ${message}`);
  res.status(status).json({ error: message });
});

// Local dev: start the server
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`DocuChat AI backend listening on http://localhost:${PORT}`);
        console.log(`  OpenRouter base URL: ${process.env.OPENROUTER_BASE_URL ?? "(not set)"}`);
      });
    })
    .catch((err) => {
      console.error("[Fatal] MongoDB connection failed:", err.message);
      process.exit(1);
    });
}

// Vercel: export the Express app as the serverless handler
export default app;
