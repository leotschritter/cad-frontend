# Generate random suffix for unique resource names
resource "random_id" "suffix" {
  byte_length = 4
}

# Local variables for resource naming
locals {
  suffix = var.resource_suffix != "" ? var.resource_suffix : (var.use_random_suffix ? random_id.suffix.hex : "")
  service_account_name = var.use_random_suffix ? "${var.app_name}-sa-${local.suffix}" : "${var.app_name}-sa"
}

# Enable required Google Cloud APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
  ])

  service            = each.value
  disable_on_destroy = false
}

# Service Account for Cloud Run
resource "google_service_account" "cloud_run_sa" {
  account_id   = local.service_account_name
  display_name = "Cloud Run SA for ${var.app_name}"
  description  = "Service account for Cloud Run frontend service"

  depends_on = [google_project_service.required_apis]

  lifecycle {
    prevent_destroy = false
    # If resource exists, import it instead of failing
    # Run: terraform import google_service_account.cloud_run_sa projects/PROJECT_ID/serviceAccounts/SERVICE_ACCOUNT_EMAIL
  }
}


# Artifact Registry Repository (optional - only if not using external registry)
resource "google_artifact_registry_repository" "docker_repo" {
  count = var.create_artifact_registry ? 1 : 0

  location      = var.region
  repository_id = var.artifact_registry_name
  description   = "Docker repository for ${var.app_name}"
  format        = "DOCKER"

  labels = var.labels

  depends_on = [google_project_service.required_apis]

  lifecycle {
    prevent_destroy = false
    # If resource exists, import it instead of failing
    # Run: terraform import 'google_artifact_registry_repository.docker_repo[0]' projects/PROJECT_ID/locations/REGION/repositories/REPO_NAME
  }
}


# Cloud Run Service for Frontend
resource "google_cloud_run_v2_service" "main" {
  name     = var.cloud_run_service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloud_run_sa.email

    scaling {
      min_instance_count = var.cloud_run_min_instances
      max_instance_count = var.cloud_run_max_instances
    }

    containers {
      image = var.docker_image_url != "" ? var.docker_image_url : "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_name}/${var.app_name}:${var.app_version}"

      resources {
        limits = {
          cpu    = var.cloud_run_cpu
          memory = var.cloud_run_memory
        }
        cpu_idle          = true
        startup_cpu_boost = false
      }

      ports {
        container_port = 80
        name          = "http1"
      }

      startup_probe {
        initial_delay_seconds = 0
        timeout_seconds       = 10
        period_seconds        = 5
        failure_threshold     = 3
        tcp_socket {
          port = 80
        }
      }
    }
  }

  depends_on = [
    google_project_service.required_apis,
  ]

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Data source for project information
data "google_project" "project" {
  project_id = var.project_id
}

# Cloud Run IAM - Allow public access
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  count = var.allow_unauthenticated ? 1 : 0

  project  = google_cloud_run_v2_service.main.project
  location = google_cloud_run_v2_service.main.location
  name     = google_cloud_run_v2_service.main.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Optional: Domain Mapping (requires domain verification)
# resource "google_cloud_run_domain_mapping" "default" {
#   count = var.domain_name != "" ? 1 : 0
#
#   location = var.region
#   name     = var.domain_name
#
#   metadata {
#     namespace = var.project_id
#   }
#
#   spec {
#     route_name = google_cloud_run_v2_service.main.name
#   }
# }
