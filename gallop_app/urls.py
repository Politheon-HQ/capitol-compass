from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import USStateViewSet, CongressionalDistrictViewSet, CongressMembersViewSet, CongressMembersWithProportionsViewSet, CombinedDataViewSet, USStateTopoViewSet, USDistrictTopoViewSet
from .views import dashboard_view

router = DefaultRouter()
router.register(r'congress_members', CongressMembersViewSet)
router.register(r'member_proportions', CongressMembersWithProportionsViewSet)
router.register(r'combined_data', CombinedDataViewSet)

urlpatterns = [
    path('', dashboard_view, name='gallop_app'),
    path('api/us_states/', USStateViewSet.as_view(), name='usstate-list'),
    path('api/us_states_topojson/', USStateTopoViewSet.as_view(), name='usstatetopojson-list'),
    path('api/us_districts_topojson/', USDistrictTopoViewSet.as_view(), name='usdistricttopojson-list'),
    path('api/congressional_districts/', CongressionalDistrictViewSet.as_view(), name='congressionaldistrict-list'),
    path('api/', include(router.urls)),
]