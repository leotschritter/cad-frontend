#!/usr/bin/env bash

kubectl apply -f cad-frontend.yaml
kubectl apply -f ingress-dev.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
kubectl rollout status deployment/cad-frontend --timeout=120s
# check status of all pods
kubectl get pods -w
