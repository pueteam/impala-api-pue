#!/bin/bash

# To be called bin/release.sh
# SET THE FOLLOWING VARIABLES
# docker hub username
USERNAME=pueteam
# image name
IMAGE=impala-api
PROJECT_ID=future-digital-platform
# ensure we're up to date
#git pull
# bump version
docker run --rm -v "$PWD":/app $USERNAME/$IMAGE patch
version=$(cat VERSION)
echo "version: $version"
# run build
./scripts/build.sh
# tag it
#git add -A
#git commit -m "version $version"
#git tag -a "$version" -m "version $version"
#git push
#git push --tags
docker tag $USERNAME/$IMAGE:latest $USERNAME/$IMAGE:$version
# push it
docker rmi eu.gcr.io/future-digital-platform/$USERNAME/$IMAGE:latest
docker tag $USERNAME/$IMAGE eu.gcr.io/future-digital-platform/$USERNAME/$IMAGE
docker tag $USERNAME/$IMAGE eu.gcr.io/future-digital-platform/$USERNAME/$IMAGE:$version
gcloud docker -- push eu.gcr.io/future-digital-platform/$USERNAME/$IMAGE:latest
gcloud docker -- push eu.gcr.io/future-digital-platform/$USERNAME/$IMAGE:$version

echo Run this: kubectl set image deployment/$IMAGE $IMAGE=eu.gcr.io/${PROJECT_ID}/$USERNAME/$IMAGE:$version