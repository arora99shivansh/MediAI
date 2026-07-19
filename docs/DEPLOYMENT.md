# Deployment Guide

## Docker Compose

```bash
cp .env.example .env
docker compose up --build -d
```

Use local MongoDB from Compose for development or set `MONGODB_URI` to MongoDB Atlas for managed persistence.

## Azure App Service Free

1. Create a MongoDB Atlas free cluster and store the connection string.
2. Create a Groq API key.
3. Create an Azure Web App for Containers for the backend.
4. Configure application settings:
   - `ENVIRONMENT=production`
   - `SECRET_KEY=<32+ char random secret>`
   - `MONGODB_URI=<atlas uri>`
   - `MONGODB_DATABASE=mediai`
   - `GROQ_API_KEY=<groq key>`
   - `CORS_ORIGINS=https://<frontend-domain>`
5. Use `backend/Dockerfile` for the backend container.
6. Deploy the Streamlit frontend as a second Web App for Containers with `frontend/Dockerfile`.
7. Set frontend `API_URL=https://<backend-domain>/api/v1`.

## GitHub Actions

The workflow at `.github/workflows/ci.yml` installs dependencies, runs tests with coverage, and builds backend/frontend Docker images. Add Azure publish profile secrets if you want the workflow to push images and deploy automatically.

## Production Checklist

- Use HTTPS-only ingress.
- Use MongoDB Atlas private networking when available.
- Store secrets in Azure App Settings or GitHub Actions secrets.
- Set restrictive CORS origins.
- Enable container log collection.
- Scrape `/metrics` with Prometheus or Azure Monitor.
