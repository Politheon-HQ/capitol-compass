from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .utils import convert_to_topojson_states, convert_to_topojson_districts
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
        try:
            # Get the latest TopoJSON entry from the database
            topojson_data = USStateTopojson.objects.latest('id')
            serializer = USStateTopojsonSerializer(topojson_data)

            topojson = serializer.data.get("topojson", {})
            if "type" not in topojson:
                topojson["type"] = "Topology"

            formatted_topojson = {
                "type": "Topology",
                **topojson  # Merge with the existing TopoJSON structure
            }
            return Response(formatted_topojson, status=status.HTTP_200_OK)
        except USStateTopojson.DoesNotExist:
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
        try:
            # Get the latest TopoJSON entry from the database
            topojson_data = USDistrictTopojson.objects.latest('id')
            serializer = USDistrictTopojsonSerializer(topojson_data)

            topojson = serializer.data.get("topojson", {})
            if "type" not in topojson:
                topojson["type"] = "Topology"

            formatted_topojson = {
                "type": "Topology",
                **topojson  # Merge with the existing TopoJSON structure
            }
            return Response(formatted_topojson, status=status.HTTP_200_OK)
        except USDistrictTopojson.DoesNotExist:
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
    queryset = CongressMembers.objects.all()
    serializer_class = CongressMembersSerializer

class CongressMembersWithProportionsViewSet(viewsets.ModelViewSet):
    queryset = CongressMembersWithProportions.objects.all()
    serializer_class = CongressMembersWithProportionsSerializer

class CombinedDataViewSet(viewsets.ModelViewSet):
    queryset = CombinedData.objects.all()
    serializer_class = CombinedDataSerializer

    
    