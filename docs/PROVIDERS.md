# ATLAS Provider Configurations

Atlas features pluggable provider abstractions for embeddings, LLM generation, and web search.

## 1. Embedding Providers
- **Local (Default)**: Uses `sentence-transformers` (`all-MiniLM-L6-v2`) or local fast vector encoder. Dimension: 384. Zero paid API keys required.
- **OpenAI**: `text-embedding-3-small` (1536-d) or `text-embedding-3-large` (3072-d).
- **Gemini**: `text-embedding-004` (768-d).

## 2. LLM Providers
- **Local (Default)**: Built-in deterministic evidence extraction and synthesis engine. Ideal for offline execution, air-gapped environments, and zero-cost local evaluation.
- **OpenAI**: `gpt-4o`, `gpt-4o-mini`.
- **Gemini**: `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-2.0-flash`.
- **Anthropic**: `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`.
- **Ollama**: Connects to locally running models (e.g., `llama3.1`, `mistral`, `qwen2.5`).

## 3. Web Search Providers
- **DuckDuckGo (Default)**: Real live search via DuckDuckGo with zero API keys required.
- **Tavily / Serper**: Configurable high-depth search engines for enterprise academic retrieval.
