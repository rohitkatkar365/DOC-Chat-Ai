# 📚 PDF Q&A Bot

A full-stack JavaScript application that lets users upload PDF documents and ask natural-language questions about their contents. The bot uses vector embeddings and an LLM-powered retrieval chain to return accurate, context-aware answers grounded in the source PDF.

---

## ✨ Features

- 🔐 **User Authentication** — Secure signup/login with JWT
- 📄 **PDF Upload & Ingestion** — Parse and chunk PDF documents
- 🧠 **Vector Search** — Semantic retrieval over document embeddings
- 💬 **Conversational Q&A** — Ask follow-up questions with chat history
- 🗂️ **Persistent Chat History** — Stored per user in MongoDB
- ⚡ **Fast Frontend** — Built with React + Vite

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          USER (Browser)                          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                  FRONTEND  (React + Vite)                        │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────────┐     │
│  │   Login    │  │   Upload   │  │   Chat Interface        │     │
│  │   /Signup  │  │   PDF      │  │   (Q&A + History)       │     │
│  └────────────┘  └────────────┘  └─────────────────────────┘     │
└────────────────────────────┬─────────────────────────────────────┘
                             │  REST / JSON
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                  BACKEND  (Node.js + Express)                    │
│                                                                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│   │  Auth Route  │    │   Ingest     │    │   QA Chain   │       │
│   │  (JWT)       │    │   Pipeline   │    │              │       │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│          │                   │                   │               │
│          │                   ▼                   ▼               │
│          │         ┌──────────────────┐  ┌──────────────────┐    │
│          │         │  PDF Parser →    │  │  Retriever +     │    │
│          │         │  Chunker →       │  │  LLM Prompt      │    │
│          │         │  Embeddings      │  │                  │    │
│          │         └────────┬─────────┘  └────────┬─────────┘    │
│          │                  │                     │              │
│          ▼                  ▼                     ▼              │
│   ┌──────────────┐   ┌──────────────┐    ┌──────────────────┐    │
│   │   MongoDB    │   │ Vector Index │    │   LLM Provider   │    │
│   │ Users + Chat │   │  (local)     │    │   (OpenAI etc.)  │    │
│   └──────────────┘   └──────────────┘    └──────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. Ingestion Flow
```
PDF Upload  →  Text Extraction  →  Chunking  →  Embeddings  →  Vector Index
```

### 2. Query Flow
```
User Question  →  Embed Query  →  Vector Search  →  Top-K Chunks
                                                          │
                                                          ▼
                              Answer  ◄───  LLM  ◄───  Prompt + Context
```

---

## 🧩 Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | React, Vite, JavaScript             |
| Backend      | Node.js, Express                    |
| Database     | MongoDB (Users, Chat History)       |
| Vector Store | Local vector index                  |
| Auth         | JWT + bcrypt                        |
| AI / LLM     | LangChain-style QA chain + LLM API  |

---

## 📁 Project Structure

```
PDF Q&A Bot JS/
├── backend/
│   ├── server.js          # Express entry point
│   ├── db.js              # MongoDB connection
│   ├── ingest.js          # PDF ingestion pipeline
│   ├── qa_chain.js        # Retrieval + LLM Q&A chain
│   ├── routes/auth.js     # Auth endpoints
│   ├── models/            # Mongoose models (User, ChatHistory)
│   ├── middleware/        # Auth middleware
│   └── vector_index/      # Persisted embeddings
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/    # UI components
│       └── context/       # React context (auth, chat)
│
└── Documentation.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance
- LLM API key (e.g., OpenAI)

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📖 Documentation

See [`Documentation.md`](./Documentation.md) for the full technical documentation.
