from flask import Blueprint, request, jsonify
from bson import ObjectId
from app.db import get_db

algorithms_bp = Blueprint('algorithms', __name__)

@algorithms_bp.route('', methods=['GET'])
def get_algorithms():
    db = get_db()
    category = request.args.get('category')
    difficulty = request.args.get('difficulty')
    search = request.args.get('search')

    query = {'status': 'published'}
    if category and category.lower() != 'all':
        query['category'] = {'$regex': f"^{category}$", '$options': 'i'}
    if difficulty and difficulty.lower() != 'all':
        query['difficulty'] = {'$regex': f"^{difficulty}$", '$options': 'i'}
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}}
        ]

    algorithms = list(db.algorithms.find(query))
    # Transform _id to str
    for algo in algorithms:
        algo['_id'] = str(algo['_id'])
        algo.pop('reference_solution', None)  # Don't leak reference solution in catalog list

    return jsonify({'algorithms': algorithms, 'count': len(algorithms)}), 200


@algorithms_bp.route('/<slug>', methods=['GET'])
def get_algorithm_by_slug(slug: str):
    db = get_db()
    algo = db.algorithms.find_one({'slug': slug})
    
    if not algo:
        return jsonify({'error': f'Algorithm with slug "{slug}" not found.'}), 404

    algo['_id'] = str(algo['_id'])
    
    # Also fetch linked documentation snippet if available
    doc = db.documentation.find_one({'algorithm_slug': slug})
    if doc:
        algo['documentation_preview'] = {
            'title': doc.get('title'),
            'summary': doc.get('summary'),
            'intuition': doc.get('intuition')
        }

    return jsonify({'algorithm': algo}), 200
