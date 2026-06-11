import subprocess
import sys
import tempfile
import os

BLOCKED_IMPORTS = {"os", "sys", "subprocess", "shutil"}


def _strip_blocked_imports(code: str) -> str:
    filtered = []
    for line in code.splitlines():
        stripped = line.strip()
        skip = False
        for mod in BLOCKED_IMPORTS:
            if stripped.startswith(f"import {mod}") or stripped.startswith(f"from {mod}"):
                skip = True
                break
        if not skip:
            filtered.append(line)
    return "\n".join(filtered)


def run_python(code: str) -> str:
    safe_code = _strip_blocked_imports(code)

    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
        f.write(safe_code)
        tmp_path = f.name

    try:
        result = subprocess.run(
            [sys.executable, tmp_path],
            capture_output=True,
            text=True,
            timeout=10,
        )
        output = result.stdout
        if result.stderr:
            output += "\nSTDERR:\n" + result.stderr
        return output.strip() or "(no output)"
    except subprocess.TimeoutExpired:
        return "Execution timed out after 10 seconds"
    except Exception as e:
        return f"Execution error: {e}"
    finally:
        os.unlink(tmp_path)
