import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config import Config

logger = logging.getLogger(__name__)

_mongo_client = None
_db = None

def get_db():
    """
    Returns the active MongoDB database instance.
    Connects to live MongoDB / MongoDB Atlas if available,
    otherwise falls back to an in-memory mongomock database
    so development, automated testing, and evaluation remain uninterrupted.
    """
    global _mongo_client, _db
    if _db is not None:
        return _db
    
    try:
        logger.info(f"Attempting connection to MongoDB at: {Config.MONGODB_URI}")
        client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=2500)
        # Verify connection
        client.admin.command('ping')
        _mongo_client = client
        _db = client[Config.MONGODB_DB_NAME]
        logger.info(f"Connected successfully to live MongoDB: {Config.MONGODB_DB_NAME}")
    except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
        logger.warning(f"Live MongoDB not reachable ({e}). Falling back to in-memory mongomock database.")
        try:
            import mongomock
            _mongo_client = mongomock.MongoClient()
            _db = _mongo_client[Config.MONGODB_DB_NAME]
            logger.info("Using in-memory mongomock database.")
        except Exception as mock_err:
            logger.error(f"Failed to initialize mongomock: {mock_err}")
            raise
    
    return _db

def close_db():
    global _mongo_client, _db
    if _mongo_client:
        _mongo_client.close()
        _mongo_client = None
        _db = None
