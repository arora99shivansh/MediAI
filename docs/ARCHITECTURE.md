# MediAI Architecture

MediAI is built as an enterprise-grade healthcare SaaS product, utilizing a robust, scalable architecture with separation of concerns.

## Component Diagram

```mermaid
flowchart LR
    subgraph Client
        UI[Streamlit UI - Custom Design System]
    end
    subgraph API
        Gateway[FastAPI Gateway]
        Exceptions[Global Exception Handler]
        Auth[Authentication Layer]
        Routes[REST Routes]
        Metrics[Prometheus Middleware]
    end
    subgraph Intelligence
        RAG[RAG Service]
        Parser[PyPDF2 pdfplumber python-docx]
        Splitter[RecursiveCharacterTextSplitter]
        Embeddings[SentenceTransformer bge-small-en-v1.5]
        Vector[FAISS Vector Store]
        LLM[Groq Llama]
    end
    subgraph Data
        Repo[Repository Pattern Layer]
        Mongo[(MongoDB Atlas)]
        Files[(Encrypted-ready file volume)]
    end
    
    UI --> Gateway
    Gateway --> Exceptions
    Gateway --> Auth --> Routes
    Routes --> Repo
    Routes --> RAG
    RAG --> Parser --> Splitter --> Embeddings --> Vector
    RAG --> Repo
    RAG --> Files
    Routes --> LLM
    Gateway --> Metrics
    Repo --> Mongo
```

## ER Diagram

```mermaid
erDiagram
    users ||--o{ documents : uploads
    users ||--o{ chat_history : owns
    users ||--o{ sessions : has
    users ||--o{ analytics : emits
    documents ||--o{ embeddings : chunks

    users {
        objectId _id
        string email
        string full_name
        string role
        string password_hash
        bool is_verified
        bool disabled
        datetime created_at
        datetime last_login_at
    }
    documents {
        objectId _id
        string user_id
        string filename
        string content_type
        int size_bytes
        int chunk_count
        string storage_path
        datetime created_at
    }
    embeddings {
        objectId _id
        string user_id
        string document_id
        string filename
        int page
        string text
        float[] embedding
        datetime created_at
    }
    chat_history {
        objectId _id
        string user_id
        string title
        bool pinned
        object[] messages
        int message_count
        datetime updated_at
    }
    sessions {
        objectId _id
        string user_id
        string refresh_token_hash
        datetime expires_at
    }
    analytics {
        objectId _id
        string event
        string user_id
        object metadata
        datetime created_at
    }
```

## Key Architectural Decisions

1. **Repository Pattern**: All MongoDB queries are abstracted through a repository layer (e.g., `UserRepository`, `BaseRepository`) ensuring separation of concerns between business logic and database operations.
2. **Global Exception Handling**: FastAPI utilizes a global exception handling middleware that catches `HTTPException`, `RequestValidationError`, and unhandled `Exception`s, standardizing error output to a strict JSON structure for predictable frontend consumption.
3. **Robust Data Validation**: Comprehensive Pydantic V2 schemas enforce strict data validation, character length constraints, and password complexity requirements before requests hit the business logic.
4. **FAANG-grade UI**: The Streamlit interface uses injected CSS tokens, customized DOM component mapping, and semantic HTML builders to completely overwrite standard generic elements into a premium, responsive ChatGPT-style UI.

## Request Flow

1. User authenticates through `/api/v1/auth/login`.
2. Frontend stores JWT access and refresh tokens in Streamlit session state.
3. Uploaded files are validated, stored, parsed, chunked, embedded, and indexed in FAISS.
4. Chat requests retrieve relevant chunks via `VectorStore`, build a cautious medical prompt, call Groq LLM, persist the conversation via `Repository`, and return streaming citations.
5. Global middlewares handle Rate Limiting (SlowAPI), Metrics (Prometheus), Request ID tracing, and Security Headers.
