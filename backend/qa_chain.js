import "dotenv/config";
import fs from "fs";
import path from "path";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";

// ── Per-user vector store cache ───────────────────────────────────────────────
const _storeCache = new Map(); // userId -> { mtimeMs, store }

export function invalidateCache(userId) {
  if (userId) _storeCache.delete(userId);
  else _storeCache.clear();
}

function getIndexFile(userId) {
  return path.join("./vector_index", userId, "store.json");
}

function makeEmbeddings() {
  return new OpenAIEmbeddings({
    model: "openai/text-embedding-ada-002",
    apiKey: process.env.OPENROUTER_API_KEY,
    configuration: { baseURL: process.env.OPENROUTER_BASE_URL },
  });
}

async function loadStore(userId) {
  const indexFile = getIndexFile(userId);
  if (!fs.existsSync(indexFile)) throw new Error("No index found for this user.");

  const stat = fs.statSync(indexFile);
  const cached = _storeCache.get(userId);
  if (cached && cached.mtimeMs === stat.mtimeMs) return cached.store;

  const data = JSON.parse(fs.readFileSync(indexFile, "utf8"));
  const vectors = data.vectors ?? [];

  const embeddings = makeEmbeddings();
  const store = new MemoryVectorStore(embeddings);
  store.memoryVectors = vectors.map(v => ({
    content: v.content,
    embedding: v.embedding,
    metadata: v.metadata ?? {},
  }));

  _storeCache.set(userId, { mtimeMs: stat.mtimeMs, store });
  return store;
}

function makeChat(model, streaming = false) {
  return new ChatOpenAI({
    model: model || "openai/gpt-4o-mini",
    temperature: 0,
    streaming,
    apiKey: process.env.OPENROUTER_API_KEY,
    configuration: { baseURL: process.env.OPENROUTER_BASE_URL },
  });
}

// ── Query expansion ───────────────────────────────────────────────────────────
async function expandQuery(question, model) {
  try {
    const llm = makeChat(model);
    const resp = await llm.invoke([{
      role: "user",
      content: `Rewrite the following question into 3 alternative search queries that capture different angles. Return only the queries, one per line, no numbering.\n\nQuestion: ${question}`,
    }]);
    const text = typeof resp.content === "string" ? resp.content : "";
    return text.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 3);
  } catch {
    return [];
  }
}

