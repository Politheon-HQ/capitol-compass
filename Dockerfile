FROM python:3.11-slim
WORKDIR /cc_app
RUN apt-get update && apt-get install -y build-essential default-libmysqlclient-dev pkg-config && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN chmod +x entrypoint.sh
EXPOSE 80
ENV DJANGO_SETTINGS_MODULE=cc_project.settings
ENV PYTHONUNBUFFERED=1
ENTRYPOINT ["./entrypoint.sh"]
