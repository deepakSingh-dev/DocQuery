from typing import TypedDict

from langgraph.graph import StateGraph, END

from agent.nodes import retrieve_node, evaluate_node, requery_node, generate_node
from agent.planner import plan
from mcp_tools.web_search import web_search
from mcp_tools.code_executor import run_python
from rag.citations import CitedAnswer


class AgentState(TypedDict):
    original_query: str
    current_query: str
    all_chunks: list[dict]
    attempt_count: int
    needs_requery: bool
    final_answer: CitedAnswer | None
    _last_chunk_count: int
    route: str


def _traced(name: str, fn):
    def wrapper(state):
        print(f"[Graph] Node: {name}")
        return fn(state)
    return wrapper


def planner_node(state: AgentState) -> AgentState:
    state["route"] = plan(state["original_query"])
    return state


def web_search_node(state: AgentState) -> AgentState:
    query = state["original_query"]
    results_text = web_search(query)
    state["all_chunks"] = [{
        "text": results_text,
        "source": "web_search",
        "page_number": 1,
        "modality": "text",
        "score": 1.0,
    }]
    return state


def code_exec_node(state: AgentState) -> AgentState:
    query = state["original_query"]
    output = run_python(query)
    state["all_chunks"] = [{
        "text": f"Code execution output:\n{output}",
        "source": "code_executor",
        "page_number": 1,
        "modality": "text",
        "score": 1.0,
    }]
    return state


def _route_after_planner(state: AgentState) -> str:
    return state.get("route", "answer_from_docs")


def _route_after_evaluate(state: AgentState) -> str:
    if state.get("needs_requery") and state.get("attempt_count", 0) < 3:
        return "requery"
    return "generate"


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("planner", _traced("planner_node", planner_node))
    graph.add_node("retrieve", _traced("retrieve_node", retrieve_node))
    graph.add_node("evaluate", _traced("evaluate_node", evaluate_node))
    graph.add_node("requery", _traced("requery_node", requery_node))
    graph.add_node("web_search", _traced("web_search_node", web_search_node))
    graph.add_node("code_exec", _traced("code_exec_node", code_exec_node))
    graph.add_node("generate", _traced("generate_node", generate_node))

    graph.set_entry_point("planner")

    graph.add_conditional_edges(
        "planner",
        _route_after_planner,
        {
            "answer_from_docs": "retrieve",
            "search_web": "web_search",
            "run_code": "code_exec",
        },
    )

    graph.add_edge("retrieve", "evaluate")
    graph.add_conditional_edges(
        "evaluate",
        _route_after_evaluate,
        {"requery": "requery", "generate": "generate"},
    )
    graph.add_edge("requery", "retrieve")

    graph.add_edge("web_search", "generate")
    graph.add_edge("code_exec", "generate")
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
        "route": "",
    }

    final_state = app.invoke(initial_state)
    return final_state["final_answer"]
