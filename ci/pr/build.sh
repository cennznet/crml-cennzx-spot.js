#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
set -ex

# Required Environment variables. Set them by using the commands below
: "${IMAGE_NAME:?IMAGE_NAME environment variable is required}"
: "${GEMFURY_TOKEN:?GEMFURY_TOKEN environment variable is required}"

: "${IMAGE_NAME:?IMAGE_NAME is required}"

docker build -t "${IMAGE_NAME}" \
     --build-arg GEMFURY_TOKEN="${GEMFURY_TOKEN}" \
     -f $DIR/Dockerfile .