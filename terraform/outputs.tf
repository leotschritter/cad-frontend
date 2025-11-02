# Output values for the frontend infrastructure

output "project_id" {
  description = "The GCP project ID"
  value       = var.project_id
}

output "region" {
  description = "The GCP region"
  value       = var.region
}

# Cloud Run Outputs
output "cloud_run_url" {
  description = "The URL of the Cloud Run frontend service"
  value       = google_cloud_run_v2_service.main.uri
}

output "cloud_run_service_name" {
  description = "The name of the Cloud Run service"
  value       = google_cloud_run_v2_service.main.name
}

# Artifact Registry Outputs (if using GCP Artifact Registry)
output "artifact_registry_name" {
  description = "The name of the Artifact Registry repository"
  value       = var.create_artifact_registry ? google_artifact_registry_repository.docker_repo[0].name : "N/A - Using external registry"
}

output "artifact_registry_url" {
  description = "The URL of the Artifact Registry repository"
  value       = var.create_artifact_registry ? "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_name}" : "N/A - Using external registry"
}

output "docker_image_url" {
  description = "The full Docker image URL used by Cloud Run"
  value       = var.docker_image_url != "" ? var.docker_image_url : "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_name}/${var.app_name}:${var.app_version}"
}

# Service Account Outputs
output "service_account_email" {
  description = "The email of the Cloud Run service account"
  value       = data.google_service_account.cloud_run_sa.email
}

output "service_account_name" {
  description = "The name of the Cloud Run service account"
  value       = data.google_service_account.cloud_run_sa.name
}

# Resource naming outputs
output "resource_suffix" {
  description = "The suffix used for resource names"
  value       = local.suffix
}

output "service_account_id" {
  description = "The service account ID with suffix"
  value       = local.service_account_name
}

# Deployment Information
output "deployment_commands" {
  description = "Commands to build and deploy the frontend application (matches gcloud_deployment.sh)"
  value = <<-EOT
    # Set environment variables:
    export PROJECT_ID="${var.project_id}"
    export REGION="${var.region}"
    export VERSION="${var.app_version}"
    export RUN_SA="${local.service_account_name}"
    export API_URL="${var.backend_url}"

    # Authenticate with Artifact Registry:
    gcloud auth configure-docker ${var.region}-docker.pkg.dev

    # Build with API URL as build argument:
    docker build --build-arg VITE_API_BASE_URL="$API_URL" -t de.htwg-konstanz.in/${var.app_name}:"$VERSION" .

    # Tag and push to Artifact Registry:
    docker tag de.htwg-konstanz.in/${var.app_name}:"$VERSION" ${var.region}-docker.pkg.dev/$PROJECT_ID/${var.artifact_registry_name}/${var.app_name}:"$VERSION"
    docker push ${var.region}-docker.pkg.dev/$PROJECT_ID/${var.artifact_registry_name}/${var.app_name}:"$VERSION"

    # Deploy to Cloud Run:
    gcloud run deploy ${var.cloud_run_service_name} \
      --image ${var.region}-docker.pkg.dev/$PROJECT_ID/${var.artifact_registry_name}/${var.app_name}:"$VERSION" \
      --region $REGION \
      --platform managed \
      --allow-unauthenticated \
      --service-account $${RUN_SA}@$${PROJECT_ID}.iam.gserviceaccount.com
  EOT
}

output "frontend_url" {
  description = "The frontend application URL"
  value       = google_cloud_run_v2_service.main.uri
}

output "backend_url" {
  description = "The configured backend API URL"
  value       = var.backend_url
}

