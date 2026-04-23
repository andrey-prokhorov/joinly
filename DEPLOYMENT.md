# Docker & Railway Deployment Guide

This guide covers how to containerize and deploy the Joinly application using Docker and Railway.

## Docker Setup

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### Local Development with Docker

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api-docs

3. **Stop the services:**
   ```bash
   docker-compose down
   ```

### Building Individual Images

#### Backend API
```bash
cd api
docker build -t joinly-api .
docker run -p 3001:3001 \
  -e JWT_SECRET="your-secret-key" \
  -e SEED_TESTUSER_1_PASSWORD="TestUser1@2024" \
  -e SEED_TESTUSER_2_PASSWORD="TestUser2@2024" \
  -e SEED_ADMIN_1_PASSWORD="AdminUser1@2024" \
  joinly-api
```

#### Frontend App
```bash
cd app
docker build -t joinly-app .
docker run -p 3000:3000 joinly-app
```

## Railway Deployment

### Prerequisites
1. **Railway Account:** Sign up at https://railway.app
2. **Railway CLI:** Install the Railway CLI
   ```bash
   npm install -g @railway/cli
   ```
3. **Login to Railway:**
   ```bash
   railway login
   ```

### Initial Setup

1. **Create Railway Projects:**
   ```bash
   # For API
   cd api
   railway init
   
   # For Frontend
   cd ../app
   railway init
   ```

2. **Set Environment Variables:**
   For the API project, set these environment variables in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=<generate-secure-secret>
   JWT_EXPIRES_IN=24h
   SEED_TESTUSER_1_PASSWORD=<secure-password>
   SEED_TESTUSER_2_PASSWORD=<secure-password>
   SEED_ADMIN_1_PASSWORD=<secure-password>
   RATE_LIMIT_ENABLED=true
   ACL_ENABLED=true
   ```

3. **Deploy Manually:**
   ```bash
   # Deploy API
   cd api
   railway up
   
   # Deploy Frontend
   cd ../app
   railway up
   ```

### Automated Deployment with GitHub Actions

1. **Set up GitHub Secrets:**
   Go to your GitHub repository → Settings → Secrets and variables → Actions
   
   Add these secrets:
   - `RAILWAY_TOKEN`: Get from Railway dashboard → Account Settings → Tokens
   - `RAILWAY_API_URL`: URL of your deployed API (optional, for health checks)
   - `RAILWAY_APP_URL`: URL of your deployed frontend (optional, for health checks)

2. **Automatic Deployment:**
   The deployment happens automatically on push to `main` branch via the GitHub Actions workflow.

### Environment Variables Guide

#### Required for API:
- `NODE_ENV`: Set to "production"
- `PORT`: Railway will set this automatically (usually 3001)
- `JWT_SECRET`: Generate a secure random key (min 32 characters)
- `JWT_EXPIRES_IN`: Token expiration (e.g., "24h")
- `SEED_TESTUSER_1_PASSWORD`: Secure password for seed user 1
- `SEED_TESTUSER_2_PASSWORD`: Secure password for seed user 2  
- `SEED_ADMIN_1_PASSWORD`: Secure password for admin user
- `RATE_LIMIT_ENABLED`: Set to "true" for production
- `ACL_ENABLED`: Set to "true" (never disable in production)

#### Frontend Configuration:
The frontend is served as static files and doesn't require environment variables in production.

## Health Checks

Both containers include health checks:
- **API**: `GET /health`
- **Frontend**: `GET /` (checks if nginx serves the app)

## Security Considerations

1. **Environment Variables:** Never commit `.env` files or expose secrets
2. **JWT Secret:** Use a cryptographically secure random key
3. **Rate Limiting:** Always enabled in production
4. **ACL:** Never disable access control in production
5. **HTTPS:** Railway provides HTTPS by default
6. **Container Security:** Both containers run as non-root users

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check Dockerfile syntax
   - Ensure all dependencies are in package.json
   - Verify .dockerignore doesn't exclude necessary files

2. **Runtime Issues:**
   - Check container logs: `docker logs <container-name>`
   - Verify environment variables are set correctly
   - Ensure database directory permissions are correct

3. **Railway Deployment Issues:**
   - Check Railway logs in the dashboard
   - Verify railway.json configuration
   - Ensure Railway CLI is authenticated

### Debugging Commands

```bash
# Check running containers
docker ps

# View container logs
docker logs <container-name>

# Execute command in running container
docker exec -it <container-name> /bin/sh

# Check Railway deployment status
railway status

# View Railway logs
railway logs
```

## File Structure

```
joinly/
├── api/
│   ├── Dockerfile              # Backend container definition
│   ├── railway.json           # Railway deployment config
│   └── .dockerignore          # Docker build exclusions
├── app/
│   ├── Dockerfile             # Frontend container definition
│   ├── nginx.conf             # Nginx configuration
│   ├── railway.json           # Railway deployment config
│   └── .dockerignore          # Docker build exclusions
├── docker-compose.yml         # Local development orchestration
└── .github/workflows/
    ├── docker-build.yml       # Docker build & test
    └── railway-deploy.yml     # Railway deployment
```