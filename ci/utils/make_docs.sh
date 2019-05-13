#!/bin/bash

set -ex

: "${IMAGE_NAME:?IMAGE_NAME is required}"

docker run -t --rm \
       -v "$(pwd)/build:/workdir/docs-mounted" \
       --entrypoint bash \
       $IMAGE_NAME \
       -c "yarn run make-docs"








