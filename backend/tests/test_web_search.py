from app.services.web_search import is_safe_url, web_search_service

def test_ssrf_protection():
    # Dangerous private and internal URLs must be strictly blocked
    assert is_safe_url("http://127.0.0.1/admin") is False
    assert is_safe_url("http://localhost:8000/internal") is False
    assert is_safe_url("http://192.168.1.1/router") is False
    assert is_safe_url("http://10.0.0.5/secrets") is False
    assert is_safe_url("ftp://example.com/file") is False
    assert is_safe_url("file:///etc/passwd") is False

    # Public valid URLs are permitted
    assert is_safe_url("https://www.nature.com/articles/s41586-020-2649-2") is True
    assert is_safe_url("https://en.wikipedia.org/wiki/Quantum_computing") is True

def test_web_search_structure():
    # Test structure with offline fallback or DDGS provider
    results = web_search_service.search_web("quantum computing physics", max_results=3)
    assert isinstance(results, list)
    for r in results:
        assert "title" in r
        assert "url" in r
        assert "snippet" in r
        assert r["source_type"] == "web"
