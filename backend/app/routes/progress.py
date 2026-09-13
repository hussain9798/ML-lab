from flask import Blueprint, request, jsonify, g
from app.middleware.auth import token_required
from app.services.progress_service import get_user_progress, update_user_milestone

progress_bp = Blueprint('progress', __name__)

@progress_bp.route('', methods=['GET'])
@token_required
def get_progress():
    progress_data = get_user_progress(g.user['_id'])
    return jsonify(progress_data), 200


@progress_bp.route('/milestone', methods=['POST'])
@token_required
def set_milestone():
    data = request.get_json() or {}
    algo_slug = data.get('algorithm_slug')
    milestone = data.get('milestone')
    value = data.get('value', True)

    if not algo_slug or not milestone:
        return jsonify({'error': 'algorithm_slug and milestone are required.'}), 400

    try:
        update_user_milestone(g.user['_id'], algo_slug, milestone, value)
        return jsonify({'message': f'Milestone {milestone} updated successfully.'}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
