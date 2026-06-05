from duckduckgo_search import DDGS


def web_search(query: str, max_results: int = 5) -> str:
    try:
        results = []
        with DDGS() as ddgs:
            for i, r in enumerate(ddgs.text(query, max_results=max_results), 1):
                results.append(
                    f"[{i}] {r.get('title', '')}\n"
                    f"{r.get('href', '')}\n"
                    f"{r.get('body', '')}"
                )
        if not results:
            return "No results found."
        return "\n\n".join(results)
    except Exception as e:
        return f"Web search error: {e}"
