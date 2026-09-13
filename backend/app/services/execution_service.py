import ast
import json
import logging
import os
import subprocess
import sys
import tempfile
import time
from app.config import Config

logger = logging.getLogger(__name__)

# Disallowed modules for security in the sandbox
BANNED_MODULES = {
    'os', 'sys', 'subprocess', 'socket', 'shutil', 'ctypes', 'pty', 
    'commands', 'posix', 'nt', 'resource', 'multiprocessing', 'threading',
    'http', 'urllib', 'requests', 'asyncio', 'webbrowser', 'code', 'codeop'
}

# Disallowed function calls
BANNED_BUILTINS = {
    'eval', 'exec', '__import__', 'compile', 'breakpoint'
}

class ASTSecurityChecker(ast.NodeVisitor):
    def __init__(self):
        self.violations = []

    def visit_Import(self, node):
        for alias in node.names:
            module_name = alias.name.split('.')[0]
            if module_name in BANNED_MODULES:
                self.violations.append(f"Importing '{alias.name}' is prohibited for security.")
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        if node.module:
            module_name = node.module.split('.')[0]
            if module_name in BANNED_MODULES:
                self.violations.append(f"Importing from '{node.module}' is prohibited for security.")
        self.generic_visit(node)

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name):
            if node.func.id in BANNED_BUILTINS:
                self.violations.append(f"Calling '{node.func.id}()' is prohibited.")
        elif isinstance(node.func, ast.Attribute):
            if node.func.attr in ('system', 'popen', 'spawn', 'kill', 'remove', 'rmdir', 'unlink'):
                self.violations.append(f"Calling attribute method '{node.func.attr}()' is prohibited.")
        self.generic_visit(node)


def validate_code_safety(code: str):
    """
    Statically analyzes code with AST to prevent security violations.
    Returns (is_safe: bool, error_message: str | None)
    """
    if len(code) > Config.MAX_CODE_SIZE:
        return False, f"Code size ({len(code)} bytes) exceeds the maximum allowed limit ({Config.MAX_CODE_SIZE} bytes)."

    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return False, f"Syntax Error: {e.msg} at line {e.lineno}"

    checker = ASTSecurityChecker()
    checker.visit(tree)

    if checker.violations:
        return False, "Security Policy Violation: " + " ".join(checker.violations)

    return True, None


def clean_traceback(tb_str: str, temp_dir: str) -> str:
    """Strip server internal file paths from tracebacks for user display."""
    lines = tb_str.splitlines()
    cleaned = []
    for line in lines:
        if temp_dir in line:
            line = line.replace(temp_dir, "/sandbox")
        cleaned.append(line)
    return "\n".join(cleaned)


