# API Documentation

Interactive Swagger documentation is available at `/docs` once the backend is running.

## Authentication

- `POST /api/v1/auth/register`: Create user and issue email verification token.
- `POST /api/v1/auth/login`: Return access and refresh tokens.
- `POST /api/v1/auth/logout`: Revoke refresh token.
- `POST /api/v1/auth/refresh`: Rotate refresh token and return new access token.
- `POST /api/v1/auth/forgot-password`: Issue reset token.
- `POST /api/v1/auth/reset-password`: Reset password and revoke sessions.
- `POST /api/v1/auth/verify-email`: Verify email address.
- `GET /api/v1/auth/me`: Return current user.

## Chat

- `POST /api/v1/chat`: Return complete answer with citations.
- `POST /api/v1/chat/stream`: Server-sent token stream with final chat id and citations.
- `GET /api/v1/chat/history`: List chats.
- `GET /api/v1/chat/{chat_id}`: Fetch a chat.
- `PATCH /api/v1/chat/rename/{chat_id}`: Rename chat.
- `PATCH /api/v1/chat/pin/{chat_id}`: Pin or unpin chat.
- `DELETE /api/v1/chat/delete/{chat_id}`: Delete chat.
- `GET /api/v1/chat/export/{chat_id}`: Export chat JSON.
- `GET /api/v1/chat/search?q=...`: Search chat history.

## Documents and Search

- `POST /api/v1/upload`: Upload one or more PDF, DOCX, or TXT files.
- `GET /api/v1/documents`: List uploaded documents.
- `DELETE /api/v1/documents/{document_id}`: Delete a document and its chunks.
- `POST /api/v1/search`: Semantic search over uploaded documents.

## Operations

- `GET /api/v1/admin/dashboard`: Admin dashboard metrics.
- `GET /api/v1/health`: Database-backed health check.
- `GET /metrics`: Prometheus metrics.
