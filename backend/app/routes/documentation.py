import os
from flask import Blueprint, request, jsonify, g, send_from_directory
from app.db import get_db
from app.config import Config
from app.middleware.auth import get_optional_user
from app.services.progress_service import update_user_milestone

documentation_bp = Blueprint('documentation', __name__)


@documentation_bp.route('/pdf/<filename>', methods=['GET'])
def serve_documentation_pdf(filename: str):
    return send_from_directory(
        Config.DOCUMENTATION_UPLOAD_DIR,
        os.path.basename(filename),
        mimetype='application/pdf'
    )

@documentation_bp.route('', methods=['GET'])
def list_documentation():
    db = get_db()
    docs = list(db.documentation.find({'status': 'published'}, {
        'title': 1,
        'algorithm_slug': 1,
        'category': 1,
        'summary': 1,
        'difficulty': 1,
        'reading_time_min': 1
    }))
    for d in docs:
        d['_id'] = str(d['_id'])
    return jsonify({'documentation': docs}), 200


@documentation_bp.route('/<slug>', methods=['GET'])
def get_documentation_by_slug(slug: str):
    db = get_db()
    doc = db.documentation.find_one({'algorithm_slug': slug})

    if not doc:
        return jsonify({'error': f'Documentation for "{slug}" not found.'}), 404

    doc['_id'] = str(doc['_id'])

    # If user is authenticated, mark doc_read milestone
    user = get_optional_user()
    if user:
        try:
            update_user_milestone(user['_id'], slug, 'doc_read', True)
        except Exception:
            pass

    return jsonify({'documentation': doc}), 200
