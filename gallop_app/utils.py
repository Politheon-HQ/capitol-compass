

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