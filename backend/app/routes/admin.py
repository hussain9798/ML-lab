import datetime
import os
import uuid
from flask import Blueprint, request, jsonify
from bson import ObjectId
from werkzeug.utils import secure_filename
from app.db import get_db
from app.config import Config
from app.middleware.admin import admin_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_admin_stats():
    db = get_db()
    total_users = db.users.count_documents({})
    total_algos = db.algorithms.count_documents({})
    published_algos = db.algorithms.count_documents({'status': 'published'})
    total_docs = db.documentation.count_documents({})
    total_experiments = db.experiments.count_documents({})
    tests_passed = db.experiments.count_documents({'status': 'passed'})

    # Recent experiments
    recent_experiments = list(db.experiments.find().sort('created_at', -1).limit(5))
    for exp in recent_experiments:
        exp['_id'] = str(exp['_id'])
        user = db.users.find_one({'_id': ObjectId(exp['user_id'])}) if ObjectId.is_valid(exp.get('user_id', '')) else None
        exp['user_name'] = user.get('name', 'Unknown User') if user else 'Student User'

    # Category counts
    pipeline = [{'$group': {'_id': '$category', 'count': {'$sum': 1}}}]
    category_counts = {item['_id']: item['count'] for item in db.algorithms.aggregate(pipeline) if item.get('_id')}

    return jsonify({
        'stats': {
            'total_users': total_users,
            'total_algorithms': total_algos,
            'published_algorithms': published_algos,
            'total_documentation': total_docs,
            'total_experiments': total_experiments,
            'tests_passed': tests_passed,
            'category_counts': category_counts
        },
        'recent_activity': recent_experiments
    }), 200


# ---------------- Algorithms Management ----------------
@admin_bp.route('/algorithms', methods=['GET'])
@admin_required
def list_admin_algorithms():
    db = get_db()
    algos = list(db.algorithms.find().sort('created_at', -1))
    for a in algos:
        a['_id'] = str(a['_id'])
    return jsonify({'algorithms': algos}), 200


@admin_bp.route('/algorithms', methods=['POST'])
@admin_required
def create_algorithm():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    slug = data.get('slug', '').strip().lower().replace(' ', '-')
    category = data.get('category', 'Regression')
    difficulty = data.get('difficulty', 'Beginner')
    description = data.get('description', '')
    status = data.get('status', 'published')
    starter_code = data.get('starter_code', {})
    tolerance = float(data.get('validation_tolerance', 0.05))

    if not name or not slug:
        return jsonify({'error': 'Algorithm name and slug are required.'}), 400

    db = get_db()
    if db.algorithms.find_one({'slug': slug}):
        return jsonify({'error': f'Algorithm with slug "{slug}" already exists.'}), 409

    now = datetime.datetime.utcnow().isoformat()
    doc = {
        'name': name,
        'slug': slug,
        'category': category,
        'difficulty': difficulty,
        'description': description,
        'status': status,
        'starter_code': starter_code,
        'scratch_enabled': data.get('scratch_enabled', True),
        'builtin_enabled': data.get('builtin_enabled', True),
        'allowed_libraries': data.get('allowed_libraries', ['numpy', 'pandas', 'scikit-learn']),
        'sample_dataset': data.get('sample_dataset', 'house_prices'),
        'validation_tolerance': tolerance,
        'metrics': data.get('metrics', ['r2_score', 'mse', 'mae']),
        'created_at': now,
        'updated_at': now
    }

    res = db.algorithms.insert_one(doc)
    doc['_id'] = str(res.inserted_id)

    return jsonify({'message': 'Algorithm created successfully.', 'algorithm': doc}), 201


@admin_bp.route('/algorithms/<algo_id>', methods=['PUT'])
@admin_required
def update_algorithm(algo_id: str):
    data = request.get_json() or {}
    data.pop('_id', None)
    data['updated_at'] = datetime.datetime.utcnow().isoformat()

    db = get_db()
    try:
        query = {'_id': ObjectId(algo_id)}
    except Exception:
        query = {'_id': algo_id}

    res = db.algorithms.update_one(query, {'$set': data})
    if res.matched_count == 0:
        return jsonify({'error': 'Algorithm not found.'}), 404

    updated = db.algorithms.find_one(query)
    updated['_id'] = str(updated['_id'])

    return jsonify({'message': 'Algorithm updated successfully.', 'algorithm': updated}), 200


@admin_bp.route('/algorithms/<algo_id>', methods=['DELETE'])
@admin_required
def delete_algorithm(algo_id: str):
    db = get_db()
    try:
        query = {'_id': ObjectId(algo_id)}
    except Exception:
        query = {'_id': algo_id}

    algo = db.algorithms.find_one(query)
    if not algo:
        return jsonify({'error': 'Algorithm not found.'}), 404

    # Also remove associated documentation
    db.documentation.delete_many({'algorithm_slug': algo.get('slug')})
    db.algorithms.delete_one(query)

    return jsonify({'message': 'Algorithm and associated documentation deleted.'}), 200


