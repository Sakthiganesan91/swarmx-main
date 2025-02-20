#!/bin/bash

# Set the variables
ACR_NAME="swarmxcontainer"
IMAGE_NAME="node-backend"
IMAGE_TAG="latest"
DOCKERFILE_PATH="."

# Print the Azure username and current subscription
echo "Fetching Azure account details..."
AZURE_USER=$(az account show --query user.name -o tsv)
AZURE_SUBSCRIPTION=$(az account show --query name -o tsv)
echo "Azure User: $AZURE_USER"
echo "Azure Subscription: $AZURE_SUBSCRIPTION"

# Build the Docker image
docker build -t $IMAGE_NAME:$IMAGE_TAG $DOCKERFILE_PATH

# Log in to Azure Container Registry
az acr login --name $ACR_NAME

# Tag the local Docker image
echo "docker tag $IMAGE_NAME:$IMAGE_TAG $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG"
docker tag $IMAGE_NAME:$IMAGE_TAG $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG

# Push the Docker image to Azure Container Registry
echo "docker push $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG"
docker push $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG

# Clean up the local Docker image
# docker rmi $IMAGE_NAME:$IMAGE_TAG