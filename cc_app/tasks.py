from celery import shared_task
from .utils import get_ideology_data_for_topic, get_ideology_topics


@shared_task
def fetch_ideology_by_topic(topic):
    """
    Celery task to fetch or refresh the cache for a given topic.
    This runs the same logic used in views.py but offloads it to the background.
    """
    return get_ideology_data_for_topic(topic)

@shared_task
def fetch_ideology_topics():
    """
    Celery task to fetch or refresh the cache for the list of topics.
    This runs the same logic used in views.py but offloads it to the background.
    """
    return get_ideology_topics()