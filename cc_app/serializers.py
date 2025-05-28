import json
from rest_framework import serializers
from .models import CongressMembers, CongressMembersWithProportions, CombinedData, USStateTopojson, USDistrictTopojson


class USStateTopojsonSerializer(serializers.ModelSerializer):
    class Meta:
        model = USStateTopojson
        fields = ['id', 'topojson']

class USDistrictTopojsonSerializer(serializers.ModelSerializer):
    class Meta:
        model = USDistrictTopojson
        fields = ['id', 'topojson']

class CongressMembersSerializer(serializers.ModelSerializer):
    district = serializers.IntegerField(allow_null=True)
    class Meta:
        model = CongressMembers
        fields = '__all__'

class CongressMembersWithProportionsSerializer(serializers.ModelSerializer):
    district = serializers.IntegerField(allow_null=True)
    class Meta:
        model = CongressMembersWithProportions
        fields = '__all__'

class CombinedDataSerializer(serializers.ModelSerializer):
    assigned_label = serializers.SerializerMethodField()

    def get_assigned_label(self, obj):
        # Ensure the field is properly formatted as JSON
        if isinstance(obj.assigned_label, str):
            try:
                return json.loads(obj.assigned_label.replace("'", '"'))  # Convert to JSON list
            except json.JSONDecodeError:
                return []  # Default to empty list if JSON is invalid
        return obj.assigned_label
    class Meta:
        model = CombinedData
        fields = ['state', 'assigned_label']  # Select only the columns neccessary for the chart
        