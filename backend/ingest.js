import "dotenv/config";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import XLSX from "xlsx";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

export const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);

let _invalidateCache = null;
export function setInvalidateCache(fn) { _invalidateCache = fn; }

function getIndexPaths(userId) {
  const dir = path.join("./vector_index", userId);
  const file = path.join(dir, "store.json");
  return { dir, file };
}

export function indexExists(userId) {
  try {
    const { file } = getIndexPaths(userId);
    return fs.existsSync(file) && fs.statSync(file).isFile();
  } catch { return false; }
}

export function indexedFiles(userId) {
  try {
    if (!indexExists(userId)) return [];
    const { file } = getIndexPaths(userId);
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    // Support legacy format (array of strings) and new format (array of objects)
    return (data.files ?? []).map(f =>
      typeof f === "string" ? { name: f, size: 0, uploadedAt: new Date().toISOString(), summary: "" } : f
    );
  } catch { return []; }
}

async function generateSummary(text) {
  try {
    const llm = new ChatOpenAI({
      model: "openai/gpt-4o-mini",
      temperature: 0,
      apiKey: process.env.OPENROUTER_API_KEY,
      configuration: { baseURL: process.env.OPENROUTER_BASE_URL },
    });
    const snippet = text.slice(0, 3000);
    const response = await llm.invoke([{
      role: "user",
      content: `Summarize this document in 2-3 concise sentences. Focus on the main topic and key information.\n\n${snippet}`,
    }]);
    return response.content?.trim() ?? "";
  } catch {
    return "";
  }
}

async function ingestText(text, filename, fileSize, extraMeta = {}, cloudinaryData = null, userId) {
  const { dir, file: indexFile } = getIndexPaths(userId);

  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 150 });
  const docs = await splitter.createDocuments([text], [{ source: filename, ...extraMeta }]);
  if (docs.length === 0) throw new Error("Text splitting produced zero chunks.");

  const embeddings = new OpenAIEmbeddings({
    model: "openai/text-embedding-ada-002",
    apiKey: process.env.OPENROUTER_API_KEY,
    configuration: { baseURL: process.env.OPENROUTER_BASE_URL },
  });

  let newStore;
  try {
    newStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  } catch (err) {
    throw new Error(`Embedding / vector store build failed: ${err.message}`);
  }

  // Generate summary
  const summary = await generateSummary(text);

  try {
    let existingVectors = [];
    let existingFiles = [];
    let existingCloudinaryMeta = {};

    if (indexExists(userId)) {
      const data = JSON.parse(fs.readFileSync(indexFile, "utf8"));
      existingVectors = data.vectors ?? [];
      // Normalize existing files to objects
      existingFiles = (data.files ?? []).map(f =>
        typeof f === "string" ? { name: f, size: 0, uploadedAt: new Date().toISOString(), summary: "" } : f
      );
      existingCloudinaryMeta = data.cloudinaryMeta ?? {};
    }

    const mergedVectors = [...existingVectors, ...newStore.memoryVectors];
    const fileMeta = { name: filename, size: fileSize, uploadedAt: new Date().toISOString(), summary };
    const mergedFiles = existingFiles.find(f => f.name === filename)
      ? existingFiles.map(f => f.name === filename ? fileMeta : f)
      : [...existingFiles, fileMeta];

    const cloudinaryMeta = { ...existingCloudinaryMeta };
    if (cloudinaryData) cloudinaryMeta[filename] = cloudinaryData;

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(indexFile, JSON.stringify({ vectors: mergedVectors, files: mergedFiles, cloudinaryMeta }), "utf8");

    if (_invalidateCache) _invalidateCache(userId);
  } catch (err) {
    throw new Error(`Failed to save vector index: ${err.message}`);
  }

  return { chunks: docs.length };
}

async function ingestPDF(buffer, filename, cloudinaryData, userId) {
  let pdfData;
  try { pdfData = await pdfParse(buffer); }
  catch (err) { throw new Error(`Failed to parse PDF "${filename}": ${err.message}`); }
  if (!pdfData.text || pdfData.text.trim().length === 0) throw new Error(`No extractable text found in "${filename}".`);
  return ingestText(pdfData.text, filename, buffer.length, { totalPages: pdfData.numpages }, cloudinaryData, userId);
}

async function ingestTXT(buffer, filename, cloudinaryData, userId) {
  const text = buffer.toString("utf8");
  if (!text || text.trim().length === 0) throw new Error(`No extractable text found in "${filename}".`);
  return ingestText(text, filename, buffer.length, {}, cloudinaryData, userId);
}

async function ingestExcel(buffer, filename, cloudinaryData, userId) {
  let workbook;
  try { workbook = XLSX.read(buffer, { type: "buffer" }); }
  catch (err) { throw new Error(`Failed to parse Excel file "${filename}": ${err.message}`); }
  const parts = workbook.SheetNames.map(sheetName => {
    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
    return `[Sheet: ${sheetName}]\n${csv}`;
  });
  const text = parts.join("\n\n").trim();
  if (!text) throw new Error(`No extractable text found in "${filename}".`);
  return ingestText(text, filename, buffer.length, { sheets: workbook.SheetNames.length }, cloudinaryData, userId);
}

async function ingestImage(buffer, filename, cloudinaryData, userId) {
  const ext = path.extname(filename).toLowerCase();
  const mimeMap = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp" };
  const mimeType = mimeMap[ext] ?? "image/png";
  const base64 = buffer.toString("base64");

  const llm = new ChatOpenAI({
    model: "openai/gpt-4o-mini",
    temperature: 0,
    apiKey: process.env.OPENROUTER_API_KEY,
    configuration: { baseURL: process.env.OPENROUTER_BASE_URL },
  });

  let description;
  try {
    const response = await llm.invoke([{
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
        { type: "text", text: `Analyze this image thoroughly and produce a comprehensive description that can be used to answer questions about it.\n\nIf it is a flowchart or diagram: describe every node, decision box, arrow, label, connection, and the overall flow or logic step by step.\nIf it contains text: transcribe all visible text exactly.\nIf it is a chart or graph: describe the axes, values, trends, and data points.\nFor any image: describe the structure, layout, key elements, and what it communicates.\n\nBe as detailed as possible — your description will be used for question answering.` },
      ],
    }]);
    description = response.content;
  } catch (err) {
    throw new Error(`Vision LLM failed to analyze image "${filename}": ${err.message}`);
  }

  if (!description || description.trim().length === 0) throw new Error(`Vision LLM returned no description for "${filename}".`);
  const fullText = `[Image: ${filename}]\n\n${description}`;
  return ingestText(fullText, filename, buffer.length, { type: "image" }, cloudinaryData, userId);
}

export async function ingestFile(buffer, filename, cloudinaryData = null, userId) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") return ingestPDF(buffer, filename, cloudinaryData, userId);
  if (ext === ".txt") return ingestTXT(buffer, filename, cloudinaryData, userId);
  if (ext === ".xlsx" || ext === ".xls") return ingestExcel(buffer, filename, cloudinaryData, userId);
  if (IMAGE_EXTENSIONS.has(ext)) return ingestImage(buffer, filename, cloudinaryData, userId);
  throw new Error(`Unsupported file type: "${ext}".`);
}
