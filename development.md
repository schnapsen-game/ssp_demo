# Developer documentation 

## Directory structure

* `client`: a html page with some JS code, a static asset, this is the webapp. It is served by the crossbar-service. 
Mapping defined in `docker-compose.yml` (Client code is quite ugly, this is just a prototype.)
* `crossbar-service`: a configuration file to the crossbar.io WAMP router, described in the `docker-compose.yml`.
* `javascript/user-service`: a node.js microservice, responsible for user registration and login.
* `javascript/table-service`: a node.js microservice, responsible for table handling (grouping of the users), but not for games.
* `javascript/lib`: node.js modules used common by the microservices.
* `javascript/Dockerfile-common`: A common dokcerfile used to build all kind of node.js based containers. 
* `javascript/.dockerignore`: A dockerigonre file used for all node.js based container's build.
* `scala/*`: scala based microservices.
* `docker-compose.yml`: describes the services, networks and volumes for Docker for one command service execution.
* `docker-compose.development.yml`: describes the development related configuration.
 
## Dependencies, where to find them?
For examining dependencies, check the following files.
* For application architecture and general Docker container dependencies see: `docker-compose.yml`.
* For development container dependencies and debug port binding see: `docker-compose.development.yml`.
* For a Javascript based Docker container dependencies see: `Dockerfile-common` in the javascript subdir.
* For a given node.js application level dependencies see: `package.json` in the service source directory.

## Development with docker
* `docker-compose.development.yml` contains the modificion related to docker-compose.yml for development.
* Use the `docker-compose -f docker-compose.yml -f docker-compose.development.yml up` to merge the 2 files, 
and start the application in development mode.
* If you would like to enforce the rebuild of all related images, use the following command: 
`docker-compose -f docker-compose.yml -f docker-compose.development.yml up --force-recreate --build`

## Node.js apps in development
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

## Note about hostnames and networking in code
The containers are executed in `host` mode. This means, that the host computers network will be used
for all of the containers. All the services provided by the containers can be reached by localhost +
the specific port. 

The crossbar service can be reached on `ws:\\localhost:8080\ws` for example. You can able the connect this
service from a local service from your computer without containerizatioin. This is useful for in early phase 
development of a service or a quict trial. 

## Log collection from all of the services
After you started the application with the `docker-compose` in development mode, the same window you will be see all of the logs
produced by all the services signed with a service tag in the beginning. This is a docker-compose feature.

## Documentation
Possible to use JSdoc or JavaDoc in the code. The javascript tool that able to generate internal documentation from is
jsdoc2md

## Testing
* For Javascript backend a Mocha - Sinon - must.js triplet used as a core testing tools.
* Each service and the core lib module has its own tests, also defined in their package.json.
* Tests can be executed by `npm test` command in the given module and the common lib subdir.
* The test specs ending with `*.test.js`.

### Mixed unit and end to end tests (will be separated)
* At the moment a current common `lib` modules have tests, unit and end to end tests are mixed together.
* The WAMP router service (crossbar-service) should executing to run the end to end tests. 

### Run tests with crossbar-service
Start the crossbar service from the `ssp_demo` main dir:

`docker-compose -f docker-compose.yml -f docker-compose.development.yml up -d  crossbar-service`

Change the directory to the common javascript libs subdir

`cd javascript/lib`

Execute the unit and end to end tests together:

`npm test`

## Resources

Used technologies:

* Core backend - Node.js: https://nodejs.org/en/
* Containerization - Docker: https://www.docker.com/
* Messaging - Crossbar.io: http://crossbar.io/
* Messaging protocol handler - Autobahn.js: http://autobahn.ws/js/
* Messaging protocol - WAMP: http://wamp-proto.org/
* Documentation - jsdoc-to-markdown: https://www.npmjs.com/package/jsdoc-to-markdown
* Testing framework - Mocha: http://mochajs.org/
* Spy lib - Sinon: http://sinonjs.org/
* Assertion lib - must.js: https://github.com/moll/js-must