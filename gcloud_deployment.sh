# Build with API URL as build argument
docker build --build-arg VITE_API_BASE_URL="$API_URL" \
    --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
    --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
    --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
    -t de.htwg-konstanz.in/travel-frontend:"$VERSION" .

docker tag de.htwg-konstanz.in/travel-frontend:"$VERSION" europe-west1-docker.pkg.dev/"$PROJECT_ID"/docker-repo/travel-frontend:"$VERSION"
docker push europe-west1-docker.pkg.dev/$PROJECT_ID/docker-repo/travel-frontend:"$VERSION"

# Deploy to Cloud Run
 gcloud run deploy travel-frontend \
     --image europe-west1-docker.pkg.dev/$PROJECT_ID/docker-repo/travel-frontend:"$VERSION" \
     --region $REGION \
     --platform managed \
     --allow-unauthenticated \
     --service-account ${RUN_SA}@${PROJECT_ID}.iam.gserviceaccount.com
