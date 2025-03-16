from django.db import models

# Create your models here.
class USState(models.Model):
    state_name = models.CharField(max_length=100, primary_key=True)
    state_abbr = models.CharField(max_length=10, unique=True)
    state_type = models.CharField(max_length=50)
    state_properties = models.JSONField()
    arcs = models.JSONField()

    class Meta:
        db_table = "us_states"

    def __str__(self):
        return self.state_name
    
class USStateTopojson(models.Model):
    topojson = models.JSONField()

    class Meta:
        db_table = "us_states_topo"

    def __str__(self):
        return self.id

class CongressionalDistrict(models.Model):
    office_id = models.CharField(max_length=10, primary_key=True)
    state_abbr = models.CharField(max_length=10)
    district_number = models.IntegerField()
    district_type = models.CharField(max_length=50)
    properties = models.JSONField()
    arcs = models.JSONField()

    class Meta:
        db_table = "congressional_districts"

    def __str__(self):
        return f"{self.state_abbr} - {self.district_number} ({self.district_type})"
    
class USDistrictTopojson(models.Model):
    topojson = models.JSONField()

    class Meta:
        db_table = "us_districts_topo"

    def __str__(self):
        return self.id

class CongressMembers(models.Model):
    bioguide_id = models.CharField(max_length=10, primary_key=True)
    name = models.CharField(max_length=100)
    party = models.CharField(max_length=50)
    chamber = models.CharField(max_length=50)
    state = models.CharField(max_length=50)
    district = models.IntegerField(null=True, blank=True)
    start_year = models.CharField(max_length=4)
    image_url = models.CharField(max_length=200)
    profile_url = models.CharField(max_length=200)
    website_url = models.CharField(max_length=200)
    address = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20)
    sponsored_bills = models.IntegerField()
    cosponsored_bills = models.IntegerField()

    class Meta: 
        db_table = "congress_members"

    def __str__(self):
        return self.name

class CongressMembersWithProportions(models.Model):
    name = models.CharField(max_length=100)
    chamber = models.CharField(max_length=50)
    state = models.CharField(max_length=50)
    district = models.IntegerField(null=True, blank=True)
    sponsored_bills = models.IntegerField()
    cosponsored_bills = models.IntegerField()
    bioguide_id = models.CharField(max_length=10, primary_key=True)
    Agriculture_and_Food_self_proportion = models.FloatField()
    Crime_and_Law_Enforcement_self_proportion = models.FloatField()
    Culture_and_Recreation_self_proportion = models.FloatField()
    Economy_and_Finance_self_proportion = models.FloatField()
    Education_and_Social_Services_self_proportion = models.FloatField()
    Environment_and_Natural_Resources_self_proportion = models.FloatField()
    Government_Operations_and_Politics_self_proportion = models.FloatField()
    Health_and_Healthcare_self_proportion = models.FloatField()
    Immigration_and_Civil_Rights_self_proportion = models.FloatField()
    National_Security_and_International_Affairs_self_proportion = models.FloatField()
    Science_Technology_and_Communications_self_proportion = models.FloatField()
    Transportation_and_Infrastructure_self_proportion = models.FloatField()
    Agriculture_and_Food_across_all_proportion = models.FloatField()
    Crime_and_Law_Enforcement_across_all_proportion = models.FloatField()
    Culture_and_Recreation_across_all_proportion = models.FloatField()
    Economy_and_Finance_across_all_proportion = models.FloatField()
    Education_and_Social_Services_across_all_proportion = models.FloatField()
    Environment_and_Natural_Resources_across_all_proportion = models.FloatField()
    Government_Operations_and_Politics_across_all_proportion = models.FloatField()
    Health_and_Healthcare_across_all_proportion = models.FloatField()
    Immigration_and_Civil_Rights_across_all_proportion = models.FloatField()
    National_Security_and_International_Affairs_across_all_proportio = models.FloatField()
    Science_Technology_and_Communications_across_all_proportion = models.FloatField()
    Transportation_and_Infrastructure_across_all_proportion = models.FloatField()
    Agriculture_And_Food_state_self_proportion = models.FloatField()
    Crime_And_Law_Enforcement_state_self_proportion = models.FloatField()
    Culture_And_Recreation_state_self_proportion = models.FloatField()
    Economy_And_Finance_state_self_proportion = models.FloatField()
    Education_And_Social_Services_state_self_proportion = models.FloatField()
    Environment_And_Natural_Resources_state_self_proportion = models.FloatField()
    Government_Operations_And_Politics_state_self_proportion = models.FloatField()
    Health_And_Healthcare_state_self_proportion = models.FloatField()
    Immigration_And_Civil_Rights_state_self_proportion = models.FloatField()
    National_Security_And_International_Affairs_state_self_proportio = models.FloatField()
    Science_Technology_And_Communications_state_self_proportion = models.FloatField()
    Transportation_And_Infrastructure_state_self_proportion = models.FloatField()
    Agriculture_And_Food_state_national_proportion = models.FloatField()
    Crime_And_Law_Enforcement_state_national_proportion = models.FloatField()
    Culture_And_Recreation_state_national_proportion = models.FloatField()
    Economy_And_Finance_state_national_proportion = models.FloatField()
    Education_And_Social_Services_state_national_proportion = models.FloatField()
    Environment_And_Natural_Resources_state_national_proportion = models.FloatField()
    Government_Operations_And_Politics_state_national_proportion = models.FloatField()
    Health_And_Healthcare_state_national_proportion = models.FloatField()
    Immigration_And_Civil_Rights_state_national_proportion = models.FloatField()
    National_Security_And_International_Affairs_state_national_propo = models.FloatField()
    Science_Technology_And_Communications_state_national_proportion = models.FloatField()
    Transportation_And_Infrastructure_state_national_proportion = models.FloatField()

    class Meta:
        db_table = "member_proportions"

    def __str__(self):
        return self.name

