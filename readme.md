# SSP Demo

Demonstrates how can be working together a crossbar.io WAMP router, 
a more node.js microservices and a simple websocket based webapp, using
Docker to containerize and manage them all together. 
 
The webapp shows a simple interface, where a user can 
log in, log out, register and deregister, and able to manage "tables". 
The always fresh user list are shown below the login form.
 
The demo's main goal is to test the WAMP protocol's models: RPC and PUB-SUB,
and usage of docker containers.

The demo prepares the main Schnapscen app's API documentation and base modules.

## Directory structure

* client: a html page with some JS code, a static asset, this is the webapp. It is served by the crossbar-service. 
Mapping defined in `docker-compose.yml` (Client code is quite ugly, this is just a prototype.)
* crossbar-service: a configuration file to the crossbar.io WAMP router, described in the `docker-compose.yml`.
* javascript/user-service: a node.js microservice, responsible for user registration and login.
* javascript/table-service: a node.js microservice, responsible for table handling (grouping of the users), but not for games.
* javascript/lib: node.js modules used common by the microservices.
* javascript/Dockerfile-common: A common dokcerfile used to build all kind of node.js based containers. 
* javascript/.dockerignore: A dockerigonre file used for all node.js based container's build.
* scala/*: scala based microservices.
* docker-compose.yml: describes the services, networks and volumes for Docker for one command service execution.
* docker-compose.development.yml: describes the development related configuration.
 
## Install

### Explicit dependencies

* docker 1.12.x engine [install docs](https://docs.docker.com/engine/installation/linux/)
* docker-compose 1.8.x [install docs](https://docs.docker.com/compose/install/)
  
## Execution

### Start the application
* Ensure that you installed both docker engine and docker-compose.
* Navigate to the main directory where the `docker-compose.yml` is located. 
* Execute the `docker-compose up -d` command.
* Wait, while all of the services are up and running.
* Navigate to the `http://127.0.0.1:8080` in your web browser to reach the application.

### Stop the application
* Execute the `docker-compose down` command from the project directory.

## Development mode

### Dependencies, where to find them?
For examining dependencies, check the following files.
* For application architecture and general Docker container dependencies see: `docker-compose.yml`.
* For development container dependencies and debug port binding see: `docker-compose.development.yml`.
* For a Javascript based Docker container dependencies see: `Dockerfile-common` in the javascript subdir.
* For a given node.js application level dependencies see: `package.json` in the service source directory.

### Development with docker
* `docker-compose.development.yml` contains the modificion related to docker-compose.yml for development.
* Use the `docker-compose -f docker-compose.yml -f docker-compose.development.yml up` to merge the 2 files, 
and start the application in development mode.
* If you would like to enforce the rebuild of all related images, use the following command: 
`docker-compose -f docker-compose.yml -f docker-compose.development.yml up --force-recreate --build`

### Node.js apps in development
* Development mode build different way the node.js images, set up a `NODE_ENV` environmental variable to `development` 
in the container during build. It causes that the `npm` will install the dev dependencies.
* The js source dir is exposed to the host's source dir, so you can directly modify the js files, it will be seen 
in the container.
* nodemon module is used to automatically restart the node.js service, if the source file is changed.
* The services are executed with an --inspect command, can be used to debugging in chrome with a given ports, 
see `docker-compose.development.yml`.
* The `NODE_ENV` variable is also set to `development` in the execution container. 
* The `Dockerfile-common` dockerfile is responsible to build all the node.js based services driven by `docker-compose.yml`, 
a build argument is used to define which node.js service will be installed inside a container. See the
dockerfile for more details.

### Note about hostnames and networking in code
*Note:* Docker compose defines networks for all the dockerized microservices.
All the docker containers name (defined in `docker-compose.yml`) will be 
the host names of the services in the defined network. From now the code is refers
to the service hosts as its service names instead of localhost.

For example you can connect from the code to the crossbar router (which name is crossbar-service
it is defined as the first service in `docker-compose.yml`) with the `ws://crossbar-service:8080/ws` URL.
The `localhost` will be not working anymore.

### Log collection from all of the services
After you started the application with the `docker-compose` in development mode, the same window you will be see all of the logs
produced by all the services signed with a service tag in the beginning. This is a docker-compose feature.

## Resources

Used technologies:

* Node.js: https://nodejs.org/en/
* Docker: https://www.docker.com/
* Crossbar.io: http://crossbar.io/
* Autobahn.js: http://autobahn.ws/js/
* WAMP: http://wamp-proto.org/
* nodemon: https://www.npmjs.com/package/nodemon

## Roadmap

Application
* [X] Create a user service to handle registration, login.
* [X] Create a table service to group players to tables.
* [ ] Describe API.
* [ ] Create a data access service, integrate to the database.
* [ ] Make all services stateless.
* [ ] Separate user service to register service and login service. (?)
* [ ] Use crossbar.io internals for login.
* [ ] Create an external configuration file.
* [ ] Make a frontend with react or angular.
* [ ] Crate a game service to execute a game on a specified table (do it stateless).

Application architecture, describe application services
* [X] Containerize node.js services.
* [X] Setup docker composer, to build up and describe the architecture.
* [X] Make development friendly docker images for javascript.
* [ ] Node.js services: hide the node_modules on the host from the container's code in development mode.
* [ ] Configure an init system for production code in containers.

Devops architecture, external elements
* [ ] Integrate a noSQL database / redis to the architecture --> make all the services stateless.
* [ ] Add logging and health checking to the architecture.
* [ ] Add testing and CI/CD node to the architecture.
