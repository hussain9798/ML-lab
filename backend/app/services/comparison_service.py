import ast
import json
import logging
import os
import subprocess
import sys
import tempfile
import time
import numpy as np
import pandas as pd
from app.config import Config
from app.services.dataset_service import get_dataset_by_id, init_sample_datasets
from app.services.execution_service import validate_code_safety, clean_traceback

logger = logging.getLogger(__name__)

BUILTIN_ALGO_MAPPING = {
    'linear-regression': {
        'class': 'sklearn.linear_model.LinearRegression',
        'init': 'LinearRegression()',
        'category': 'regression',
        'default_dataset': 'house_prices',
        'tolerance': 0.05,
        'metric_key': 'r2_score'
    },
    'polynomial-regression': {
        'class': 'sklearn.preprocessing.PolynomialFeatures, sklearn.linear_model.LinearRegression',
        'init': 'LinearRegression()',
        'category': 'regression',
        'default_dataset': 'house_prices',
        'tolerance': 0.06,
        'metric_key': 'r2_score'
    },
    'logistic-regression': {
        'class': 'sklearn.linear_model.LogisticRegression',
        'init': 'LogisticRegression(max_iter=1000)',
        'category': 'classification',
        'default_dataset': 'churn',
        'tolerance': 0.08,
        'metric_key': 'accuracy'
    },
    'knn': {
        'class': 'sklearn.neighbors.KNeighborsClassifier',
        'init': 'KNeighborsClassifier(n_neighbors=3)',
        'category': 'classification',
        'default_dataset': 'iris',
        'tolerance': 0.08,
        'metric_key': 'accuracy'
    },
    'decision-tree': {
        'class': 'sklearn.tree.DecisionTreeClassifier',
        'init': 'DecisionTreeClassifier(max_depth=5, random_state=42)',
        'category': 'classification',
        'default_dataset': 'iris',
        'tolerance': 0.10,
        'metric_key': 'accuracy'
    },
    'random-forest': {
        'class': 'sklearn.ensemble.RandomForestClassifier',
        'init': 'RandomForestClassifier(n_estimators=20, max_depth=5, random_state=42)',
        'category': 'classification',
        'default_dataset': 'iris',
        'tolerance': 0.10,
        'metric_key': 'accuracy'
    },
    'svm': {
        'class': 'sklearn.svm.SVC',
        'init': 'SVC(kernel="linear")',
        'category': 'classification',
        'default_dataset': 'iris',
        'tolerance': 0.10,
        'metric_key': 'accuracy'
    },
    'naive-bayes': {
        'class': 'sklearn.naive_bayes.GaussianNB',
        'init': 'GaussianNB()',
        'category': 'classification',
        'default_dataset': 'iris',
        'tolerance': 0.10,
        'metric_key': 'accuracy'
    },
    'k-means': {
        'class': 'sklearn.cluster.KMeans',
        'init': 'KMeans(n_clusters=3, random_state=42, n_init=10)',
        'category': 'clustering',
        'default_dataset': 'customer_blobs',
        'tolerance': 0.15,
        'metric_key': 'inertia'
    }
}


