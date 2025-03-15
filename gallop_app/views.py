from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.response import Response
from .models import USState, CongressionalDistrict, CongressMembers, CongressMembersWithProportions, CombinedData
from .serializers import USStateSerializer, CongressionalDistrictSerializer, CongressMembersSerializer, CongressMembersWithProportionsSerializer, CombinedDataSerializer

# Create your views here.
def dashboard_view(request):
    return render(request, 'dashboard.html')

class USStateViewSet(viewsets.ModelViewSet):
    queryset = USState.objects.all()
    serializer_class = USStateSerializer

class CongressionalDistrictViewSet(viewsets.ModelViewSet):
    queryset = CongressionalDistrict.objects.all()
    serializer_class = CongressionalDistrictSerializer

class CongressMembersViewSet(viewsets.ModelViewSet):
    queryset = CongressMembers.objects.all()
    serializer_class = CongressMembersSerializer

class CongressMembersWithProportionsViewSet(viewsets.ModelViewSet):
    queryset = CongressMembersWithProportions.objects.all()
    serializer_class = CongressMembersWithProportionsSerializer

class CombinedDataViewSet(viewsets.ModelViewSet):
    queryset = CombinedData.objects.all()
    serializer_class = CombinedDataSerializer

    
    