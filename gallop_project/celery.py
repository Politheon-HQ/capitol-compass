import os
from celery import Celery
from django.conf import settings

# Default settings module for Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gallop_project.settings')
app = Celery('gallop_project')

# Pull from Django settings
app.conf.broker_url = settings.REDIS_URL
app.conf.result_backend = settings.REDIS_URL

# Load config from Django settings (CELERY_ prefix)
app.config_from_object('django.conf:settings', namespace='CELERY')

# Autodiscover tasks from all registered Django app configs
app.autodiscover_tasks()