# SSP Demo

Demonstrates how can be working together a crossbar.io WAMP 
router, a node.js microservice and a simple websocket
based webapp.
 
The webapp shows a simple interface, where a user can 
log in, log out, register and deregister. The always fresh
user list are shown below the login form.
 
The demo's main goal is to test the WAMP protocol's models: RPC and PUB-SUB.

The demo prepares the main Schampsen app's API documentation.

## Directory structure

* client: a html page with some JS code, a static asset, this is the webapp. It is served by the crossbar-service. (Client code is quite ugly, this is just a prototype.)
* crossbar-service: a docker container for the crossbar.io WAMP router, also responsible for the static HTTP requests.
* user-service: a node.js microservice, responsible for user registration and login.
* table-service: a node.js microservice, responsible for table handling, but not for games.
 
## Install

### Needed packages for linux:

* docker 1.12.x
* node.js 6.9.x (LTS)
* wget
* realpath
 
### Preparing the node.js microservices

- First install node.js.
- Change the directory where node.js microservices are found.
- `npm install` will install all the dependencies
- the node.js microservices will be containerized
 
### Preparing docker contained modules

- Simple execute the `start.sh` for starting the service
- Execute the `stop.sh` to stop the service and collect the logs.
- More information in the `start.sh` file.
- No extra preparation needed, during the first install, all needed
docker image will be fetched.

## Execution

* First start the crossbar.io router by executing the `start.sh` from the `crossarbar-service` directory.
* Start the other services after that, like `user-service`.
* Use the `npm start` to start the node.js services.
* Navigate to the `http://127.0.0.1:8080` in your web browser, you will see the application.

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
* [ ] Containerize node.js services.
* [ ] Setup docker compose, to build up and describe the architecture.

Devops architecture, external elements
* [ ] Add logging and health checking to the architecture.
* [ ] Add testing and CI/CD node to the architecture.
* [ ] Integrate a noSQL database / redis to the architecture --> make all the services stateless.