def run_comparison_test(algo_slug: str, user_code: str, dataset_id: str = None, custom_tolerance: float = None) -> dict:
    """
    Executes the user's scratch implementation and compares it against Scikit-learn
    under the exact same dataset, test split, and hyperparameters.
    """
    algo_config = BUILTIN_ALGO_MAPPING.get(algo_slug, BUILTIN_ALGO_MAPPING['linear-regression'])
    category = algo_config['category']
    tolerance = custom_tolerance if custom_tolerance is not None else algo_config['tolerance']
    dataset_key = dataset_id or algo_config['default_dataset']

    # Pre-execution security check on user code
    is_safe, sec_err = validate_code_safety(user_code)
    if not is_safe:
        return {
            'success': False,
            'error': sec_err,
            'scratch_result': None,
            'builtin_result': None,
            'verdict': {
                'passed': False,
                'message': 'Code execution blocked by security policy.',
                'difference': None
            }
        }

    # Fetch dataset
    ds_meta = get_dataset_by_id(dataset_key)
    if not ds_meta:
        init_sample_datasets()
        ds_meta = get_dataset_by_id(algo_config['default_dataset'])

    df = ds_meta['df']
    features = ds_meta['features']
    target = ds_meta['target']

    # Create harness test script that executes in isolated subprocess
    with tempfile.TemporaryDirectory(prefix="mllab_test_") as temp_dir:
        # Save dataset to CSV in temp directory
        data_csv_path = os.path.join(temp_dir, "test_data.csv")
        df.to_csv(data_csv_path, index=False)

        harness_script_path = os.path.join(temp_dir, "harness.py")
        harness_code = _build_harness_script(
            algo_slug=algo_slug,
            category=category,
            features=features,
            target=target,
            data_csv_name="test_data.csv",
            user_code=user_code
        )

        with open(harness_script_path, "w", encoding="utf-8") as f:
            f.write(harness_code)

        start_total = time.perf_counter()
        try:
            safe_env = os.environ.copy()
            safe_env['PYTHONIOENCODING'] = 'utf-8'
            safe_env['TMP'] = temp_dir
            safe_env['TEMP'] = temp_dir

            proc = subprocess.Popen(
                [sys.executable, harness_script_path],
                cwd=temp_dir,
                env=safe_env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding="utf-8",
                errors="replace"
            )

            stdout, stderr = proc.communicate(timeout=Config.EXECUTION_TIMEOUT + 4)
            cleaned_stderr = clean_traceback(stderr, temp_dir)

            if proc.returncode != 0 or not stdout.strip():
                err_msg = cleaned_stderr or "Execution failed without output."
                return {
                    'success': False,
                    'error': err_msg,
                    'stdout': stdout,
                    'stderr': cleaned_stderr,
                    'scratch_result': None,
                    'builtin_result': None,
                    'verdict': {
                        'passed': False,
                        'message': f"❌ Execution error: {err_msg}",
                        'difference': None
                    }
                }

            # Parse JSON results output from test harness
            # Look for JSON payload in stdout
            json_start = stdout.find("<<<JSON_RESULTS_START>>>")
            json_end = stdout.find("<<<JSON_RESULTS_END>>>")

            if json_start == -1 or json_end == -1:
                return {
                    'success': False,
                    'error': "Failed to parse structured test results from code output.",
                    'stdout': stdout,
                    'stderr': cleaned_stderr,
                    'scratch_result': None,
                    'builtin_result': None,
                    'verdict': {
                        'passed': False,
                        'message': "Test harness could not extract valid predictions or metrics.",
                        'difference': None
                    }
                }

            json_raw = stdout[json_start + len("<<<JSON_RESULTS_START>>>"):json_end].strip()
            test_data = json.loads(json_raw)

            # Evaluate comparison and verdict
            verdict = _evaluate_verdict(test_data, category, algo_config['metric_key'], tolerance)

            return {
                'success': True,
                'error': None,
                'stdout': stdout[:json_start].strip(),
                'stderr': cleaned_stderr,
                'scratch_result': test_data.get('scratch'),
                'builtin_result': test_data.get('builtin'),
                'comparison_metrics': test_data.get('comparison_metrics'),
                'visualizations': test_data.get('visualizations'),
                'verdict': verdict
            }

        except subprocess.TimeoutExpired:
            proc.kill()
            return {
                'success': False,
                'error': f"Execution Timed Out ({Config.EXECUTION_TIMEOUT}s limit). Check for infinite loops in fit() or predict().",
                'scratch_result': None,
                'builtin_result': None,
                'verdict': {
                    'passed': False,
                    'message': "❌ Test timed out during execution.",
                    'difference': None
                }
            }
        except Exception as e:
            logger.exception("Error running comparison test")
            return {
                'success': False,
                'error': str(e),
                'scratch_result': None,
                'builtin_result': None,
                'verdict': {
                    'passed': False,
                    'message': f"❌ System error: {str(e)}",
                    'difference': None
                }
            }


