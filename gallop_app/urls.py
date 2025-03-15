from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import USStateViewSet, CongressionalDistrictViewSet, CongressMembersViewSet, CongressMembersWithProportionsViewSet, CombinedDataViewSet
from .views import dashboard_view

router = DefaultRouter()
router.register(r'us_states', USStateViewSet)
router.register(r'congressional_districts', CongressionalDistrictViewSet)
router.register(r'congress_members', CongressMembersViewSet)
router.register(r'member_proportions', CongressMembersWithProportionsViewSet)
router.register(r'combined_data', CombinedDataViewSet)

urlpatterns = [
    path('', dashboard_view, name='gallop_app'),
    path('api/', include(router.urls)),
]