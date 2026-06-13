"""Ask CLI.

Command-line entry point for end-to-end question answering: runs the LangGraph
agent for a question and prints the cited answer, with an optional --verbose
flag to show the full agent trace.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agent.graph import run_agent


def main() -> None:
    args = sys.argv[1:]

    if not args or args[0].startswith("-") and args[0] != "--verbose":
        print("Usage: python3 scripts/ask.py \"your question\" [--verbose]")
        sys.exit(1)

    verbose = "--verbose" in args
    query_args = [a for a in args if a != "--verbose"]
    query = " ".join(query_args)

    if not verbose:
        import logging
        logging.disable(logging.WARNING)

    result = run_agent(query)

    if result is None or not result.has_sufficient_context:
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