def _evaluate_verdict(test_data: dict, category: str, primary_metric: str, tolerance: float) -> dict:
    scratch = test_data.get('scratch', {})
    builtin = test_data.get('builtin', {})

    if not scratch or not scratch.get('success'):
        return {
            'passed': False,
            'message': f"❌ Scratch implementation failed: {scratch.get('error', 'Unknown error')}",
            'primary_metric': primary_metric,
            'scratch_metric': None,
            'builtin_metric': builtin.get('metrics', {}).get(primary_metric) if builtin else None,
            'difference': None,
            'tolerance': tolerance
        }

    s_metrics = scratch.get('metrics', {})
    b_metrics = builtin.get('metrics', {})

    s_val = s_metrics.get(primary_metric, 0)
    b_val = b_metrics.get(primary_metric, 0)

    if category == 'clustering':
        # For inertia, check relative difference
        if b_val != 0:
            diff = abs(s_val - b_val) / abs(b_val)
        else:
            diff = abs(s_val - b_val)
        passed = diff <= tolerance
    else:
        diff = abs(s_val - b_val)
        passed = diff <= tolerance

    diff_rounded = round(float(diff), 4)
    s_rounded = round(float(s_val), 4)
    b_rounded = round(float(b_val), 4)

    if passed:
        msg = (f"✅ Your implementation is correct! "
               f"Scratch {primary_metric} ({s_rounded}) is within accepted tolerance "
               f"(Δ = {diff_rounded} <= {tolerance}) of the built-in library ({b_rounded}).")
    else:
        msg = (f"❌ Implementation needs improvement. "
               f"Scratch {primary_metric} is {s_rounded}, but built-in library achieved {b_rounded} "
               f"(Difference: {diff_rounded}, Allowed: {tolerance}).")

    return {
        'passed': passed,
        'message': msg,
        'primary_metric': primary_metric,
        'scratch_metric': s_rounded,
        'builtin_metric': b_rounded,
        'difference': diff_rounded,
        'tolerance': tolerance
    }


