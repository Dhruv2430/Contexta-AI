# Contexta AI

> AI-Powered SaaS Customer Support Platform using MERN + Gemini + RAG Architecture

![Status](https://img.shields.io/badge/status-production--ready-success)
![Stack](https://img.shields.io/badge/stack-MERN-blue)
![AI](https://img.shields.io/badge/AI-Gemini-orange)
![RAG](https://img.shields.io/badge/RAG-FAISS-purple)

---

# Overview

Contexta AI is a full-stack AI-powered SaaS customer support platform that enables businesses to upload their internal documents and deploy intelligent, context-aware AI chatbots.

The platform uses a Retrieval-Augmented Generation (RAG) pipeline powered by Gemini API, semantic vector search, and FAISS vector databases to generate grounded responses based strictly on uploaded company documents.

Unlike traditional chatbots that hallucinate answers, Contexta AI retrieves relevant document chunks before generating responses, ensuring accurate and context-aware customer support.

---

# Core Features

## Authentication & SaaS Infrastructure

* JWT-based authentication system
* Secure signup/login flow
* Protected dashboard routes
* Multi-user SaaS architecture
* Company-level data isolation

---

## Document Management System

* PDF upload support
* Local document storage pipeline
* PDF text extraction using pdf-parse
* Upload validation (type + size)
* Document deletion and management
* Upload status tracking

---

## AI + RAG Pipeline

* Recursive text chunking
* Gemini embeddings generation
* FAISS vector database integration
* Semantic similarity search
* Context-aware retrieval
* Grounded Gemini responses
* Anti-hallucination prompt engineering

---

## Chatbot System

* AI-powered chat interface
* Retrieval-based response generation
* Typing/loading animations
* Chat history storage
* Source-aware responses
* Empty-context fallback handling

---

## SaaS Widget System

* Embeddable iframe chatbot widget
* Company-specific widget routes
* Multi-tenant chatbot isolation
* Responsive customer support UI

---

# Tech Stack

| Layer           | Technology              |
| --------------- | ----------------------- |
| Frontend        | React.js + Tailwind CSS |
| Backend         | Node.js + Express.js    |
| Database        | MongoDB Atlas           |
| Authentication  | JWT + bcrypt            |
| AI Model        | Gemini 1.5 Flash        |
| Embeddings      | Gemini Embeddings       |
| Vector Database | FAISS                   |
| AI Framework    | LangChain.js            |
| PDF Parsing     | pdf-parse               |
| File Upload     | Multer                  |
| Deployment      | Vercel + Render         |

---

# System Architecture

```text
Frontend Dashboard / Widget
            ↓
        Express API
            ↓
Authentication + Controllers
            ↓
RAG Pipeline Services
            ↓
Chunking → Embeddings → FAISS
            ↓
Gemini API Response Generation
```

---

# RAG Pipeline Flow

```text
User Uploads PDF
        ↓
Multer stores file locally
        ↓
pdf-parse extracts raw text
        ↓
Recursive text chunking
        ↓
Gemini embedding generation
        ↓
Store vectors in FAISS
        ↓
User asks question
        ↓
Question converted to embedding
        ↓
Semantic similarity search
        ↓
Retrieve top relevant chunks
        ↓
Inject chunks into prompt
        ↓
Gemini generates grounded response
```

---

# Folder Structure

```text
contexta-ai/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── context/
│   │   └── layouts/
│
├── server/
│   ├── uploads/
│   ├── faiss_index/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
```

---

# Security Features

* JWT-protected APIs
* Password hashing using bcrypt
* Multi-user vector isolation
* Protected dashboard routes
* Secure environment variables
* File validation middleware
* Upload size restrictions
* Company-level document isolation

---

# Anti-Hallucination Strategy

Contexta AI prevents hallucinations using Retrieval-Augmented Generation (RAG).

The model is explicitly instructed to answer ONLY using retrieved document context.

If relevant information is unavailable, the system responds with:

```text
I could not find that information in the uploaded documents.
```

Additional safeguards:

* Temperature set to 0
* Context-only prompting
* Semantic retrieval filtering
* Top-k chunk retrieval
* Multi-user vector isolation

---

# API Endpoints

## Authentication

```http
POST /api/auth/signup
POST /api/auth/login
```

---

## Documents

```http
POST   /api/documents
GET    /api/documents
DELETE /api/documents/:id
```

---

## Chat

```http
POST /api/chat
```

Example Request:

```json
{
  "question": "What is the refund policy?"
}
```

Example Response:

```json
{
  "success": true,
  "answer": "Customers can request refunds within 7 days.",
  "sources": [
    {
      "filename": "refund-policy.pdf"
    }
  ]
}
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/contexta-ai.git
cd contexta-ai
```

---

## Backend Setup

```bash
cd server
npm install
```

Create `.env`

```env
PORT=5001
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GOOGLE_API_KEY=your_gemini_api_key
```

Start backend:

```bash
npm run dev
```

---

## Frontend Setup

```bash
cd client
npm install
npm run dev
```

---

# Deployment

## Frontend Deployment

Deploy frontend using:

* Vercel

---

## Backend Deployment

Deploy backend using:

* Render

---

## Database

Use:

* MongoDB Atlas Free Tier

---

# Widget Integration

Each company gets a dedicated widget route:

```text
/widget/:companyId
```

Embed on external websites using:

```html
<iframe
  src="https://yourapp.com/widget/company123"
  width="350"
  height="500"
  style="border:none;"
></iframe>
```

---

# Performance Optimizations

* Embeddings generated ONLY during upload
* Reusable FAISS vector indexes
* Chunk overlap for retrieval quality
* Minimal Gemini API calls
* Top-k semantic retrieval
* Local-first vector architecture

---

# Engineering Concepts Demonstrated

* Full-stack MERN architecture
* SaaS multi-tenancy
* Retrieval-Augmented Generation (RAG)
* Semantic vector search
* Prompt engineering
* AI hallucination prevention
* Local vector databases
* Modular backend architecture
* Authentication & authorization
* File ingestion pipelines
* Production deployment

---

# Challenges Solved

## Hallucination Prevention

Implemented strict context-grounded prompting with semantic retrieval.

## Multi-Tenant Isolation

Created user-specific FAISS vector stores to prevent cross-company retrieval.

## PDF Ingestion Pipeline

Built a complete upload → extraction → chunking → embedding workflow.

## Retrieval Quality

Used chunk overlap and semantic search to improve answer relevance.

---

# Future Improvements

* Cloud vector database migration
* Streaming AI responses
* OCR support for scanned PDFs
* Advanced analytics dashboard
* Real-time collaboration
* Multi-language support
* AWS deployment architecture

---

# Resume Description

Built a full-stack AI-powered SaaS customer support platform using MERN, Gemini API, FAISS vector search, and Retrieval-Augmented Generation (RAG), enabling businesses to deploy grounded document-aware AI chatbots with semantic retrieval and multi-tenant isolation.

---

# Screenshots To Include

Recommended screenshots:

1. Login Page
2. Dashboard Overview
3. PDF Upload System
4. Chat Interface
5. RAG Retrieval Demo
6. Widget Embedded on External Website
7. Architecture Diagram

---

# Learning Outcomes

This project demonstrates practical understanding of:

* AI application engineering
* Retrieval systems
* Vector search
* Full-stack SaaS architecture
* Prompt engineering
* Production deployment
* Backend scalability principles
* Modern MERN development

---

# Final Notes

Contexta AI was intentionally designed with a local-first architecture to prioritize learning, cost-efficiency, and engineering clarity over unnecessary cloud complexity.

The project focuses on building a stable, grounded, and production-ready RAG system rather than over-engineered AI hype systems.

---

# Author

Dhruv Panchal

Full-Stack Developer | MERN | AI/RAG Systems | SaaS Engineering
