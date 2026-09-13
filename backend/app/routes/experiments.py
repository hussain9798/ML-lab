import datetime
from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from app.db import get_db
from app.middleware.auth import token_required

experiments_bp = Blueprint('experiments', __name__)

@experiments_bp.route('', methods=['POST'])
@token_required
def create_experiment():
    data = request.get_json() or {}
    algo_slug = data.get('algorithm_slug')
    code = data.get('code', '')
    metrics = data.get('metrics', {})
    scratch_result = data.get('scratch_result', {})
    builtin_result = data.get('builtin_result', {})
    verdict = data.get('verdict', {})
    notes = data.get('notes', '')
    dataset_id = data.get('dataset_id', '')

    if not algo_slug:
        return jsonify({'error': 'algorithm_slug is required.'}), 400

    db = get_db()
    now = datetime.datetime.utcnow().isoformat()

    doc = {
        'user_id': g.user['_id'],
        'algorithm_slug': algo_slug,
        'code': code,
        'metrics': metrics,
        'scratch_result': scratch_result,
        'builtin_result': builtin_result,
        'verdict': verdict,
        'status': 'passed' if verdict.get('passed') else 'failed',
        'notes': notes,
        'dataset_id': dataset_id,
        'created_at': now,
        'updated_at': now
    }

    res = db.experiments.insert_one(doc)
    doc['_id'] = str(res.inserted_id)

    return jsonify({'message': 'Experiment saved successfully.', 'experiment': doc}), 201


@experiments_bp.route('', methods=['GET'])
@token_required
def get_experiments():
    db = get_db()
    algo_slug = request.args.get('algorithm_slug')
    limit = int(request.args.get('limit', 50))

    query = {'user_id': g.user['_id']}
    if algo_slug:
        query['algorithm_slug'] = algo_slug

    experiments = list(db.experiments.find(query).sort('created_at', -1).limit(limit))
    for exp in experiments:
        exp['_id'] = str(exp['_id'])

    return jsonify({'experiments': experiments, 'count': len(experiments)}), 200


@experiments_bp.route('/<exp_id>', methods=['GET'])
@token_required
def get_experiment_by_id(exp_id: str):
    db = get_db()
    try:
        exp = db.experiments.find_one({'_id': ObjectId(exp_id), 'user_id': g.user['_id']})
    except Exception:
        exp = db.experiments.find_one({'_id': exp_id, 'user_id': g.user['_id']})

    if not exp:
        return jsonify({'error': 'Experiment not found.'}), 404

    exp['_id'] = str(exp['_id'])
    return jsonify({'experiment': exp}), 200


@experiments_bp.route('/<exp_id>', methods=['DELETE'])
@token_required
def delete_experiment(exp_id: str):
    db = get_db()
    try:
        res = db.experiments.delete_one({'_id': ObjectId(exp_id), 'user_id': g.user['_id']})
    except Exception:
        res = db.experiments.delete_one({'_id': exp_id, 'user_id': g.user['_id']})

    if res.deleted_count == 0:
        return jsonify({'error': 'Experiment not found or permission denied.'}), 404

    return jsonify({'message': 'Experiment deleted successfully.'}), 200
