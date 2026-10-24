# ATLAS Security & Privacy Architecture

## 1. Multi-Tenant Workspace Isolation
Every database query against documents, chunks, research sessions, citations, or evaluations explicitly includes the `workspace_id` filter. Cross-workspace access is strictly rejected with HTTP 403 / 404.

## 2. Authentication & Session Management
- Passwords are encrypted using modern `bcrypt`.
- JWT session tokens use HMAC-SHA256 with strong secrets (`ATLAS_SECRET_KEY`).
- Token expiration and revocation mechanisms are built-in.

## 3. Storage Security
- Uploaded files are kept outside the web root (`storage/uploads/`).
- Content-type validation, MIME magic checks, and SHA-256 integrity checks prevent executable uploads.
- Path traversal (`../`) is strictly sanitized and blocked.

## 4. SSRF & External Research Security
- External web search implements private IP filtering (blocks `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`).
- Redirect loops and excessive payload limits are enforced.

## 5. Prompt Injection Defense
- Retrieved document passages and external web snippets are wrapped in isolated XML/Markdown boundary blocks.
- Strict system prompt directives enforce role boundaries and prevent instruction overriding.