# ---------------- Documentation Management ----------------
@admin_bp.route('/documentation', methods=['GET'])
@admin_required
def list_admin_documentation():
    db = get_db()
    docs = list(db.documentation.find().sort('updated_at', -1))
    for d in docs:
        d['_id'] = str(d['_id'])
    return jsonify({'documentation': docs}), 200


@admin_bp.route('/documentation', methods=['POST'])
@admin_required
def create_documentation():
    data = request.get_json() or {}
    slug = data.get('algorithm_slug', '').strip().lower()
    title = data.get('title', '').strip()

    if not slug or not title:
        return jsonify({'error': 'Algorithm slug and title are required.'}), 400

    db = get_db()
    now = datetime.datetime.utcnow().isoformat()
    data['created_at'] = now
    data['updated_at'] = now
    data['status'] = data.get('status', 'published')

    res = db.documentation.insert_one(data)
    data['_id'] = str(res.inserted_id)

    return jsonify({'message': 'Documentation created successfully.', 'documentation': data}), 201


@admin_bp.route('/documentation/<doc_id>', methods=['PUT'])
@admin_required
def update_documentation(doc_id: str):
    data = request.get_json() or {}
    data.pop('_id', None)
    data['updated_at'] = datetime.datetime.utcnow().isoformat()

    db = get_db()
    try:
        query = {'_id': ObjectId(doc_id)}
    except Exception:
        query = {'_id': doc_id}

    res = db.documentation.update_one(query, {'$set': data})
    if res.matched_count == 0:
        return jsonify({'error': 'Documentation article not found.'}), 404

    updated = db.documentation.find_one(query)
    updated['_id'] = str(updated['_id'])

    return jsonify({'message': 'Documentation updated successfully.', 'documentation': updated}), 200


@admin_bp.route('/documentation/<doc_id>/pdf', methods=['POST'])
@admin_required
def upload_documentation_pdf(doc_id: str):
    pdf = request.files.get('pdf')
    if not pdf or not pdf.filename:
        return jsonify({'error': 'A PDF file is required.'}), 400
    if not pdf.filename.lower().endswith('.pdf') or pdf.mimetype != 'application/pdf':
        return jsonify({'error': 'Only PDF files are allowed.'}), 400
    pdf.seek(0, os.SEEK_END)
    file_size = pdf.tell()
    pdf.seek(0)
    if file_size > Config.MAX_DOCUMENTATION_PDF_SIZE:
        return jsonify({'error': 'PDF exceeds the 15 MB size limit.'}), 413
    original_name = secure_filename(pdf.filename)
    if not original_name:
        return jsonify({'error': 'The uploaded PDF filename is invalid.'}), 400

    db = get_db()
    try:
        query = {'_id': ObjectId(doc_id)}
    except Exception:
        query = {'_id': doc_id}
    if not db.documentation.find_one(query):
        return jsonify({'error': 'Documentation article not found.'}), 404

    os.makedirs(Config.DOCUMENTATION_UPLOAD_DIR, exist_ok=True)
    stored_name = f'{uuid.uuid4().hex}_{original_name}'
    pdf.save(os.path.join(Config.DOCUMENTATION_UPLOAD_DIR, stored_name))
    pdf_url = f'/api/documentation/pdf/{stored_name}'
    db.documentation.update_one(query, {'$set': {
        'pdf_url': pdf_url,
        'pdf_name': original_name,
        'updated_at': datetime.datetime.utcnow().isoformat()
    }})
    return jsonify({'message': 'PDF uploaded successfully.', 'pdf_url': pdf_url}), 200


# ---------------- User Management ----------------
@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_admin_users():
    db = get_db()
    users = list(db.users.find({}, {'password_hash': 0}).sort('created_at', -1))
    for u in users:
        u_id = str(u['_id'])
        u['_id'] = u_id
        # Experiment count
        u['experiment_count'] = db.experiments.count_documents({'user_id': u_id})
        # Progress count
        u['milestone_count'] = db.progress.count_documents({'user_id': u_id, 'test_passed': True})

    return jsonify({'users': users}), 200


@admin_bp.route('/users/<user_id>/role', methods=['PUT'])
@admin_required
def change_user_role(user_id: str):
    data = request.get_json() or {}
    new_role = data.get('role', 'user')

    if new_role not in ('user', 'admin'):
        return jsonify({'error': 'Role must be "user" or "admin".'}), 400

    db = get_db()
    try:
        query = {'_id': ObjectId(user_id)}
    except Exception:
        query = {'_id': user_id}

    res = db.users.update_one(query, {'$set': {'role': new_role, 'updated_at': datetime.datetime.utcnow().isoformat()}})
    if res.matched_count == 0:
        return jsonify({'error': 'User not found.'}), 404

    return jsonify({'message': f'User role updated to {new_role}.'}), 200
