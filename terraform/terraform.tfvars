# Frontend Terraform Variables File
# Configuration for deploying the Travel App frontend to Google Cloud Run

# Required Variables
project_id = "graphite-plane-474510-s9"

# Optional Variables (defaults are provided)
region                  = "europe-west1"
zone                    = "europe-west1-b"
app_name                = "travel-frontend"
app_version             = "latest"
environment             = "prod"

# Resource Management Strategy
use_random_suffix       = false
resource_suffix         = ""
import_existing_resources = true
create_service_account  = false  # Use existing service account (avoids IAM permission issues)
create_cloud_run_service = false  # Update existing Cloud Run service (avoids permission issues)

# Specify your existing service account email
# Example: existing_service_account_email = "your-sa@graphite-plane-474510-s9.iam.gserviceaccount.com"
# Leave empty to auto-detect based on app_name (travel-frontend-sa)
existing_service_account_email = "travel-frontend-sa@graphite-plane-474510-s9.iam.gserviceaccount.com"

# Cloud Run Configuration
cloud_run_service_name  = "travel-frontend"
cloud_run_cpu           = "1"
cloud_run_memory        = "512Mi"
cloud_run_max_instances = 10
cloud_run_min_instances = 0
cloud_run_timeout       = 300

# Artifact Registry Configuration
artifact_registry_name  = "docker-repo"

# Docker Image Configuration
# Using existing GCP Artifact Registry (shared with backend)
create_artifact_registry = false
docker_image_url = ""

# Backend API Configuration
backend_url = "https://api.tripico.fun"

# Domain Configuration (optional)
domain_name             = ""

# Networking Configuration
allow_unauthenticated   = true

# Labels
labels = {
  app         = "travel-frontend"
  managed-by  = "terraform"
  environment = "prod"
  team        = "cad-team"
}