class CombinedData(models.Model):
    row_id = models.AutoField(primary_key=True)
    annotation_id = models.IntegerField()
    annotator = models.IntegerField()
    author = models.CharField(max_length=100)
    context_url = models.CharField(max_length=200)
    created_at = models.CharField(max_length=100)
    created_utc = models.CharField(max_length=100)
    id = models.IntegerField()
    image_url = models.CharField(max_length=200)
    lead_time = models.FloatField()
    num_comments = models.IntegerField()
    original_image_url = models.CharField(max_length=200)
    policy_area = models.CharField(max_length=200)
    post_id = models.CharField(max_length=100)
    score = models.FloatField()
    selftext = models.TextField()
    selftext_lemmatized = models.TextField()
    state = models.CharField(max_length=100)
    title = models.TextField()
    title_lemmatized = models.TextField()
    topic = models.CharField(max_length=200)
    updated_at = models.CharField(max_length=100)
    url = models.CharField(max_length=200)
    parsed_topics = models.CharField(max_length=200)
    cleaned_title = models.TextField()
    cleaned_selftext = models.TextField()
    combined_text = models.TextField()
    other_uncategorized = models.IntegerField()
    national_security_and_international_affairs = models.IntegerField()
    government_operations_and_politics = models.IntegerField()
    health_and_healthcare = models.IntegerField()
    crime_and_law_enforcement = models.IntegerField()
    education_and_social_services = models.IntegerField()
    economy_and_finance = models.IntegerField()
    science_technology_and_communications = models.IntegerField()
    immigration_and_civil_rights = models.IntegerField()
    agriculture_and_food = models.IntegerField()
    environment_and_natural_resources = models.IntegerField()
    culture_and_recreation = models.IntegerField()
    transportation_and_infrastructure = models.IntegerField()
    primary_label = models.CharField(max_length=100)
    assigned_label = models.JSONField()
    label_source = models.CharField(max_length=50)
    assigned_topics = models.CharField(max_length=200)
    confidence_score = models.FloatField()

    class Meta:
        db_table = "combined_data"

    def __str__(self):
        return self.row_id