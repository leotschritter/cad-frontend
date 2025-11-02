# Required Variables
variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

# Optional Variables with Defaults
variable "region" {
  description = "The GCP region for resources"
  type        = string
  default     = "europe-west1"
}

variable "zone" {
  description = "The GCP zone for resources"
  type        = string
  default     = "europe-west1-b"
}

variable "app_name" {
  description = "Name of the application"
  type        = string
  default     = "travel-frontend"
}

variable "app_version" {
  description = "Version/tag of the Docker image"
  type        = string
  default     = "latest"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# Resource Management
variable "use_random_suffix" {
  description = "Whether to use random suffix for resource names"
  type        = bool
  default     = false
}

variable "resource_suffix" {
  description = "Custom suffix for resource names (if use_random_suffix is false)"
  type        = string
  default     = ""
}

variable "import_existing_resources" {
  description = "Whether to import existing resources instead of creating new ones"
  type        = bool
  default     = true
}

variable "create_service_account" {
  description = "Whether to create a new service account (false = use existing)"
  type        = bool
  default     = false
}

variable "existing_service_account_email" {
  description = "Email of existing service account to use (when create_service_account = false)"
  type        = string
  default     = ""
}

variable "create_cloud_run_service" {
  description = "Whether to create Cloud Run service (false = update existing)"
  type        = bool
  default     = false
}

# Cloud Run Configuration
variable "cloud_run_service_name" {
  description = "Name of the Cloud Run service"
  type        = string
  default     = "travel-frontend"
}

variable "cloud_run_cpu" {
  description = "CPU allocation for Cloud Run (e.g., '1', '2', '4')"
  type        = string
  default     = "1"
}

variable "cloud_run_memory" {
  description = "Memory allocation for Cloud Run (e.g., '512Mi', '1Gi', '2Gi')"
  type        = string
  default     = "512Mi"
}

variable "cloud_run_max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
}

variable "cloud_run_min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
}

variable "cloud_run_timeout" {
  description = "Request timeout in seconds"
  type        = number
  default     = 300
}

# Artifact Registry Configuration
variable "artifact_registry_name" {
  description = "Name of the Artifact Registry repository"
  type        = string
  default     = "docker-repo"
}

variable "create_artifact_registry" {
  description = "Whether to create an Artifact Registry repository"
  type        = bool
  default     = false
}

# Docker Image Configuration
variable "docker_image_url" {
  description = "Full URL of the Docker image to deploy (if empty, uses Artifact Registry)"
  type        = string
  default     = ""
}

# Backend Configuration
variable "backend_url" {
  description = "URL of the backend API"
  type        = string
  default     = "https://travel-backend-123456789-ew.a.run.app"
}

# Domain Configuration
variable "domain_name" {
  description = "Custom domain name for the service (optional)"
  type        = string
  default     = ""
}

# Networking Configuration
variable "allow_unauthenticated" {
  description = "Allow unauthenticated access to the service"
  type        = bool
  default     = true
}

# Labels
variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default = {
    app        = "travel-frontend"
    managed-by = "terraform"
    environment = "prod"
  }
}

variable "service_account_email" {
  description = "Service account email for Cloud Run"
  type        = string
}
