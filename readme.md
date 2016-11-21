# SSP Demo

Demonstrates how can be working together a crossbar.io WAMP router, 
a more node.js microservices and a simple websocket based webapp, using
Docker to containerize and manage them all together. 
 
The webapp shows a simple interface, where a user can 
log in, log out, register and deregister, and able to manage "tables". 
The always fresh user list are shown below the login form.
 
The demo's main goal is to test the WAMP protocol's models: RPC and PUB-SUB.

The demo prepares the main Schnapscen app's API documentation and base modules.

## Directory structure

* client: a html page with some JS code, a static asset, this is the webapp. It is served by the crossbar-service. (Client code is quite ugly, this is just a prototype.)
* crossbar-service: a docker container for the crossbar.io WAMP router, also responsible for the static HTTP requests.
* javascript/user-service: a node.js microservice, responsible for user registration and login.
* javascript/table-service: a node.js microservice, responsible for table handling (grouping of the users), but not for games.
* docker-compose.yml: describes the services, networks and volumes for Docker for one command service execution.
 
## Install

### Dependencies

* docker 1.12.x engine [install docs](https://docs.docker.com/engine/installation/linux/)
* docker-compose 1.8.x [install docs](https://docs.docker.com/compose/install/)
  
## Execution

### Start the application
* Ensure that you installed both docker engine and docker-compose.
* Navigate to the main directory where the `docker-compose.yml` is located. 
* Execute the `docker-compose up` command.
* Navigate to the `http://127.0.0.1:8080` in your web browser to reach the application.

### Stop the application
* Execute the `docker-compose down` command from the project directory.

## Development

### Dependencies for development
* Node.js 6.9.x [install instruction](https://nodejs.org/en/download/package-manager/).

### Preparing the node.js microservices for development without docker container execution

* Change the directory where node.js microservices are found.
* `npm install` will install all the module dependencies, see `package.json`.
* The `Dockerfile` describes, how the docker container should build by docker.

### Note about hostnames and networking in code
*Note:* Docker compose defines networks for all the dockerized microservices.
All the docker containers name (defined in `docker-compose.yml`) will be 
the host names of the services in the defined network. From now the code is refers
to the service hosts as its service names instead of localhost.

For example you can connect from the code to the crossbar router (which name is crossbar-service
it is defined as the first service in `docker-compose.yml`) with the `ws://crossbar-service:8080/ws` URL.
The `localhost` will be not working anymore.

### Log collection from all of the services
After you started the aplication with the `docker-compose up`, the same window you will be see all of the logs
produced by all the services signed with a service tag in the beginning. This is a docker-compose feature.

## Resources

Used technologies:

* Node.js: https://nodejs.org/en/
* Docker: https://www.docker.com/
* Crossbar.io: http://crossbar.io/
* Autobahn.js: http://autobahn.ws/js/
* WAMP: http://wamp-proto.org/

## Roadmap

Application
* [X] Create a user a service to handle registration, login.
* [X] Create a table service to group players to tables.
* [ ] Crate a game service to execute a game on a specified table (do it stateless).
* [ ] Describe API.
* [ ] Make all services stateless.
* [ ] Separate user service to register service and login service.
* [ ] Use crossbar.io internals for login.
* [ ] Make a frontend with react or angular.

Application architecture, describe application services
* [x] Containerize node.js services.
* [x] Setup docker compose, to build up and describe the architecture.

Devops architecture, external elements
* [ ] Add logging and health checking to the architecture.
* [ ] Add testing and CI/CD node to the architecture.
* [ ] Integrate a noSQL database / redis to the architecture --> make all the services stateless.
