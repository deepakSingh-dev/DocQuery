from typing import TypedDict

from langgraph.graph import StateGraph, END

from agent.nodes import retrieve_node, evaluate_node, requery_node, generate_node
from rag.citations import CitedAnswer


class AgentState(TypedDict):
    original_query: str
    current_query: str
    all_chunks: list[dict]
    attempt_count: int
    needs_requery: bool
    final_answer: CitedAnswer | None
    _last_chunk_count: int


def _route_after_evaluate(state: AgentState) -> str:
    if state.get("needs_requery") and state.get("attempt_count", 0) < 3:
        return "requery"
    return "generate"


def _traced(name: str, fn):
    def wrapper(state):
        print(f"[Graph] Node: {name}")
        return fn(state)
    return wrapper


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("retrieve", _traced("retrieve_node", retrieve_node))
    graph.add_node("evaluate", _traced("evaluate_node", evaluate_node))
    graph.add_node("requery", _traced("requery_node", requery_node))
    graph.add_node("generate", _traced("generate_node", generate_node))

    graph.set_entry_point("retrieve")
    graph.add_edge("retrieve", "evaluate")
    graph.add_conditional_edges(
        "evaluate",
        _route_after_evaluate,
        {"requery": "requery", "generate": "generate"},
    )
    graph.add_edge("requery", "retrieve")
    graph.add_edge("generate", END)

    return graph


def run_agent(query: str) -> CitedAnswer:
    graph = build_graph()
    app = graph.compile()

    initial_state: AgentState = {
        "original_query": query,
        "current_query": query,
        "all_chunks": [],
        "attempt_count": 0,
        "needs_requery": False,
        "final_answer": None,
        "_last_chunk_count": 0,
    }

    final_state = app.invoke(initial_state)
    return final_state["final_answer"]
