import jwt
from functools import wraps
from flask import request, jsonify, g
from bson import ObjectId
from app.config import Config
from app.db import get_db

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authorization token is required'}), 401
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid Authorization header format. Expected "Bearer <token>"'}), 401
        
        token = parts[1]
        try:
            payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
            user_id = payload.get('sub')
            if not user_id:
                return jsonify({'error': 'Invalid token payload'}), 401
            
            db = get_db()
            user = None
            try:
                user = db.users.find_one({'_id': ObjectId(user_id)})
            except Exception:
                user = db.users.find_one({'_id': user_id})
            
            if not user:
                return jsonify({'error': 'User associated with token not found'}), 401
            
            # Attach user to flask g
            g.user = {
                '_id': str(user['_id']),
                'name': user.get('name'),
                'email': user.get('email'),
                'role': user.get('role', 'user')
            }
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired. Please log in again.'}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({'error': f'Invalid token: {str(e)}'}), 401
        except Exception as e:
            return jsonify({'error': f'Authentication error: {str(e)}'}), 401
        
        return f(*args, **kwargs)
    return decorated

def get_optional_user():
    """Extract user if token provided, else None without rejecting request."""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    try:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            token = parts[1]
            payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
            user_id = payload.get('sub')
            db = get_db()
            try:
                user = db.users.find_one({'_id': ObjectId(user_id)})
            except Exception:
                user = db.users.find_one({'_id': user_id})
            if user:
                return {
                    '_id': str(user['_id']),
                    'name': user.get('name'),
                    'email': user.get('email'),
                    'role': user.get('role', 'user')
                }
    except Exception:
        pass
    return None
