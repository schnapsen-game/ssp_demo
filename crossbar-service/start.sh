#!/usr/bin/env bash
# Documentation
#   This script starts a simple crossbar docker instance
#   Using the parameter section for port mapping and the
#   internal name of the container.
#
#   The docker client automatically fetch the crossbario/crossbar
#   pre compiled image if it is not among the local images.
#
#   The script is waiting still the container has been started,
#   using the a http requests for checking a service. So in crossbar.io
#   config a working HTTP server configuration should be exists.
#
#   The relative path 'node' from the srcipts execution directory
#   will be mapped into the container.
#
#   requirements are docker, wget and realpath tools:
#       sudo apt-get install docker wget realpath

# parameters:

# define the mapped ports inside and outside of the container.
IN_PORT=8080
OUT_PORT=8080
# define the container name
CONTAINER_NAME='crossbar-service'
# static http path, relative to this scripts directory
STATIC_WEB_PATH='../client/web'
# config path, where the config.json can be found, relative to this scripts directory
CONFIG_PATH='.crossbar'
# the loglevel of the crossbar service: http://crossbar.io/docs/Logging/
CROSSBAR_LOGLEVEL='debug'

# get the full path for the script file itself --> absolute path is needed for docker command
SCRIPTFILE=`realpath $0`
# create an absolute path without the filename
SCRIPTPATH=`dirname $SCRIPTFILE`

#run the docker container, with port and dir mapping
docker run --detach --publish $OUT_PORT:$IN_PORT --volume $SCRIPTPATH/$CONFIG_PATH:/node/.crossbar --volume $SCRIPTPATH/$STATIC_WEB_PATH:/node/web --name $CONTAINER_NAME crossbario/crossbar --loglevel $CROSSBAR_LOGLEVEL --logformat syslogd

# wait while the HTTP port will be available provided by the container
while ! wget --quiet --delete-after http://127.0.0.1:$OUT_PORT/
do
  echo "$(date) - still trying"
  sleep 1
done
echo "$(date) - connected successfully"

#list the status of the running docker instances
docker ps