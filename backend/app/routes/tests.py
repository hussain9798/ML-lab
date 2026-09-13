from flask import Blueprint, request, jsonify, g
from app.db import get_db
from app.middleware.auth import token_required
from app.services.comparison_service import run_comparison_test, BUILTIN_ALGO_MAPPING
from app.services.progress_service import update_user_milestone

tests_bp = Blueprint('tests', __name__)

@tests_bp.route('/run', methods=['POST'])
@token_required
def run_test():
    data = request.get_json() or {}
    algo_slug = data.get('algorithm_slug')
    scratch_code = data.get('scratch_code', '')
    dataset_id = data.get('dataset_id')
    tolerance = data.get('tolerance')

    if not algo_slug:
        return jsonify({'error': 'algorithm_slug is required.'}), 400

    if not scratch_code.strip():
        return jsonify({
            'success': False,
            'error': 'No scratch implementation code provided.',
            'scratch_result': None,
            'builtin_result': None,
            'verdict': {
                'passed': False,
                'message': 'Please write your implementation code before running the comparison test.'
            }
        }), 400

    # Execute side-by-side comparison test
    comparison_output = run_comparison_test(
        algo_slug=algo_slug,
        user_code=scratch_code,
        dataset_id=dataset_id,
        custom_tolerance=float(tolerance) if tolerance is not None else None
    )

    # If user is authenticated, update progress
    if comparison_output.get('success'):
        verdict = comparison_output.get('verdict', {})
        passed = verdict.get('passed', False)
        try:
            update_user_milestone(g.user['_id'], algo_slug, 'compared', True)
            if passed:
                update_user_milestone(g.user['_id'], algo_slug, 'test_passed', True)
        except Exception:
            pass

    return jsonify(comparison_output), 200


@tests_bp.route('/algorithm/<algo_slug>', methods=['GET'])
def get_algorithm_test_config(algo_slug: str):
    config = BUILTIN_ALGO_MAPPING.get(algo_slug)
    if not config:
        return jsonify({'error': f'Test configuration for {algo_slug} not found.'}), 404

    return jsonify({
        'algorithm_slug': algo_slug,
        'category': config['category'],
        'default_dataset': config['default_dataset'],
        'tolerance': config['tolerance'],
        'primary_metric': config['metric_key'],
        'builtin_class': config['class']
    }), 200