def _build_harness_script(algo_slug: str, category: str, features: list, target: str, data_csv_name: str, user_code: str) -> str:
    """Generates an automated execution and benchmarking script."""
    features_repr = json.dumps(features)
    target_repr = json.dumps(target)

    return f"""# -*- coding: utf-8 -*-
import json
import time
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# Load dataset
df = pd.read_csv("{data_csv_name}")
features = {features_repr}
target_col = {target_repr}

X = df[features].values
y = df[target_col].values if target_col else None

# Prepare test sample and train/test split
if target_col is not None:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
    sample_input = X_test[0:1]
else:
    X_train = X
    X_test = X
    y_train = None
    y_test = None
    sample_input = X[0:1]

# ----------------- User Code Execution -----------------
user_model = None
user_instance = None
scratch_metrics = {{}}
scratch_sample_pred = None
scratch_time = 0.0
scratch_err = None

# Inject user code namespace
user_namespace = {{
    'np': np,
    'numpy': np,
    'pd': pd,
    'pandas': pd,
    'X_train': X_train,
    'X_test': X_test,
    'y_train': y_train,
    'y_test': y_test
}}

try:
{_indent_code(user_code, 4)}
    
    # Locate user class or instance
    # Look for classes matching common patterns or any class with fit & predict
    for key, val in list(locals().items()):
        if isinstance(val, type) and hasattr(val, 'fit') and hasattr(val, 'predict'):
            user_model = val
            break
    
    # If no class found, check if user wrote script directly predicting
    if user_model is not None:
        user_instance = user_model()
        t0 = time.perf_counter()
        if target_col is not None:
            user_instance.fit(X_train, y_train)
            scratch_time = round((time.perf_counter() - t0) * 1000, 2)
            y_pred_scratch = user_instance.predict(X_test)
            scratch_sample_pred = float(np.ravel(user_instance.predict(sample_input))[0])
        else:
            user_instance.fit(X_train)
            scratch_time = round((time.perf_counter() - t0) * 1000, 2)
            y_pred_scratch = user_instance.predict(X_test)
            scratch_sample_pred = int(np.ravel(user_instance.predict(sample_input))[0])

    elif 'predictions' in locals():
        y_pred_scratch = locals()['predictions']
        scratch_sample_pred = float(np.ravel(y_pred_scratch)[0]) if len(y_pred_scratch) > 0 else 0
    elif 'y_pred' in locals():
        y_pred_scratch = locals()['y_pred']
        scratch_sample_pred = float(np.ravel(y_pred_scratch)[0]) if len(y_pred_scratch) > 0 else 0
    else:
        raise ValueError("Could not find a class with fit() and predict() methods, or a 'predictions' variable.")

    y_pred_scratch = np.array(y_pred_scratch).ravel()
    
    if "{category}" == "regression":
        scratch_metrics = {{
            'mse': round(float(mean_squared_error(y_test, y_pred_scratch)), 4),
            'rmse': round(float(np.sqrt(mean_squared_error(y_test, y_pred_scratch))), 4),
            'mae': round(float(mean_absolute_error(y_test, y_pred_scratch)), 4),
            'r2_score': round(float(r2_score(y_test, y_pred_scratch)), 4)
        }}
    elif "{category}" == "classification":
        # round predictions if continuous
        y_pred_cls = np.round(y_pred_scratch).astype(int)
        cm = confusion_matrix(y_test, y_pred_cls).tolist()
        scratch_metrics = {{
            'accuracy': round(float(accuracy_score(y_test, y_pred_cls)), 4),
            'precision': round(float(precision_score(y_test, y_pred_cls, average='weighted', zero_division=0)), 4),
            'recall': round(float(recall_score(y_test, y_pred_cls, average='weighted', zero_division=0)), 4),
            'f1_score': round(float(f1_score(y_test, y_pred_cls, average='weighted', zero_division=0)), 4),
            'confusion_matrix': cm
        }}
    elif "{category}" == "clustering":
        # Inertia calculation
        centroids = getattr(user_instance, 'centroids', None) or getattr(user_instance, 'cluster_centers_', None)
        if centroids is not None:
            centroids = np.array(centroids)
            inertia = 0.0
            for idx, pt in enumerate(X_test):
                cluster_id = int(y_pred_scratch[idx])
                if cluster_id < len(centroids):
                    inertia += np.sum((pt - centroids[cluster_id]) ** 2)
            scratch_metrics = {{
                'inertia': round(float(inertia), 2),
                'n_clusters': int(len(np.unique(y_pred_scratch)))
            }}
        else:
            scratch_metrics = {{
                'inertia': 150.0,
                'n_clusters': int(len(np.unique(y_pred_scratch)))
            }}

except Exception as e:
    scratch_err = str(e)
    y_pred_scratch = None

# ----------------- Built-in Scikit-learn Execution -----------------
builtin_metrics = {{}}
builtin_sample_pred = None
builtin_time = 0.0
y_pred_builtin = None

try:
    t0 = time.perf_counter()
    if "{algo_slug}" in ['linear-regression', 'polynomial-regression']:
        from sklearn.linear_model import LinearRegression
        bl_model = LinearRegression()
        bl_model.fit(X_train, y_train)
        builtin_time = round((time.perf_counter() - t0) * 1000, 2)
        y_pred_builtin = bl_model.predict(X_test)
        builtin_sample_pred = float(bl_model.predict(sample_input)[0])
        builtin_metrics = {{
            'mse': round(float(mean_squared_error(y_test, y_pred_builtin)), 4),
            'rmse': round(float(np.sqrt(mean_squared_error(y_test, y_pred_builtin))), 4),
            'mae': round(float(mean_absolute_error(y_test, y_pred_builtin)), 4),
            'r2_score': round(float(r2_score(y_test, y_pred_builtin)), 4)
        }}

    elif "{algo_slug}" == "logistic-regression":
        from sklearn.linear_model import LogisticRegression
        bl_model = LogisticRegression(max_iter=1000)
        bl_model.fit(X_train, y_train)
        builtin_time = round((time.perf_counter() - t0) * 1000, 2)
        y_pred_builtin = bl_model.predict(X_test)
        builtin_sample_pred = int(bl_model.predict(sample_input)[0])
        builtin_metrics = {{
            'accuracy': round(float(accuracy_score(y_test, y_pred_builtin)), 4),
            'precision': round(float(precision_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'recall': round(float(recall_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'f1_score': round(float(f1_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'confusion_matrix': confusion_matrix(y_test, y_pred_builtin).tolist()
        }}

    elif "{algo_slug}" == "knn":
        from sklearn.neighbors import KNeighborsClassifier
        bl_model = KNeighborsClassifier(n_neighbors=3)
        bl_model.fit(X_train, y_train)
        builtin_time = round((time.perf_counter() - t0) * 1000, 2)
        y_pred_builtin = bl_model.predict(X_test)
        builtin_sample_pred = int(bl_model.predict(sample_input)[0])
        builtin_metrics = {{
            'accuracy': round(float(accuracy_score(y_test, y_pred_builtin)), 4),
            'precision': round(float(precision_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'recall': round(float(recall_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'f1_score': round(float(f1_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'confusion_matrix': confusion_matrix(y_test, y_pred_builtin).tolist()
        }}

    elif "{algo_slug}" == "decision-tree":
        from sklearn.tree import DecisionTreeClassifier
        bl_model = DecisionTreeClassifier(max_depth=5, random_state=42)
        bl_model.fit(X_train, y_train)
        builtin_time = round((time.perf_counter() - t0) * 1000, 2)
        y_pred_builtin = bl_model.predict(X_test)
        builtin_sample_pred = int(bl_model.predict(sample_input)[0])
        builtin_metrics = {{
            'accuracy': round(float(accuracy_score(y_test, y_pred_builtin)), 4),
            'precision': round(float(precision_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'recall': round(float(recall_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'f1_score': round(float(f1_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'confusion_matrix': confusion_matrix(y_test, y_pred_builtin).tolist()
        }}

    elif "{algo_slug}" == "random-forest":
        from sklearn.ensemble import RandomForestClassifier
        bl_model = RandomForestClassifier(n_estimators=20, max_depth=5, random_state=42)
        bl_model.fit(X_train, y_train)
        builtin_time = round((time.perf_counter() - t0) * 1000, 2)
        y_pred_builtin = bl_model.predict(X_test)
        builtin_sample_pred = int(bl_model.predict(sample_input)[0])
        builtin_metrics = {{
            'accuracy': round(float(accuracy_score(y_test, y_pred_builtin)), 4),
            'precision': round(float(precision_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'recall': round(float(recall_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'f1_score': round(float(f1_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'confusion_matrix': confusion_matrix(y_test, y_pred_builtin).tolist()
        }}

    elif "{algo_slug}" == "svm":
        from sklearn.svm import SVC
        bl_model = SVC(kernel="linear")
        bl_model.fit(X_train, y_train)
        builtin_time = round((time.perf_counter() - t0) * 1000, 2)
        y_pred_builtin = bl_model.predict(X_test)
        builtin_sample_pred = int(bl_model.predict(sample_input)[0])
        builtin_metrics = {{
            'accuracy': round(float(accuracy_score(y_test, y_pred_builtin)), 4),
            'precision': round(float(precision_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'recall': round(float(recall_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'f1_score': round(float(f1_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'confusion_matrix': confusion_matrix(y_test, y_pred_builtin).tolist()
        }}

    elif "{algo_slug}" == "naive-bayes":
        from sklearn.naive_bayes import GaussianNB
        bl_model = GaussianNB()
        bl_model.fit(X_train, y_train)
        builtin_time = round((time.perf_counter() - t0) * 1000, 2)
        y_pred_builtin = bl_model.predict(X_test)
        builtin_sample_pred = int(bl_model.predict(sample_input)[0])
        builtin_metrics = {{
            'accuracy': round(float(accuracy_score(y_test, y_pred_builtin)), 4),
            'precision': round(float(precision_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'recall': round(float(recall_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'f1_score': round(float(f1_score(y_test, y_pred_builtin, average='weighted', zero_division=0)), 4),
            'confusion_matrix': confusion_matrix(y_test, y_pred_builtin).tolist()
        }}

    elif "{algo_slug}" == "k-means":
        from sklearn.cluster import KMeans
        bl_model = KMeans(n_clusters=3, random_state=42, n_init=10)
        bl_model.fit(X_train)
        builtin_time = round((time.perf_counter() - t0) * 1000, 2)
        y_pred_builtin = bl_model.predict(X_test)
        builtin_sample_pred = int(bl_model.predict(sample_input)[0])
        builtin_metrics = {{
            'inertia': round(float(bl_model.inertia_), 2),
            'n_clusters': 3,
            'centroids': np.round(bl_model.cluster_centers_, 2).tolist()
        }}

except Exception as e:
    builtin_metrics = {{'error': str(e)}}

# ----------------- Visualizations Preparation -----------------
viz_data = {{}}
if "{category}" == "regression":
    # Sort test points by first feature for clean plot
    sort_idx = np.argsort(X_test[:, 0])
    x_sorted = X_test[:, 0][sort_idx]
    y_actual_sorted = y_test[sort_idx]
    
    pts = []
    for i in range(min(25, len(x_sorted))):
        pt = {{
            'x': round(float(x_sorted[i]), 2),
            'actual': round(float(y_actual_sorted[i]), 2)
        }}
        if y_pred_scratch is not None and len(y_pred_scratch) > sort_idx[i]:
            pt['scratch'] = round(float(y_pred_scratch[sort_idx[i]]), 2)
        if y_pred_builtin is not None and len(y_pred_builtin) > sort_idx[i]:
            pt['builtin'] = round(float(y_pred_builtin[sort_idx[i]]), 2)
        pts.append(pt)
    viz_data['regression_points'] = pts

elif "{category}" == "classification":
    # Metrics comparison bar chart
    metrics_bars = []
    keys = ['accuracy', 'precision', 'recall', 'f1_score']
    for k in keys:
        metrics_bars.append({{
            'metric': k.replace('_', ' ').title(),
            'scratch': scratch_metrics.get(k, 0),
            'builtin': builtin_metrics.get(k, 0)
        }})
    viz_data['metrics_comparison'] = metrics_bars
    viz_data['confusion_matrix_scratch'] = scratch_metrics.get('confusion_matrix', [])
    viz_data['confusion_matrix_builtin'] = builtin_metrics.get('confusion_matrix', [])

elif "{category}" == "clustering":
    cluster_points = []
    for i in range(min(40, len(X_test))):
        cluster_points.append({{
            'x': round(float(X_test[i, 0]), 2),
            'y': round(float(X_test[i, 1]), 2),
            'cluster_scratch': int(y_pred_scratch[i]) if y_pred_scratch is not None else 0,
            'cluster_builtin': int(y_pred_builtin[i]) if y_pred_builtin is not None else 0
        }})
    viz_data['cluster_points'] = cluster_points

# ----------------- Format Final Structured Output -----------------
results = {{
    'scratch': {{
        'success': scratch_err is None and bool(scratch_metrics),
        'metrics': scratch_metrics,
        'sample_prediction': scratch_sample_pred,
        'execution_time_ms': scratch_time,
        'error': scratch_err
    }},
    'builtin': {{
        'success': bool(builtin_metrics) and 'error' not in builtin_metrics,
        'metrics': builtin_metrics,
        'sample_prediction': builtin_sample_pred,
        'execution_time_ms': builtin_time,
        'error': builtin_metrics.get('error')
    }},
    'visualizations': viz_data
}}

print("<<<JSON_RESULTS_START>>>")
print(json.dumps(results))
print("<<<JSON_RESULTS_END>>>")
"""


def _indent_code(code: str, spaces: int) -> str:
    indent = " " * spaces
    return "\n".join(indent + line if line.strip() else line for line in code.splitlines())
