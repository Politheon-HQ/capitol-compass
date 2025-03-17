from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .utils import convert_to_topojson_states, convert_to_topojson_districts, get_cached_data
from .models import USState, CongressionalDistrict, CongressMembers, CongressMembersWithProportions, CombinedData, USStateTopojson, USDistrictTopojson
from .serializers import USStateSerializer, CongressionalDistrictSerializer, CongressMembersSerializer, CongressMembersWithProportionsSerializer, CombinedDataSerializer, USStateTopojsonSerializer, USDistrictTopojsonSerializer

# Create your views here.
def dashboard_view(request):
    return render(request, 'dashboard.html')

class USStateViewSet(APIView):
    def get(self, request):
        queryset = USState.objects.all()
        serializer = USStateSerializer(queryset, many=True)

        filtered_data = [
            {
                "type": state["state_type"],
                "properties": state["state_properties"],
                "arcs": state["arcs"],
            }
            for state in serializer.data
        ]

        topojson = convert_to_topojson_states(filtered_data)
        return Response(topojson)
    
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
            return Response(formatted_topojson.data, status=status.HTTP_200_OK)
        else:
            return Response({"error": "No TopoJSON data found"}, status=status.HTTP_404_NOT_FOUND)
        
    def post(self, request, *args, **kwargs):
        """
        Allows inserting a new TopoJSON entry via POST request.
        """
        serializer = USStateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
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
            return Response(formatted_topojson.data, status=status.HTTP_200_OK)
        else:
            return Response({"error": "No TopoJSON data found"}, status=status.HTTP_404_NOT_FOUND)
        
    def post(self, request, *args, **kwargs):
        """
        Allows inserting a new TopoJSON entry via POST request.
        """
        serializer = USDistrictTopojsonSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CongressionalDistrictViewSet(APIView):
    def get(self, request):
        queryset = CongressionalDistrict.objects.all()
        serializer = CongressionalDistrictSerializer(queryset, many=True)

        filtered_data = [
            {
                "type": district["district_type"],
                "properties": district["properties"],
                "arcs": district["arcs"],
            }
            for district in serializer.data
        ]

        topojson = convert_to_topojson_districts(filtered_data)
        return Response(topojson)
    
class USStateTopojsonViewSet(viewsets.ModelViewSet):
    queryset = USStateTopojson.objects.all()
    serializer_class = USStateTopojsonSerializer

class CongressMembersViewSet(viewsets.ModelViewSet):
    def list(self, request, *args, **kwargs):
        def fetch_members():
            queryset = CongressMembers.objects.all()
            serializer = CongressMembersSerializer(queryset, many=True)
            return serializer.data
        
        cached_data = get_cached_data("congress_members", fetch_members)
        if cached_data:
            return Response(cached_data.data, status=status.HTTP_200_OK)
        else:
            return Response({"error": "No data found"}, status=status.HTTP_404_NOT_FOUND)

class CongressMembersWithProportionsViewSet(viewsets.ModelViewSet):
    def list(self, request, *args, **kwargs):
        def fetch_members_with_proportions():
            queryset = CongressMembersWithProportions.objects.all()
            serializer = CongressMembersWithProportionsSerializer(queryset, many=True)
            return serializer.data
        
        cached_data = get_cached_data("congress_members_with_proportions", fetch_members_with_proportions)
        if cached_data:
            return Response(cached_data.data, status=status.HTTP_200_OK)
        else:
            return Response({"error": "No data found"}, status=status.HTTP_404_NOT_FOUND)

class CombinedDataViewSet(viewsets.ModelViewSet):
    def list(self, request, *args, **kwargs):
        def fetch_combined_data():
            queryset = CombinedData.objects.all()
            serializer = CombinedDataSerializer(queryset, many=True)
            return serializer.data
        
        cached_data = get_cached_data("combined_data", fetch_combined_data)
        if cached_data:
            return Response(cached_data.data, status=status.HTTP_200_OK)
        else:
            return Response({"error": "No data found"}, status=status.HTTP_404_NOT_FOUND)

    
    