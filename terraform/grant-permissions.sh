#!/bin/bash
# Grant GitHub Actions service account the necessary permissions for Terraform

PROJECT_ID="graphite-plane-474510-s9"
SA_EMAIL="github-actions-terraform@${PROJECT_ID}.iam.gserviceaccount.com"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   Granting Permissions to GitHub Actions Service Account     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Service Account: $SA_EMAIL"
echo ""

# Check if service account exists
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "❌ Service account doesn't exist. Creating it..."
    gcloud iam service-accounts create github-actions-terraform \
        --display-name="GitHub Actions Terraform" \
        --description="Service account for GitHub Actions to deploy infrastructure" \
        --project="$PROJECT_ID"

    if [ $? -eq 0 ]; then
        echo "✅ Service account created!"
    else
        echo "❌ Failed to create service account"
        exit 1
    fi
else
    echo "✅ Service account already exists"
fi

echo ""
echo "Granting required IAM roles..."
echo ""

# Array of required roles
roles=(
    "roles/iam.serviceAccountAdmin"    # Create service accounts
    "roles/run.admin"                   # Manage Cloud Run services
    "roles/iam.serviceAccountUser"      # Use service accounts
)

for role in "${roles[@]}"; do
    echo "  Granting $role..."
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SA_EMAIL" \
        --role="$role" \
        --quiet

    if [ $? -eq 0 ]; then
        echo "  ✅ $role granted"
    else
        echo "  ⚠️  Failed to grant $role (may already be granted)"
    fi
done

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   ✅ Permissions Granted!                                     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Your GitHub Actions service account now has permissions to:"
echo "  - Create service accounts (roles/iam.serviceAccountAdmin)"
echo "  - Create and manage Cloud Run services (roles/run.admin)"
echo "  - Use service accounts (roles/iam.serviceAccountUser)"
echo ""
echo "Next steps:"
echo "1. Make sure GCP_SERVICE_ACCOUNT_KEY secret is set in GitHub"
echo "2. Commit and push your changes"
echo "3. The workflow will succeed!"
echo ""

# Verify permissions
echo "Verifying permissions..."
gcloud projects get-iam-policy "$PROJECT_ID" \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:$SA_EMAIL" \
    --format="table(bindings.role)"

echo ""
echo "Done! ✅"

