import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from vectordb.store import get_or_create_collection
from vectordb.search import search


def main() -> None:
    collection = get_or_create_collection()
    print("DocQuery Search — type a query or 'quit' to exit\n")

    while True:
        try:
            query = input("Query> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye.")
            break

        if query.lower() == "quit":
            print("Goodbye.")
            break

        if not query:
            continue

        results = search(collection, query, n_results=3)

        if not results:
            print("No results found.\n")
            continue

        print()
        for i, hit in enumerate(results, 1):
            print(f"[{i}] Score: {hit['score']:.4f} | {hit['source']} — Page {hit['page_number']} ({hit['modality']})")
            snippet = hit["text"][:200].replace("\n", " ")
            print(f"    {snippet}...")
            print()


if __name__ == "__main__":
    main()
