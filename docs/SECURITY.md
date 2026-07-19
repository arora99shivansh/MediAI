# Security Model

- Passwords are hashed with bcrypt and never stored in plain text.
- JWT access tokens are short-lived and refresh tokens are random, hashed, persisted, expiring sessions.
- Routes use bearer authentication and role-based dependencies.
- Uploads accept only `.pdf`, `.docx`, and `.txt` and enforce a size limit.
- CORS, rate limiting, secure response headers, and Pydantic validation are enabled.
- File paths are generated server-side with UUID prefixes to avoid user-controlled storage paths.
- Medical answers are grounded in uploaded context and include red-flag and disclaimer instructions.

## Recommended Hardening

- Add malware scanning for high-risk enterprise upload environments.
- Move uploaded files to Azure Blob Storage with customer-managed encryption.
- Replace token-returning email flows with a transactional email provider.
- Add SSO through Microsoft Entra ID for enterprise deployments.
