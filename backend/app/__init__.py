import logging
from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.db import get_db
from app.seed_data import seed_database
from app.services.email_service import EmailDeliveryError

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
)
logger = logging.getLogger(__name__)

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Initialize DB & Seed Data
    try:
        with app.app_context():
            get_db()
            seed_database()
    except Exception as e:
        logger.warning(f"Database initialization warning: {e}")

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.algorithms import algorithms_bp
    from app.routes.documentation import documentation_bp
    from app.routes.code import code_bp
    from app.routes.tests import tests_bp
    from app.routes.experiments import experiments_bp
    from app.routes.datasets import datasets_bp
    from app.routes.progress import progress_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(algorithms_bp, url_prefix='/api/algorithms')
    app.register_blueprint(documentation_bp, url_prefix='/api/documentation')
    app.register_blueprint(code_bp, url_prefix='/api/code')
    app.register_blueprint(tests_bp, url_prefix='/api/tests')
    app.register_blueprint(experiments_bp, url_prefix='/api/experiments')
    app.register_blueprint(datasets_bp, url_prefix='/api/datasets')
    app.register_blueprint(progress_bp, url_prefix='/api/progress')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({
            'status': 'healthy',
            'service': 'ML Laboratory Backend API',
            'version': '1.0.0'
        }), 200

    # Error handlers for consistent JSON responses
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Endpoint not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f"Internal Server Error: {e}")
        return jsonify({'error': 'An internal server error occurred'}), 500

    @app.errorhandler(EmailDeliveryError)
    def email_delivery_error(e):
        return jsonify({'error': str(e)}), 503

    return app
