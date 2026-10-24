import ipaddress
import socket
import logging
import httpx
from urllib.parse import urlparse
from typing import List, Dict, Any, Optional
from duckduckgo_search import DDGS
from app.config import settings

logger = logging.getLogger("atlas.web_search")

PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]

def is_safe_url(url: str) -> bool:
    """Validate URL to prevent Server-Side Request Forgery (SSRF) attacks."""
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ["http", "https"]:
            return False
        hostname = parsed.hostname
        if not hostname:
            return False
        if hostname.lower() in ["localhost", "127.0.0.1", "0.0.0.0"]:
            return False

        # Resolve IP and check against private subnets
        ip_str = socket.gethostbyname(hostname)
        ip = ipaddress.ip_address(ip_str)
        for net in PRIVATE_NETWORKS:
            if ip in net:
                return False
        return True
    except Exception:
        return False

class WebSearchService:
    def __init__(self):
        self.provider = settings.WEB_SEARCH_PROVIDER.lower()
        self.tavily_key = settings.TAVILY_API_KEY or settings.WEB_SEARCH_API_KEY

    def _search_tavily(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Query Tavily Search API."""
        if not self.tavily_key:
            return []

        url = "https://api.tavily.com/search"
        payload = {
            "api_key": self.tavily_key,
            "query": query,
            "search_depth": "basic",
            "include_answer": False,
            "max_results": max_results
        }

        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for item in data.get("results", []):
                    item_url = item.get("url", "")
                    if item_url and is_safe_url(item_url):
                        results.append({
                            "title": item.get("title") or "Web Source",
                            "url": item_url,
                            "snippet": item.get("content") or "",
                            "source_type": "web"
                        })
                return results
            else:
                logger.warning(f"Tavily search API returned status {resp.status_code}: {resp.text}")
                return []

    def _search_duckduckgo(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Query DuckDuckGo as fallback or primary provider."""
        results: List[Dict[str, Any]] = []
        try:
            with DDGS() as ddgs:
                ddg_results = list(ddgs.text(query, max_results=max_results))
                for item in ddg_results:
                    url = item.get("href") or item.get("url") or ""
                    title = item.get("title") or "Web Source"
                    body = item.get("body") or item.get("snippet") or ""

                    if url and is_safe_url(url):
                        results.append({
                            "title": title,
                            "url": url,
                            "snippet": body,
                            "source_type": "web"
                        })
        except Exception as exc:
            logger.warning(f"DuckDuckGo search error for query '{query}': {exc}")
        return results

    def search_web(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Execute live web search using configured provider (Tavily or DuckDuckGo).
        Includes SSRF protection and graceful fallback.
        """
        if self.provider == "tavily" and self.tavily_key:
            try:
                results = self._search_tavily(query, max_results=max_results)
                if results:
                    return results
            except Exception as exc:
                logger.warning(f"Tavily execution error, falling back to DDG: {exc}")

        return self._search_duckduckgo(query, max_results=max_results)

web_search_service = WebSearchService()
