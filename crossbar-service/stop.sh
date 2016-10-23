#!/usr/bin/env bash
# Documentation
#   Stops a docker container named in the parameter section.
#   Save its log, then remove the stopped container among the
#   containers. You can not start any container with the same name
#   again, while it is not removed from the sopped ones.

# parameters:

# the referred container name
CONTAINER_NAME=crossbar-node

#stop the docker container
docker stop $CONTAINER_NAME
# docker is wait till the stop is finished
docker wait $CONTAINER_NAME
# get the logs (STDOUT, STDERR)and saved into a file
docker logs $CONTAINER_NAME >> "$CONTAINER_NAME.log"
# check the running docker processes
docker ps
# remove the stopped instances from the container list
docker rm $CONTAINER_NAME
# check, that no stopped containers are exists
docker ps -a
