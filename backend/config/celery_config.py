import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "amqp://guest:guest@rabbitmq:5672//")
