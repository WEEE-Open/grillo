#!/bin/bash

CONFIG_PATH="/usr/src/app/backend/config.js"
DEV_CONFIG_PATH="/usr/src/app/backend/config.dev.js"

# Check if config.js exists
if [ ! -f "$CONFIG_PATH" ]; then
    echo "config.js not found. Creating symbolic link to config.dev.js..."

    if [ -f "$DEV_CONFIG_PATH" ]; then
        ln -s "$DEV_CONFIG_PATH" "$CONFIG_PATH"
        echo "Symbolic link created: config.js -> config.dev.js"
    else
        echo "Error: config.dev.js not found. Cannot create symbolic link."
        exit 1
    fi
else
    echo "config.js detected, not overwriting."
fi

ls

npm run dev
