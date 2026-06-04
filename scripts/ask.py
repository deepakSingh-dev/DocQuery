import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from rag.retriever import retrieve
from rag.generator import generate


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/ask.py \"your question here\"")
        sys.exit(1)

    query = sys.argv[1]

    chunks = retrieve(query)
    result = generate(query, chunks)

    if not result.has_sufficient_context:
        print("\n⚠️  Not enough relevant content found in your documents.")
        return

    print(f"\nAnswer: {result.answer}")
    print(f"\nConfidence: {result.confidence:.0%}")

    if result.citations:
        print("\nSources:")
        for i, c in enumerate(result.citations, 1):
            print(f"  [{i}] {c.source} — Page {c.page_number} ({c.modality})")
            print(f'      "{c.excerpt}"')


if __name__ == "__main__":
    main()
