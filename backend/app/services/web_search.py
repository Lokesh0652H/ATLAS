import ipaddress
import socket
import logging
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

    def search_web(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Execute real live web search using DuckDuckGo provider with SSRF protections.
        Returns verified web sources with title, url, and snippet.
        """
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
            logger.warning(f"Web search provider error for query '{query}': {exc}")

        return results

web_search_service = WebSearchService()
