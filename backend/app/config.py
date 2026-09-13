import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', '1') == '1'
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-dev-secret-key-mllab')
    PORT = int(os.getenv('PORT', 5000))
    
    # JWT Settings
    JWT_SECRET = os.getenv('JWT_SECRET', 'default-jwt-secret-mllab-2025')
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', 24))
    ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@mllab.com').strip().lower()
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'Admin123!')
    
    # MongoDB Settings
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME', 'ml_laboratory')
    
    # Execution Sandbox Settings
    EXECUTION_BACKEND = os.getenv('EXECUTION_BACKEND', 'subprocess')  # 'subprocess' or 'docker'
    EXECUTION_TIMEOUT = int(os.getenv('EXECUTION_TIMEOUT', 6))
    MAX_CODE_SIZE = int(os.getenv('MAX_CODE_SIZE', 50000))
    MAX_OUTPUT_SIZE = int(os.getenv('MAX_OUTPUT_SIZE', 50000))
    DOCUMENTATION_UPLOAD_DIR = os.getenv(
        'DOCUMENTATION_UPLOAD_DIR',
        os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'documentation')
    )
    MAX_DOCUMENTATION_PDF_SIZE = int(os.getenv('MAX_DOCUMENTATION_PDF_SIZE', 15 * 1024 * 1024))
    
    # CORS
    CORS_ORIGINS = [origin.strip() for origin in os.getenv('CORS_ORIGINS', '*').split(',') if origin.strip()]
    
    # Email & OTP Settings (2-Factor Authentication)
    SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SMTP_USER = os.getenv('SMTP_USER', '')
    # Google displays app passwords with spaces; SMTP expects the 16 characters
    # without separators.
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '').replace(' ', '')
    SMTP_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL', 'no-reply@mllab.com')
    SMTP_FROM_NAME = os.getenv('SMTP_FROM_NAME', 'ML Laboratory Security')
    OTP_EXPIRATION_MINUTES = int(os.getenv('OTP_EXPIRATION_MINUTES', 5))
    OTP_ENABLED = os.getenv('OTP_ENABLED', '1') == '1'
