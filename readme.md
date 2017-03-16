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

## Install

### Explicit dependencies

* docker engine at least: 17.03.0-ce [install docs](https://docs.docker.com/engine/installation/linux/)
* docker-compose at least: 1.11.2 [install docs](https://docs.docker.com/compose/install/)
  
## Execution

### Start the application
* Ensure that you installed both docker engine and docker-compose.
* Navigate to the main directory where the `docker-compose.yml` is located. 
* Execute the `docker-compose up -d` command.
* Wait, while all of the services are up and running.
* Navigate to the `http://127.0.0.1:8080` in your web browser to reach the application.

### Stop the application
* Execute the `docker-compose down` command from the project directory.

## Development details
See [development.md](development.md)

## Roadmap

Application
* [X] Create a user service to handle registration, login.
* [X] Create a table service to group players to tables.
* [ ] Describe API.
* [ ] Create a data access service, integrate to the database.
* [ ] Make all services stateless.
* [ ] Use crossbar.io internals for login.
* [ ] Create an external configuration file and its handler.
* [ ] Make a web frontend with react or angular.
* [ ] Crate a game service to execute a game on a specified table (do it stateless).

Application architecture, describe application services
* [X] Containerize node.js services.
* [X] Setup docker composer, to build up and describe the architecture.
* [X] Make development friendly docker images for javascript.
* [ ] Node.js services: hide the node_modules on the host from the container's code in development mode.
* [ ] Configure an init system for production code in containers.
* [X] Setup testing framework.
* [ ] Differentiate unit and end-to-end tests. 
 
Devops architecture, external elements
* [ ] Integrate a noSQL database / redis to the architecture --> make all the services stateless.
* [ ] Add logging and health checking to the architecture.
* [ ] Add testing and CI/CD node to the architecture.

Future ideas
* [ ] Make a mobile app.
* [ ] Make a chat service.
