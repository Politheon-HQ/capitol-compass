from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .utils import get_cached_data, get_ideology_data_for_topic, get_ideology_topics
from .models import CongressMembers, CongressMembersWithProportions, CombinedData, USStateTopojson, USDistrictTopojson
from .serializers import CongressMembersSerializer, CongressMembersWithProportionsSerializer, CombinedDataSerializer, USStateTopojsonSerializer, USDistrictTopojsonSerializer

# Create your views here.
def dashboard_view(request):
    return render(request, 'dashboard.html')
    
class USStateTopoViewSet(APIView):
    def get(self, request, *args, **kwargs):
        def fetch_states():
            try:
                # Get the latest TopoJSON entry from the database
                topojson_data = USStateTopojson.objects.latest('id')
                serializer = USStateTopojsonSerializer(topojson_data)

                topojson = serializer.data.get("topojson", {})
                if "type" not in topojson:
                    topojson["type"] = "Topology"

                return{
                    "type": "Topology",
                    **topojson  # Merge with the existing TopoJSON structure
                }
            except USStateTopojson.DoesNotExist:
                return None
            
        formatted_topojson = get_cached_data("us_states_topojson", fetch_states)
        if formatted_topojson:
            return Response(formatted_topojson, status=status.HTTP_200_OK)
        else:
            return Response({"error": "No TopoJSON data found"}, status=status.HTTP_404_NOT_FOUND)
        
    def post(self, request, *args, **kwargs):
        """
        Allows inserting a new TopoJSON entry via POST request.
        """
        serializer = USStateTopojsonSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class USDistrictTopoViewSet(APIView):
    def get(self, request, *args, **kwargs):
        def fetch_districts():
            try:
                # Get the latest TopoJSON entry from the database
                topojson_data = USDistrictTopojson.objects.latest('id')
                serializer = USDistrictTopojsonSerializer(topojson_data)

                topojson = serializer.data.get("topojson", {})
                if "type" not in topojson:
                    topojson["type"] = "Topology"

                return {
                    "type": "Topology",
                    **topojson  # Merge with the existing TopoJSON structure
                }
            except USDistrictTopojson.DoesNotExist:
                return None
            
        formatted_topojson = get_cached_data("us_districts_topojson", fetch_districts)
        if formatted_topojson:
            return Response(formatted_topojson, status=status.HTTP_200_OK)
        else:
            return Response({"error": "No TopoJSON data found"}, status=status.HTTP_404_NOT_FOUND)
        
    def post(self, request, *args, **kwargs):
        """
        Allows inserting a new TopoJSON entry via POST request.
        """
        serializer = USDistrictTopojsonSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CongressMembersViewSet(viewsets.ModelViewSet):
    queryset = CongressMembers.objects.all()
    serializer_class = CongressMembersSerializer

    def list(self, request, *args, **kwargs):
        def fetch_members():
            return list(self.queryset.values())
        
        cached_data = get_cached_data("congress_members", fetch_members)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)
        else:
            return Response({"error": "No data found"}, status=status.HTTP_404_NOT_FOUND)

class CongressMembersWithProportionsViewSet(viewsets.ModelViewSet):
    queryset = CongressMembersWithProportions.objects.all()
    serializer_class = CongressMembersWithProportionsSerializer

    def list(self, request, *args, **kwargs):
        def fetch_members_with_proportions():
            return list(self.queryset.values())
        
        cached_data = get_cached_data("congress_members_with_proportions", fetch_members_with_proportions)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)
        else:
            return Response({"error": "No data found"}, status=status.HTTP_404_NOT_FOUND)

class CombinedDataViewSet(viewsets.ModelViewSet):
    queryset = CombinedData.objects.all()
    serializer_class = CombinedDataSerializer

    def list(self, request, *args, **kwargs):
        def fetch_combined_data():
            serializer = self.get_serializer(self.queryset, many=True)
            return serializer.data
        
        cached_data = get_cached_data("combined_data", fetch_combined_data)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)
        else:
            return Response({"error": "No data found"}, status=status.HTTP_404_NOT_FOUND)

    
@api_view(['GET'])
def ideology_by_topic(request, topic):
    """
    Return cached ideology data for a specific topic.
    If not in cache, it will be computed and stored.
    """
    data = get_ideology_data_for_topic(topic)
    if not data:
        return Response({"message": "No data found for topic."}, status=status.HTTP_404_NOT_FOUND)
    
    return Response(data, status=status.HTTP_200_OK)

@api_view(['GET'])
def ideology_topics(request):
    """
    Return cached list of ideology topics.
    If not in cache, it will be computed and stored.
    """
    data = get_ideology_topics()
    if not data:
        return Response({"message": "No data found for topics."}, status=status.HTTP_404_NOT_FOUND)
    
    return Response(data, status=status.HTTP_200_OK)