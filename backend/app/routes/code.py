import datetime
from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from app.db import get_db
from app.middleware.auth import token_required
from app.services.execution_service import execute_python_code
from app.services.progress_service import update_user_milestone

code_bp = Blueprint('code', __name__)

@code_bp.route('/execute', methods=['POST'])
@token_required
def execute_code():
    data = request.get_json() or {}
    code = data.get('code', '')
    algo_slug = data.get('algorithm_slug')

    if not code.strip():
        return jsonify({
            'success': False,
            'stdout': '',
            'stderr': 'No code provided to execute.',
            'execution_time_ms': 0,
            'error': 'Empty code submission.'
        }), 400

    # Run in isolated sandbox
    result = execute_python_code(code, algo_slug=algo_slug)

    # If code ran successfully and user is logged in, mark milestone
    if algo_slug and result.get('success'):
        try:
            update_user_milestone(g.user['_id'], algo_slug, 'scratch_done', True)
        except Exception:
            pass

    return jsonify(result), 200


@code_bp.route('/save', methods=['POST'])
@token_required
def save_code():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    code = data.get('code', '')
    algo_slug = data.get('algorithm_slug', '')
    impl_type = data.get('implementation_type', 'scratch')

    if not name or not code or not algo_slug:
        return jsonify({'error': 'Name, code, and algorithm_slug are required.'}), 400

    db = get_db()
    now = datetime.datetime.utcnow().isoformat()
    
    doc = {
        'user_id': g.user['_id'],
        'name': name,
        'code': code,
        'algorithm_slug': algo_slug,
        'implementation_type': impl_type,
        'created_at': now,
        'updated_at': now
    }

    result = db.saved_codes.insert_one(doc)
    doc['_id'] = str(result.inserted_id)

    return jsonify({'message': 'Code saved successfully.', 'saved_code': doc}), 201


@code_bp.route('/saved', methods=['GET'])
@token_required
def list_saved_code():
    db = get_db()
    algo_slug = request.args.get('algorithm_slug')

    query = {'user_id': g.user['_id']}
    if algo_slug:
        query['algorithm_slug'] = algo_slug

    items = list(db.saved_codes.find(query).sort('updated_at', -1))
    for it in items:
        it['_id'] = str(it['_id'])

    return jsonify({'saved_codes': items}), 200


@code_bp.route('/saved/<item_id>', methods=['DELETE'])
@token_required
def delete_saved_code(item_id: str):
    db = get_db()
    try:
        res = db.saved_codes.delete_one({'_id': ObjectId(item_id), 'user_id': g.user['_id']})
    except Exception:
        res = db.saved_codes.delete_one({'_id': item_id, 'user_id': g.user['_id']})

    if res.deleted_count == 0:
        return jsonify({'error': 'Item not found or permission denied.'}), 404

    return jsonify({'message': 'Saved code deleted successfully.'}), 200