def execute_python_code(code: str, timeout: int = None, algo_slug: str = None) -> dict:
    """
    Executes Python code in an isolated subprocess sandbox.
    Does NOT execute code inside the main Flask process.
    """
    if timeout is None:
        timeout = Config.EXECUTION_TIMEOUT

    # Step 1: Pre-execution AST security validation
    is_safe, security_error = validate_code_safety(code)
    if not is_safe:
        return {
            'success': False,
            'stdout': '',
            'stderr': security_error,
            'execution_time_ms': 0,
            'error': security_error
        }

    # Step 2: Prepare isolated sandbox directory
    with tempfile.TemporaryDirectory(prefix="mllab_sandbox_") as temp_dir:
        code_file_path = os.path.join(temp_dir, "solution.py")
        
        # Prepare optional dataset context if algorithm is specified
        dataset_loader_code = ""
        if algo_slug:
            try:
                from app.services.comparison_service import BUILTIN_ALGO_MAPPING
                from app.services.dataset_service import get_dataset_by_id, init_sample_datasets
                algo_cfg = BUILTIN_ALGO_MAPPING.get(algo_slug)
                dataset_key = algo_cfg.get('default_dataset') if algo_cfg else 'house_prices'
                ds_meta = get_dataset_by_id(dataset_key)
                if not ds_meta:
                    init_sample_datasets()
                    ds_meta = get_dataset_by_id(dataset_key)

                if ds_meta:
                    data_csv_path = os.path.join(temp_dir, "dataset.csv")
                    ds_meta['df'].to_csv(data_csv_path, index=False)
                    features_repr = json.dumps(ds_meta['features'])
                    target_repr = json.dumps(ds_meta['target'])

                    dataset_loader_code = f"""
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

_df = pd.read_csv("dataset.csv")
_features = {features_repr}
_target = {target_repr}
X = _df[_features].values
y = _df[_target].values if _target else None

if _target is not None:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
else:
    X_train = X
    X_test = X
    y_train = None
    y_test = None
"""
            except Exception as e:
                logger.warning(f"Could not prepare dataset for {algo_slug}: {e}")

        # Wrapper script that executes code and controls stdout
        wrapper_code = f"""# -*- coding: utf-8 -*-
import sys
import io

{dataset_loader_code}

# Sandboxed execution context
try:
{_indent_code(code, 4)}
except Exception as e:
    import traceback
    sys.stderr.write(traceback.format_exc())
    sys.exit(1)
"""
        with open(code_file_path, "w", encoding="utf-8") as f:
            f.write(wrapper_code)

        start_time = time.perf_counter()
        try:
            # Launch isolated process with current python interpreter
            cmd = [sys.executable, code_file_path]
            
            # Isolated environment with temporary directory
            safe_env = os.environ.copy()
            safe_env['PYTHONIOENCODING'] = 'utf-8'
            safe_env['TMP'] = temp_dir
            safe_env['TEMP'] = temp_dir

            process = subprocess.Popen(
                cmd,
                cwd=temp_dir,
                env=safe_env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding="utf-8",
                errors="replace"
            )

            stdout, stderr = process.communicate(timeout=timeout)
            exec_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

            # Limit output sizes to avoid frontend or memory crashes
            if len(stdout) > Config.MAX_OUTPUT_SIZE:
                stdout = stdout[:Config.MAX_OUTPUT_SIZE] + "\n[Output truncated: maximum display limit reached]"
            if len(stderr) > Config.MAX_OUTPUT_SIZE:
                stderr = stderr[:Config.MAX_OUTPUT_SIZE] + "\n[Stderr truncated: maximum display limit reached]"

            cleaned_stderr = clean_traceback(stderr, temp_dir)

            if process.returncode == 0:
                final_stdout = stdout
                if not final_stdout.strip():
                    if algo_slug:
                        final_stdout = f"[Execution Successful: Code ran with exit code 0]\nDataset '{algo_slug}' was prepared with X_train, y_train, X_test, y_test.\nTip: Use print(...) to see your output, or click 'Test & Compare' to benchmark against Scikit-learn!\n"
                    else:
                        final_stdout = "[Execution Successful: Code ran with exit code 0]\n(Tip: Use print(...) to display variables or calculations in the console)\n"
                return {
                    'success': True,
                    'stdout': final_stdout,
                    'stderr': cleaned_stderr,
                    'execution_time_ms': exec_time_ms,
                    'error': None
                }
            else:
                return {
                    'success': False,
                    'stdout': stdout,
                    'stderr': cleaned_stderr,
                    'execution_time_ms': exec_time_ms,
                    'error': cleaned_stderr or "Execution failed with non-zero exit code"
                }

        except subprocess.TimeoutExpired:
            process.kill()
            stdout, stderr = process.communicate()
            return {
                'success': False,
                'stdout': stdout or '',
                'stderr': f"Execution Timed Out: Code exceeded the {timeout}s limit.",
                'execution_time_ms': round(timeout * 1000, 2),
                'error': f"Time Limit Exceeded ({timeout}s)"
            }
        except Exception as e:
            return {
                'success': False,
                'stdout': '',
                'stderr': str(e),
                'execution_time_ms': 0,
                'error': f"Internal Execution Sandbox Error: {str(e)}"
            }


def _indent_code(code: str, spaces: int) -> str:
    indent = " " * spaces
    return "\n".join(indent + line if line.strip() else line for line in code.splitlines())
