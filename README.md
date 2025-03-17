<img src="readme_images/horsepower.jpg" alt="Gallop Logo" width="400" align="left">

<br clear="all" />

---

**MVP web app featuring interactive maps, plots, and key metrics**  

📌 **Built with:**  
- **Framework:** Django  
- **Database:** Digital Ocean ([🔗](https://www.digitalocean.com/))  
- **Hosting:** Heroku ([🔗](https://www.heroku.com/))  
- **Visualizations:** Plotly (Radar Chart D3 Conversion in progress)  

## 📂 Project Structure  

- **Main Dashboard Layout:** `gallop_app/templates/dashboard.html`  
- **Graphs & Plots:** Stored in `gallop_app/static/.js`  
- **API Data Source:** `/api/{table}`  

## 🔧 Setup & Deployment  

1. Clone the Repository  
git clone <https://github.com/Gallop-Startup/gallop-app>  
cd gallop_app

2. Install Dependencies  
- pip install -r requirements.txt
- *(Or use environment.ylm [Mac] or environment_2.yml [Windows])*

3. Run Migrations  
python manage.py migrate  

4. Start the Development Server  
python manage.py runserver  

## 📊 Features  

✅ **Interactive Maps & Plots** (Powered by Plotly/D3)  
✅ **Live Data from Digital Ocean**  
✅ **API-driven Analytics**  
✅ **Scalable Deployment on Heroku**  

## 🏗️ Work in Progress  

- 🔄 **Radar Chart D3 Conversion** (Under Construction but Possible 🚧)  
- 📈 **Additional Metrics & Enhancements**  

## Other Stuff  

### Tips for local development:
- Sometimes latest changes don't update (even locally).  Try: python manage.py collectstatic
- Try running different launch ports to force cache refresh: python manage.py runserver 8025 (Change Port)


#### To add new data
- Add Data to database (Digital Ocean)
- Setup connection in the following:
-   gallop_app/models.py
-   gallop_app/views.py
-   gallop_app/serializers.py
-   gallop_app/urls.py