// ── Retrieval ─────────────────────────────────────────────────────────────────
async function retrieve({ store, question, k, filterFile, queryExpansion, model, trace }) {
  const queries = [{ text: question, type: "original" }];

  if (queryExpansion) {
    const t0 = Date.now();
    const expansions = await expandQuery(question, model);
    expansions.forEach(e => queries.push({ text: e, type: "expanded" }));
    trace.push({
      kind: "expand",
      label: "Query Expansion (HyDE-style)",
      detail: expansions.length
        ? `Generated ${expansions.length} alternative queries via ${model || "openai/gpt-4o-mini"}`
        : "No expansions generated",
      meta: {
        strategy: "LLM-based query rewriting",
        original: question,
        expansions,
        totalQueries: queries.length,
      },
      durationMs: Date.now() - t0,
      status: "ok",
    });
  }

  const tEmbed = Date.now();
  const sampleVec = store.memoryVectors?.[0]?.embedding;
  trace.push({
    kind: "embed",
    label: "Query Embedding",
    detail: `Embedding ${queries.length} ${queries.length === 1 ? "query" : "queries"} → ${sampleVec?.length || "?"}-dim vectors`,
    meta: {
      model: "openai/text-embedding-ada-002",
      provider: "OpenRouter",
      dimensions: sampleVec?.length || null,
      queries: queries.map(q => q.text),
    },
    status: "ok",
  });

  const seen = new Map(); // content -> {doc, score}
  let rawHits = 0;
  const perQueryHits = [];
  for (const q of queries) {
    const results = await store.similaritySearchWithScore(q.text, k);
    rawHits += results.length;
    perQueryHits.push({ query: q.text, type: q.type, hits: results.length });
    for (const [doc, score] of results) {
      if (filterFile && doc.metadata?.source !== filterFile) continue;
      const key = doc.pageContent;
      if (!seen.has(key) || seen.get(key).score < score) {
        seen.set(key, { doc, score });
      }
    }
  }

  const merged = Array.from(seen.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  const totalVectors = store.memoryVectors?.length ?? 0;
  trace.push({
    kind: "retrieve",
    label: "Vector Similarity Search",
    detail: `Cosine search across ${totalVectors} vectors → ${rawHits} raw hits → ${merged.length} unique top-${k} chunks${filterFile ? ` (filter: ${filterFile})` : ""}`,
    meta: {
      algorithm: "MemoryVectorStore (cosine similarity)",
      topK: k,
      totalVectorsInIndex: totalVectors,
      rawHitsAcrossQueries: rawHits,
      uniqueChunksAfterDedup: merged.length,
      filterFile: filterFile || null,
      perQueryHits,
    },
    durationMs: Date.now() - tEmbed,
    status: merged.length > 0 ? "ok" : "warn",
  });

  if (merged.length > 0) {
    const sources = [...new Set(merged.map(({ doc }) => doc.metadata?.source).filter(Boolean))];
    const topScore = merged[0].score.toFixed(4);
    const lowScore = merged[merged.length - 1].score.toFixed(4);
    const chunkPreviews = merged.map(({ doc, score }, i) => ({
      rank: i + 1,
      score: Number(score.toFixed(4)),
      source: doc.metadata?.source || "unknown",
      page: doc.metadata?.page ?? null,
      chars: doc.pageContent.length,
      preview: doc.pageContent.slice(0, 180) + (doc.pageContent.length > 180 ? "…" : ""),
    }));
    trace.push({
      kind: "rerank",
      label: "Context Ranking & Selection",
      detail: `Score range ${lowScore} → ${topScore} across ${sources.length} document${sources.length !== 1 ? "s" : ""} (${merged.length} chunks selected)`,
      meta: {
        strategy: "Score-based dedup, descending sort, top-k slice",
        sources,
        scoreRange: { top: topScore, low: lowScore },
        chunks: chunkPreviews,
      },
      status: "ok",
    });
  }

  return merged.map(({ doc, score }) => ({ doc, score }));
}

// ── Prompt building ───────────────────────────────────────────────────────────
function buildContext(retrieved) {
  return retrieved.map(({ doc }, i) => {
    const src = doc.metadata?.source || "unknown";
    return `[Source ${i + 1}: ${src}]\n${doc.pageContent}`;
  }).join("\n\n---\n\n");
}

const SYSTEM_PROMPT = `You are a helpful assistant that answers questions strictly based on the provided document context. If the answer is not contained in the context, say so honestly. Cite sources inline using their [Source N] tags where helpful.`;

function buildMessages({ question, context, history }) {
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];
  for (const m of history.slice(-6)) {
    if (m?.role && m?.content) messages.push({ role: m.role, content: m.content });
  }
  messages.push({
    role: "user",
    content: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer:`,
  });
  return messages;
}

function formatSources(retrieved) {
  return retrieved.map(({ doc, score }) => ({
    source: doc.metadata?.source || "unknown",
    page: doc.metadata?.page,
    score,
    text: doc.pageContent,
  }));
}

// ── Suggestions ───────────────────────────────────────────────────────────────
async function generateSuggestions({ question, answer, model }) {
  try {
    const llm = makeChat(model);
    const resp = await llm.invoke([{
      role: "user",
      content: `Given this Q&A, suggest 3 short follow-up questions the user might ask next. Return only the questions, one per line, no numbering.\n\nQ: ${question}\nA: ${answer}`,
    }]);
    const text = typeof resp.content === "string" ? resp.content : "";
    return text.split("\n").map(s => s.trim().replace(/^[-*\d.)\s]+/, "")).filter(Boolean).slice(0, 3);
  } catch {
    return [];
  }
}

function pushInitStep({ trace, store, question, k, chainType, model, filterFile, queryExpansion, history, fromCache }) {
  trace.push({
    kind: "init",
    label: "Pipeline Init",
    detail: `RAG pipeline started · top-k=${k} · chainType=${chainType} · ${fromCache ? "store cached" : "store loaded from disk"}`,
    meta: {
      question,
      userParams: { topK: k, chainType, model: model || "openai/gpt-4o-mini", filterFile: filterFile || null, queryExpansion, historyTurns: Math.min(history.length, 6) },
      vectorStore: {
        type: "MemoryVectorStore (in-memory cosine)",
        totalVectors: store.memoryVectors?.length ?? 0,
        embeddingDim: store.memoryVectors?.[0]?.embedding?.length ?? null,
        cached: fromCache,
      },
      pipelineStages: [
        "1. Init",
        queryExpansion ? "2. Query Expansion" : null,
        `${queryExpansion ? "3" : "2"}. Query Embedding`,
        `${queryExpansion ? "4" : "3"}. Vector Search`,
        `${queryExpansion ? "5" : "4"}. Context Ranking`,
        `${queryExpansion ? "6" : "5"}. Prompt Assembly`,
        `${queryExpansion ? "7" : "6"}. LLM Generation`,
        `${queryExpansion ? "8" : "7"}. Follow-up Suggestions`,
      ].filter(Boolean),
    },
    status: "ok",
  });
}

// ── Public: runQA ─────────────────────────────────────────────────────────────
export async function runQA({ question, k = 4, chainType = "stuff", userId, history = [], model, filterFile, queryExpansion = false }) {
  const trace = [];
  const wasCached = _storeCache.has(userId);
  const store = await loadStore(userId);
  pushInitStep({ trace, store, question, k, chainType, model, filterFile, queryExpansion, history, fromCache: wasCached });

  const retrieved = await retrieve({ store, question, k, filterFile, queryExpansion, model, trace });

  if (retrieved.length === 0) {
    return {
      answer: "I couldn't find any relevant information in the indexed documents to answer that question.",
      sources: [],
      trace,
      suggestions: [],
    };
  }

  const context = buildContext(retrieved);
  const messages = buildMessages({ question, context, history });
  const totalPromptChars = messages.reduce((acc, m) => acc + (m.content?.length || 0), 0);

  trace.push({
    kind: "prompt",
    label: "Prompt Assembly",
    detail: `Built ${messages.length}-message prompt · ${totalPromptChars.toLocaleString()} total chars (~${Math.ceil(totalPromptChars / 4).toLocaleString()} tokens)`,
    meta: {
      template: "system + history + (context + question)",
      messageCount: messages.length,
      totalChars: totalPromptChars,
      approxTokens: Math.ceil(totalPromptChars / 4),
      contextChars: context.length,
      historyTurns: Math.min(history.length, 6),
      systemPrompt: SYSTEM_PROMPT,
      userPromptPreview: messages[messages.length - 1].content.slice(0, 400) + "…",
    },
    status: "ok",
  });

  const tLLM = Date.now();
  const llm = makeChat(model);
  const resp = await llm.invoke(messages);
  const answer = typeof resp.content === "string" ? resp.content : String(resp.content ?? "");
  trace.push({
    kind: "llm",
    label: "LLM Generation",
    detail: `Generated ${answer.length.toLocaleString()} chars (~${Math.ceil(answer.length / 4).toLocaleString()} tokens) from ${model || "openai/gpt-4o-mini"}`,
    meta: {
      model: model || "openai/gpt-4o-mini",
      provider: "OpenRouter",
      temperature: 0,
      streaming: false,
      outputChars: answer.length,
      approxOutputTokens: Math.ceil(answer.length / 4),
    },
    durationMs: Date.now() - tLLM,
    status: "ok",
  });

  const suggestions = await generateSuggestions({ question, answer, model });

  return {
    answer,
    sources: formatSources(retrieved),
    trace,
    suggestions,
  };
}

// ── Public: runQAStream ───────────────────────────────────────────────────────
export async function* runQAStream({ question, k = 4, chainType = "stuff", userId, history = [], model, filterFile, queryExpansion = false }) {
  const trace = [];
  let store;
  const wasCached = _storeCache.has(userId);
  try {
    store = await loadStore(userId);
  } catch (err) {
    yield { type: "error", message: err.message };
    return;
  }
  pushInitStep({ trace, store, question, k, chainType, model, filterFile, queryExpansion, history, fromCache: wasCached });

  let retrieved;
  try {
    retrieved = await retrieve({ store, question, k, filterFile, queryExpansion, model, trace });
  } catch (err) {
    yield { type: "error", message: `Retrieval failed: ${err.message}` };
    return;
  }

  const sources = formatSources(retrieved);

  if (retrieved.length === 0) {
    const msg = "I couldn't find any relevant information in the indexed documents to answer that question.";
    yield { type: "token", content: msg };
    yield { type: "done", answer: msg, sources: [], trace, suggestions: [] };
    return;
  }

  const context = buildContext(retrieved);
  const messages = buildMessages({ question, context, history });
  const totalPromptChars = messages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
  const histCount = Math.min(history.length, 6);

  trace.push({
    kind: "prompt",
    label: "Prompt Assembly",
    detail: `Built ${messages.length}-message prompt · ${totalPromptChars.toLocaleString()} total chars (~${Math.ceil(totalPromptChars / 4).toLocaleString()} tokens)`,
    meta: {
      template: "system + history + (context + question)",
      messageCount: messages.length,
      totalChars: totalPromptChars,
      approxTokens: Math.ceil(totalPromptChars / 4),
      contextChars: context.length,
      chunks: retrieved.length,
      historyTurns: histCount,
      chainType,
      systemPrompt: SYSTEM_PROMPT,
      userPromptPreview: messages[messages.length - 1].content.slice(0, 400) + "…",
    },
    status: "ok",
  });

  let fullAnswer = "";
  const tLLM = Date.now();
  trace.push({
    kind: "llm",
    label: "LLM Generation (Streaming)",
    detail: `Streaming from ${model || "openai/gpt-4o-mini"} via OpenRouter…`,
    meta: {
      model: model || "openai/gpt-4o-mini",
      provider: "OpenRouter",
      temperature: 0,
      streaming: true,
    },
    status: "running",
  });
  try {
    const llm = makeChat(model, true);
    const stream = await llm.stream(messages);
    for await (const chunk of stream) {
      const piece = typeof chunk.content === "string" ? chunk.content : "";
      if (piece) {
        fullAnswer += piece;
        yield { type: "token", content: piece };
      }
    }
  } catch (err) {
    const llmStep = trace[trace.length - 1];
    if (llmStep?.kind === "llm") { llmStep.status = "error"; llmStep.detail = err.message; }
    yield { type: "error", message: `LLM stream failed: ${err.message}` };
    return;
  }

  const llmStep = trace[trace.length - 1];
  if (llmStep?.kind === "llm") {
    llmStep.status = "ok";
    llmStep.durationMs = Date.now() - tLLM;
    llmStep.detail = `Streamed ${fullAnswer.length.toLocaleString()} chars (~${Math.ceil(fullAnswer.length / 4).toLocaleString()} tokens) in ${((Date.now() - tLLM) / 1000).toFixed(2)}s`;
    llmStep.meta = {
      ...(llmStep.meta || {}),
      outputChars: fullAnswer.length,
      approxOutputTokens: Math.ceil(fullAnswer.length / 4),
      tokensPerSec: Math.round((fullAnswer.length / 4) / Math.max((Date.now() - tLLM) / 1000, 0.001)),
    };
  }

  const tSugg = Date.now();
  const suggestions = await generateSuggestions({ question, answer: fullAnswer, model });
  trace.push({
    kind: "suggest",
    label: "Follow-up Suggestions",
    detail: `Generated ${suggestions.length} follow-up question${suggestions.length !== 1 ? "s" : ""} via ${model || "openai/gpt-4o-mini"}`,
    meta: { suggestions, model: model || "openai/gpt-4o-mini" },
    durationMs: Date.now() - tSugg,
    status: "ok",
  });

  yield { type: "done", answer: fullAnswer, sources, trace, suggestions };
}
