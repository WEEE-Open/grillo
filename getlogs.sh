#!/bin/bash

# Check if Docker is installed and the daemon is running
if ! command -v docker &> /dev/null || ! docker info &> /dev/null; then
    echo "Error: Docker is not installed or the Docker daemon is not running."
    exit 1
fi

# Check if a container name is provided as an argument
if [ "$#" -eq 0 ]; then
    # List all container names
    echo "Available containers:"
    docker ps -a --format '{{.Names}}'
    exit 0
fi

# Get the container name from the command line argument
container_name="$1"

# Check if the Docker container exists
if docker ps -a --format '{{.Names}}' | grep -q "^$container_name$"; then
    # Output the logs of the specified Docker container
    docker logs "$container_name"
else
    echo "Container '$container_name' not found."
    exit 1
fi
