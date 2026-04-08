# DocuChat AI — Client Documentation

**Project:** PDF Q&A Bot (DocuChat AI)
**Prepared For:** Client
**Date:** April 2026
**Version:** 1.0.0

---

## Table of Contents

1. [What Is DocuChat AI?](#1-what-is-docuchat-ai)
2. [Who Is It For?](#2-who-is-it-for)
3. [Key Features at a Glance](#3-key-features-at-a-glance)
4. [How It Works — Step by Step](#4-how-it-works--step-by-step)
5. [Supported File Types](#5-supported-file-types)
6. [AI Models Available](#6-ai-models-available)
7. [Application Screens & Interface](#7-application-screens--interface)
8. [Security & Privacy](#8-security--privacy)
9. [Technology Overview (Non-Technical)](#9-technology-overview-non-technical)
10. [Setup Requirements](#10-setup-requirements)
11. [Limitations & Boundaries](#11-limitations--boundaries)
12. [Frequently Asked Questions](#12-frequently-asked-questions)

---

## 1. What Is DocuChat AI?

**DocuChat AI** is a smart, web-based application that allows users to upload their documents — such as PDFs, spreadsheets, text files, and images — and then ask questions about them in plain, everyday language, just like chatting with a knowledgeable assistant.

Instead of manually reading through pages of documents to find specific information, users can simply type a question like:

> *"What is the total revenue for Q3?"*
> *"Summarize the key findings from this report."*
> *"What are the payment terms in this contract?"*

The application will instantly read through the uploaded document, find the most relevant sections, and deliver a clear, accurate answer — complete with references to the exact pages or sections it sourced the answer from.

This tool is built to save time, reduce human error, and make document analysis accessible to everyone — no technical expertise required.

---

## 2. Who Is It For?

DocuChat AI is designed for anyone who regularly works with documents and needs fast, reliable answers from them. Examples include:

- **Business professionals** reviewing contracts, proposals, or reports
- **Researchers** extracting insights from academic papers or studies
- **Finance teams** analyzing spreadsheets and financial statements
- **Legal staff** reviewing agreements or compliance documents
- **Customer support teams** navigating product manuals or policy documents
- **Students** studying from textbooks or lecture notes

No technical knowledge is needed to use this application. If you can type a question, you can use DocuChat AI.

---

## 3. Key Features at a Glance

| Feature | Description |
|---|---|
| **Document Upload** | Upload PDFs, Word-style text, Excel sheets, and images |
| **Natural Language Q&A** | Ask questions in plain English and get intelligent answers |
| **Source References** | Every answer shows exactly which part of the document it came from |
| **Conversation Memory** | The app remembers previous questions, enabling follow-up conversations |
| **Multiple AI Models** | Choose from GPT-4o, Claude 3.5, Gemini 2.5, and more |
| **Live Streaming Answers** | Responses appear word-by-word in real time |
| **Follow-up Suggestions** | The AI suggests related questions you might want to ask next |
| **Chat Export** | Download your entire Q&A session as a file |
| **Secure Login** | Each user has a private, password-protected account |
| **Image Understanding** | Can analyze and answer questions about uploaded images |

---

## 4. How It Works — Step by Step

Understanding how DocuChat AI works behind the scenes helps appreciate the value it delivers. Here is the complete journey from account creation to receiving an answer:

### Step 1 — Create an Account

When a user first visits the application, they are presented with a simple **Login / Register** screen.

- **Register:** Enter your full name, email address, and a password (minimum 6 characters). Your password is stored securely — it is encrypted and never stored in plain text.
- **Login:** Enter your email and password. Upon successful login, the system issues a secure digital key (called a JWT token) that keeps you logged in for up to 7 days without needing to sign in again.

Each user has a completely private account. Your documents and conversations are never visible to other users.

---

### Step 2 — Upload Your Documents

Once logged in, you will see the main application screen. On the left side is a **Sidebar** where you can manage your documents.

Click the **"Upload Files"** button (or drag and drop files directly into the window) to upload your documents.

**What happens after upload:**

1. The document is securely received by the server.
2. The text content is extracted from the file (e.g., text from PDF pages, data from spreadsheet cells, or a detailed description of an image).
3. The content is broken into small, manageable sections called **"chunks"** — think of it like cutting a book into individual paragraphs.
4. Each chunk is converted into a **mathematical representation** (called an "embedding") that the AI understands.
5. These representations are stored in a private index — a fast lookup system — that belongs only to your account.
6. The AI automatically generates a short **summary** of the document so you can quickly see what it contains.

This entire process takes only a few seconds per document. Once complete, you will see your document listed in the sidebar with its name, file size, upload date, and AI-generated summary.

---

### Step 3 — Ask a Question

Type your question in the **chat input box** at the bottom of the screen and press Enter (or click Send).

**What happens when you ask a question:**

1. Your question is sent to the server.
2. The system optionally generates **2–3 alternative phrasings** of your question to improve accuracy (this is called "query expansion").
3. It searches through your document index to find the most **relevant sections** that could answer your question.
4. The relevant sections, along with your question and recent conversation history, are sent to the selected **AI model**.
5. The AI generates a clear, natural-language answer — word by word, streamed live to your screen so you don't have to wait.
6. Once complete, the system also shows:
   - **Source References** — which document and page the answer came from
   - **Follow-up Suggestions** — three related questions you might want to ask next
   - **Processing Trace** — a behind-the-scenes log of what steps were taken (for transparency)

---

### Step 4 — Continue the Conversation

DocuChat AI remembers the last 10 messages in your conversation. This means you can ask follow-up questions naturally:

> "What was the revenue figure you mentioned?"
> "Can you elaborate on point 3?"
> "Which document was that from?"

The AI understands context from the conversation, making it feel like a real dialogue rather than isolated one-off queries.

---

### Step 5 — Manage Your Session

From the sidebar and chat, you can:

- **Switch documents** or add more files
- **Change the AI model** mid-conversation
- **Edit a previous question** and re-ask it
- **Regenerate an answer** if you want a different phrasing
- **Clear the chat** to start fresh
- **Export the conversation** as a Markdown text file for your records

---

## 5. Supported File Types

DocuChat AI supports a wide range of document formats:

| File Type | Extensions | What Gets Analyzed |
|---|---|---|
| **PDF Documents** | `.pdf` | Full text content, page numbers preserved |
| **Text Files** | `.txt` | Plain text content |
| **Excel Spreadsheets** | `.xlsx`, `.xls` | All sheets converted to readable table format |
| **Images** | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` | AI vision model generates a detailed description of the image content |

**File Size Limit:** 50 MB per file
**Document Limit:** Up to 5 documents per user account at one time

> **Note:** For images, the AI analyzes the visual content and creates a rich text description. You can then ask questions like "What chart is shown in this image?" or "What text appears in this screenshot?"

---

## 6. AI Models Available

Users can choose from multiple world-class AI models depending on their preference or use case:

| Model | Provider | Best For |
|---|---|---|
| **GPT-4o** | OpenAI | Most capable, balanced performance |
| **GPT-4o Mini** | OpenAI | Faster responses, cost-effective |
| **Claude 3.5 Sonnet** | Anthropic | Excellent reasoning & long documents |
| **Gemini 2.5 Flash** | Google | Fast, great for structured data |

All models are accessed through a unified service called **OpenRouter**, which means the application can switch between providers seamlessly. Users can change the model at any time using the settings panel in the sidebar.

---

## 7. Application Screens & Interface

### Login / Register Screen

A clean, minimal form for creating an account or signing in. Fields include name, email, and password. Error messages are shown clearly if something goes wrong (e.g., "Email already in use" or "Invalid credentials").

---

### Main Application Screen

The main interface is divided into two sections:

**Left Sidebar:**
- List of uploaded documents with file details
- Settings panel (model selection, advanced options)
- Action buttons: Upload, Clear Chat, Export Chat
- On mobile devices, the sidebar is hidden by default and can be opened via a menu button

**Right Chat Area:**
- Full conversation history displayed as chat bubbles
- User messages appear on the right side
- AI responses appear on the left side
- Real-time streaming of the AI's response as it types
- Each AI message includes expandable sections for Sources, Suggestions, and Trace

**Chat Input Bar:**
- Text input at the bottom of the screen
- Supports multi-line messages (Shift + Enter for new line, Enter to send)
- Files can be dragged and dropped directly onto the chat area for quick upload
- Upload progress bar shown during file processing

---

### Settings Panel (Inside Sidebar)

Users can configure the following options:

| Setting | Options | What It Does |
|---|---|---|
| **AI Model** | GPT-4o, Claude, Gemini, etc. | Selects which AI generates the answers |
| **Chain Type** | Stuff, Map Reduce, Refine, Map Rerank | Controls how the AI processes multiple document sections |
| **Retrieval Count (k)** | 1 to 10 (default: 4) | How many document sections the AI reads before answering |
| **Query Expansion** | On / Off | Whether to automatically rephrase the question for better results |

> **Tip for Clients:** For most use cases, the default settings work perfectly. These advanced options are available for power users who want to fine-tune the behavior.

---

## 8. Security & Privacy

Security is a core part of how DocuChat AI is built. Here is how your data is protected:

### Account Security
- **Passwords are never stored as plain text.** They are scrambled using a one-way encryption method (bcryptjs) before being saved to the database. Even our own engineers cannot read your password.
- **Secure login tokens** (JWT) are used to keep you logged in. These expire automatically after 7 days.
- **Each user's data is completely isolated.** Your documents and chat history are only accessible to you.

### Document Security
- Uploaded files are processed on the server and stored securely in **Cloudinary**, a trusted cloud storage platform used by thousands of businesses worldwide.
- Your **vector index** (the AI's internal knowledge of your documents) is stored separately, keyed specifically to your user account.

### Access Control
- All sensitive endpoints (document upload, Q&A, chat history) require a valid login token. Unauthenticated requests are blocked.
- **Rate limiting** is in place: each user can make up to 100 requests every 15 minutes, which prevents abuse.
- **CORS protection** ensures the application only accepts requests from approved web addresses.

### Data Summary

| Data | Where It's Stored | Who Can Access It |
|---|---|---|
| User accounts (name, email) | MongoDB database | Only your account |
| Chat history | MongoDB database | Only your account |
| Uploaded files | Cloudinary (cloud) | Only your account |
| Document index (AI knowledge) | Server file system | Only your account |

---

## 9. Technology Overview (Non-Technical)

You do not need to understand the technology to use DocuChat AI, but here is a simple explanation of what powers it:

### The Building Blocks

**Frontend (What You See)**
The user interface is built with **React** — the same technology used by Facebook, Instagram, and Airbnb. It runs in your web browser and provides the chat interface, sidebar, and all visual elements.

**Backend (The Engine)**
The server is built with **Node.js and Express** — a fast, widely used platform for web applications. It handles file uploads, processes your questions, communicates with AI models, and returns answers.

**Database (Memory)**
**MongoDB** is used to store user accounts and conversation history. It is a modern, flexible database used by companies like Adobe, eBay, and LinkedIn.

**AI Intelligence (The Brain)**
The application uses **LangChain** — a framework for building AI-powered applications — to orchestrate how documents are processed and how the AI generates answers. It connects to world-class AI models (GPT-4o, Claude, Gemini) through a service called **OpenRouter**.

**How the AI "Understands" Documents**
When you upload a document, the text is converted into numerical patterns called **embeddings** — essentially a unique mathematical fingerprint for each piece of text. When you ask a question, the system finds the fingerprints closest to your question and retrieves those sections for the AI to read. This is called **semantic search** — it matches meaning, not just keywords.

**File Storage**
Uploaded documents are stored in **Cloudinary** — a professional cloud service specialized in secure file storage and delivery.

---

## 10. Setup Requirements

For the technical team deploying this application, the following infrastructure is required:

### Software Prerequisites
- **Node.js** version 16 or higher
- **MongoDB** — either installed locally or a cloud service like MongoDB Atlas
- A web browser (Chrome, Firefox, Edge, Safari — all modern versions supported)

### External Services & API Keys Required

| Service | Purpose | Where to Get It |
|---|---|---|
| **OpenRouter** | Access to all AI models (GPT-4, Claude, Gemini) | openrouter.ai |
| **Cloudinary** | Secure file storage for uploaded documents | cloudinary.com |
| **MongoDB** | Database for users and chat history | mongodb.com |

### Startup Process
1. Configure the environment file with API keys and database connection
2. Install dependencies for both backend and frontend
3. Start the backend server (runs on port 3001)
4. Start the frontend development server (runs on port 5173)
5. Open browser and navigate to `http://localhost:5173`

> For production deployment, the application should be hosted on a secure server with HTTPS enabled.

---

## 11. Limitations & Boundaries

Being transparent about current limitations helps set proper expectations:

| Limitation | Detail |
|---|---|
| **5 documents per user** | Each account can hold up to 5 documents at a time |
| **50 MB per file** | Individual files cannot exceed 50 MB |
| **10 messages of context** | The AI considers only the last 10 messages in conversation history |
| **4 chunks retrieved by default** | Only the top 4 most relevant sections are used per answer (configurable up to 10) |
| **Local vector storage** | Document indexes are stored on the server's file system (not a cloud vector DB) |
| **Internet required** | AI model access requires an active internet connection to OpenRouter |
| **No document editing** | The application reads documents only — it cannot modify them |
| **Image analysis is descriptive** | For images, the AI generates a description rather than performing OCR character-level extraction |

---

## 12. Frequently Asked Questions

**Q: Can multiple users use the application at the same time?**
Yes. Each user has their own account, and the system is built to handle multiple users simultaneously. Each user's documents and conversations are completely separate.

---

**Q: Will the AI answer questions about topics not in my documents?**
By default, the AI is instructed to answer only based on the uploaded documents. If relevant information is not found, it will say so rather than making up an answer.

---

**Q: Can I upload a new document and keep my old ones?**
Yes. You can have up to 5 documents uploaded at a time. You can delete individual documents and replace them with new ones.

---

**Q: Is my data shared with anyone?**
No. Your documents and conversations are private to your account. The only third-party services involved are:
- **OpenRouter** (to process AI requests — your document text is sent to the AI model)
- **Cloudinary** (to store your uploaded files securely)
- **MongoDB** (to store your account and chat history)

---

**Q: Can I ask questions in languages other than English?**
Yes. The underlying AI models (GPT-4o, Claude, Gemini) support multiple languages. Questions and answers can be in any language supported by these models.

---

**Q: What happens if I delete a document?**
The document is removed from your storage (Cloudinary) and its data is removed from your personal knowledge index. Previous chat answers referencing that document remain visible in your chat history, but new questions will no longer draw from that document.

---

**Q: Can I export my conversation?**
Yes. There is an "Export Chat" button in the sidebar that downloads your entire conversation as a plain text Markdown file, which can be opened in any text editor or word processor.

---

**Q: How accurate are the answers?**
Accuracy depends on the quality and clarity of the uploaded documents. The AI always cites its sources (document name and page number), allowing you to verify any answer directly in the original file. A relevance score is also shown for each source, indicating how closely it matched your question.

---

**Q: Can I switch AI models mid-conversation?**
Yes. You can change the AI model at any time using the Settings panel in the sidebar. The new model will be used for your next question.

---

**Q: What is "Chain Type" in the settings?**
Chain Type controls how the AI handles multiple document sections when building an answer:
- **Stuff** (default): All relevant sections are combined and read at once — best for shorter documents.
- **Map Reduce**: Each section is summarized independently, then combined — best for longer documents.
- **Refine**: Each section progressively refines the previous answer — best for detailed analysis.
- **Map Rerank**: Each section is scored and the best-scoring answer is selected — best for precise factual queries.

---

*This document was prepared to give a clear, non-technical overview of the DocuChat AI application. For technical architecture details, API documentation, or deployment guides, please refer to the separate technical specification document.*

---

**End of Document**
