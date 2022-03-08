#!/bin/bash

CONTAINER_NAME=impala-api_DEV
REDIS_CONTAINER=impala-api-redis

docker stop ${CONTAINER_NAME}
docker stop ${REDIS_CONTAINER}
docker rm ${REDIS_CONTAINER}
docker rm ${CONTAINER_NAME}

docker run -p 6379:6379 --name ${REDIS_CONTAINER} -d redis
docker run -d -p 10010:10010 --name ${CONTAINER_NAME} --link ${REDIS_CONTAINER}:redis -e "NODE_ENV=development" -v $(pwd):/app library/openjdk:8 /app/scripts/dev_entrypoint.sh