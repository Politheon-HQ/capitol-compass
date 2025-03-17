from django.core.cache import cache
from django.http import JsonResponse
import requests
import hashlib

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



def convert_to_topojson_states(api_data):
    """
    Convert the API data to a TopoJSON format.
    """
    if not isinstance(api_data, list):
        raise TypeError("Expected a list of geometries, got {}".format(type(api_data)))
    topojson = {
        "type": "Topology",
        "transform": {
            "scale": [0.00307480855833823,0.0018552536612911389],
            "translate": [-179.22570186841347,18.86679570814063]
        },
        "objects": {
            "us_states": {
                "type": "GeometryCollection",
                "geometries": api_data
            }
        }
    }
    return topojson

def convert_to_topojson_districts(api_data):
    """
    Convert the API data to a TopoJSON format.
    """
    if not isinstance(api_data, list):
        raise TypeError("Expected a list of geometries, got {}".format(type(api_data)))
    topojson = {
        "type": "Topology",
        "transform": {
            "scale": [0.004386051775800044,0.0029645169450371093],
            "translate": [-179.17374526344,18.866790104306133]
        },
        "objects": {
            "congressional_districts": {
                "type": "GeometryCollection",
                "geometries": api_data
            }
        }
    }
    return topojson