import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from mcp.server.fastmcp import FastMCP

from mcp_tools.web_search import web_search as _web_search
from mcp_tools.code_executor import run_python as _run_python
from mcp_tools.file_reader import read_file as _read_file

mcp = FastMCP("DocQuery Tools")


@mcp.tool()
def web_search(query: str) -> str:
    """Search the web for current information not in documents"""
    return _web_search(query)


@mcp.tool()
def run_python(code: str) -> str:
    """Execute Python code and return the output"""
    return _run_python(code)


@mcp.tool()
def read_file(filename: str) -> str:
    """Read a file from the uploads folder by filename"""
    return _read_file(filename)


if __name__ == "__main__":
    mcp.run()
