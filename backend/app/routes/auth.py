import datetime
import bcrypt
import jwt
from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from app.config import Config
from app.db import get_db
from app.middleware.auth import token_required
from app.services.email_service import (
    EmailDeliveryError,
    create_and_send_otp,
    resend_otp,
    verify_otp,
)

auth_bp = Blueprint('auth', __name__)

def generate_token(user_id: str, email: str, role: str) -> str:
    payload = {
        'sub': str(user_id),
        'email': email,
        'role': role,
        'iat': datetime.datetime.utcnow(),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=Config.JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')


def serialize_user(user):
    return {
        'id': str(user['_id']),
        'name': user.get('name'),
        'email': user.get('email'),
        'role': user.get('role', 'user')
    }


def issue_otp_challenge(user, purpose):
    challenge = create_and_send_otp(user['email'], purpose)
    return {
        'message': 'Verification code sent to your email address.',
        'requires_otp': True,
        'purpose': purpose,
        'email': user['email'],
        **challenge
    }


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required.'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long.'}), 400

    db = get_db()
    if db.users.find_one({'email': email}):
        return jsonify({'error': 'An account with this email address already exists.'}), 409

    # Hash password
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    now = datetime.datetime.utcnow().isoformat()
    # All public registrations are assigned the standard user role for security
    role = 'user'

    user_doc = {
        'name': name,
        'email': email,
        'password_hash': password_hash,
        'role': role,
        'created_at': now,
        'updated_at': now
    }

    result = db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    return jsonify({
        **issue_otp_challenge(
            {'_id': result.inserted_id, 'name': name, 'email': email, 'role': role},
            'registration'
        ),
        'user': serialize_user({'_id': result.inserted_id, 'name': name, 'email': email, 'role': role})
    }), 202


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    db = get_db()
    user = db.users.find_one({'email': email})

    if not user:
        return jsonify({'error': 'Invalid email or password.'}), 401

    pwd_hash = user.get('password_hash', '')
    if not bcrypt.checkpw(password.encode('utf-8'), pwd_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid email or password.'}), 401

    return jsonify({
        **issue_otp_challenge(user, 'login'),
        'user': serialize_user(user)
    }), 202


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_login_otp():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    otp = str(data.get('otp', '')).strip()
    temp_token = data.get('temp_token', '').strip()
    purpose = data.get('purpose', 'login')

    if purpose not in ('login', 'registration') or not email or not temp_token:
        return jsonify({'error': 'A valid verification session is required.'}), 400

    valid, error = verify_otp(email, otp, temp_token, purpose)
    if not valid:
        return jsonify({'error': error}), 401

    db = get_db()
    user = db.users.find_one({'email': email})
    if not user:
        return jsonify({'error': 'User associated with this verification session was not found.'}), 401

    role = user.get('role', 'user')
    return jsonify({
        'message': 'Authentication successful.',
        'token': generate_token(str(user['_id']), email, role),
        'user': serialize_user(user)
    }), 200


@auth_bp.route('/resend-otp', methods=['POST'])
def resend_login_otp():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    temp_token = data.get('temp_token', '').strip()
    purpose = data.get('purpose', 'login')

    if purpose not in ('login', 'registration') or not email or not temp_token:
        return jsonify({'error': 'A valid verification session is required.'}), 400

    success, result = resend_otp(email, temp_token, purpose)
    if not success:
        return jsonify({'error': result}), 429
    return jsonify({
        'message': 'A new verification code was sent to your email address.',
        **result
    }), 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'error': 'Email address is required.'}), 400

    user = get_db().users.find_one({'email': email})
    if not user:
        return jsonify({'error': 'No account was found for this email address.'}), 404

    challenge = create_and_send_otp(email, 'password_reset')
    return jsonify({
        'message': 'Password reset code sent to your email address.',
        'requires_otp': True,
        'purpose': 'password_reset',
        'email': email,
        **challenge
    }), 202


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    otp = str(data.get('otp', '')).strip()
    temp_token = data.get('temp_token', '').strip()
    password = data.get('password', '')

    if not email or not temp_token or not password:
        return jsonify({'error': 'Email, verification code, and new password are required.'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long.'}), 400

    valid, error = verify_otp(email, otp, temp_token, 'password_reset')
    if not valid:
        return jsonify({'error': error}), 401

    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    result = get_db().users.update_one(
        {'email': email},
        {'$set': {
            'password_hash': password_hash,
            'updated_at': datetime.datetime.utcnow().isoformat()
        }}
    )
    if result.matched_count == 0:
        return jsonify({'error': 'User associated with this reset session was not found.'}), 404

    return jsonify({'message': 'Password reset successfully. You can now sign in.'}), 200


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    return jsonify({'user': g.user}), 200


@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    data = request.get_json() or {}
    name = data.get('name', '').strip()

    if not name:
        return jsonify({'error': 'Name cannot be empty.'}), 400

    db = get_db()
    user_id = g.user['_id']

    try:
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'name': name, 'updated_at': datetime.datetime.utcnow().isoformat()}}
        )
    except Exception:
        db.users.update_one(
            {'_id': user_id},
            {'$set': {'name': name, 'updated_at': datetime.datetime.utcnow().isoformat()}}
        )

    g.user['name'] = name
    return jsonify({'message': 'Profile updated successfully.', 'user': g.user}), 200


@auth_bp.route('/profile/email-request', methods=['POST'])
@token_required
def request_email_change():
    data = request.get_json() or {}
    new_email = data.get('email', '').strip().lower()

    if not new_email or '@' not in new_email:
        return jsonify({'error': 'A valid new email address is required.'}), 400
    if new_email == g.user['email']:
        return jsonify({'error': 'New email address must be different from the current one.'}), 400

    db = get_db()
    if db.users.find_one({'email': new_email}):
        return jsonify({'error': 'An account with this email address already exists.'}), 409

    challenge = create_and_send_otp(
        new_email,
        'email_change',
        {'user_id': g.user['_id']}
    )
    return jsonify({
        'message': 'Verification code sent to the new email address.',
        'requires_otp': True,
        'purpose': 'email_change',
        'email': new_email,
        **challenge
    }), 202


@auth_bp.route('/profile/email-confirm', methods=['POST'])
@token_required
def confirm_email_change():
    data = request.get_json() or {}
    new_email = data.get('email', '').strip().lower()
    otp = str(data.get('otp', '')).strip()
    temp_token = data.get('temp_token', '').strip()
    db = get_db()
    challenge = db.otps.find_one({
        'email': new_email,
        'temp_token': temp_token,
        'purpose': 'email_change',
        'user_id': g.user['_id']
    })

    if not challenge:
        return jsonify({'error': 'Invalid or expired email verification session.'}), 401

    valid, error = verify_otp(new_email, otp, temp_token, 'email_change')
    if not valid:
        return jsonify({'error': error}), 401

    result = db.users.update_one(
        {'_id': ObjectId(g.user['_id'])},
        {'$set': {
            'email': new_email,
            'updated_at': datetime.datetime.utcnow().isoformat()
        }}
    )
    if result.matched_count == 0:
        return jsonify({'error': 'User account was not found.'}), 404

    return jsonify({
        'message': 'Email address updated successfully. Please sign in again.',
        'user': {**g.user, 'email': new_email}
    }), 200
