from functools import wraps
from flask import jsonify, g
from app.middleware.auth import token_required

def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        user = getattr(g, 'user', None)
        if not user or user.get('role') != 'admin':
            return jsonify({
                'error': 'Forbidden. Admin privileges required to access this resource.'
            }), 403
        return f(*args, **kwargs)
    return decorated
