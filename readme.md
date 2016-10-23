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

* client: a html page with some JS code, this is the webapp.
* crossbar-service: a docker container for the crossbar.io WAMP router, also responsible for the static HTTP requests.
* user-service: a node.js microservice 
 
## Install

### Needed packages for linux:

* docker
* node.js
* wget
* realpath
 
### Preparing the node.js microservices

- First install node.js.
- Change the directory where node.js microservices are found.
- `npm install` will install all the dependencies
 
### Preparing docker contained modules

- Simple execute the `start.sh `for starting the service
- Execute the `stop.sh `to stop the service and collect the logs.
- More information in the `start.sh `file.
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





 
