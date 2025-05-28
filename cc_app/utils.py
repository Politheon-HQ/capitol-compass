from django.core.cache import cache
from django.http import JsonResponse
import json
from .models import CombinedData
from collections import defaultdict
import ast

def get_cached_data(cache_key, fetch_function, timeout=86400):
    """
    Retrieves cached data if available, otherwise fetches data (from DB or API),
    stores it in Redis cache, and returns it.

    Args:
        cache_key (str): Unique identifier for the cache.
        fetch_function (callable): Function to fetch data if not in cache.
        timeout (int): Cache expiration time in seconds (default: 24 hours).

    Returns:
        JsonResponse: JSON response with the cached or fetched data.
    """
    # Check if data is cached in Redis
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        print(f"Cache hit for key: {cache_key}")
        return cached_data
    
    # If not cached, fetch from the API
    data = fetch_function()
    if data:
        cache.set(cache_key, data, timeout=timeout)  # Cache for 24 hours
        print(f"Cache miss for key: {cache_key} - data fetched and cached ({len(data) if isinstance(data, list) else 'unknown'} items)")
        return data
    else:
        # Log the error or handle it as needed
        print(f"Fetch function for {cache_key} failed to return data.")
        return None


def get_ideology_data_for_topic(topic):
    cache_key = f"ideology_topic:{topic}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    
    # Pull only needed data from the database
    queryset = CombinedData.objects.only("state", "assigned_label")

    # Filter and Aggregate
    counts = defaultdict(int)
    for row in queryset:
        labels = row.assigned_label
        if not labels or labels == "[]":
            continue

        try:
            if isinstance(row.assigned_label, str):
                parsed_labels = json.loads(labels)
            else:
                parsed_labels = labels

            if any(label.strip().lower() == topic.lower() for label in parsed_labels):
                counts[row.state] += 1
        except Exception:
            continue

    result = [{"state": state, "count": count} for state, count in counts.items()]
    cache.set(cache_key, result, timeout=86400)  # Cache for 24 hours
    return result

TOPIC_LIST_CACHE_KEY = "ideology_topics"
def get_ideology_topics():
    cached = cache.get(TOPIC_LIST_CACHE_KEY)
    if cached is not None:
        print("Returning cached topics.")
        return cached
    
    queryset = CombinedData.objects.only("assigned_label")
    topics = set()

    for row in queryset:
        labels = row.assigned_label
        if not labels or labels == "[]":
            continue

        try:
            # Only parse if it's still a string
            if isinstance(labels, str):
                parsed_labels = json.loads(labels)
            else:
                parsed_labels = labels
           
            for label in parsed_labels:
                topics.add(label.strip())
            
        except json.JSONDecodeError as e:
            print(f"Error parsing labels: {e}")
            continue

    result = sorted(topics)
    print(f"\n Final Topic List ({len(result)}): {result}\n")

    if result:
        cache.set(TOPIC_LIST_CACHE_KEY, result, timeout=86400)  # Cache for 24 hours
    return result