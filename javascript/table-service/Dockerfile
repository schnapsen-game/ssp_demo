FROM node:boron-alpine

ARG NODE_ENV

RUN printenv

# update the package manager's repo and install dependencies needed for NPM modules.
RUN apk update && apk add python make g++

# create an app user to not execute the app as root, for security reason.
# also creates an app directory in as a home dir of the user /home/app
RUN addgroup -S app && adduser -S -g app app \
    && mkdir /home/app/service \
    && chown -R app:app /home/app/*

WORKDIR /home/app/

# Install app dependencies using the source's JSON file. Copy can be made
# as root only, for execution you have to set owner of the files and switch user.
COPY package.json /home/app/
RUN chown -R app:app /home/app/*
USER app
RUN npm install

WORKDIR /home/app/service

# copy the source code as root, set the ownership and switch user.
USER root
COPY . /home/app/service
RUN chown -R app:app /home/app/service/*
USER app

# set the default command, not using NPM because it is not forward the signals to
# the application, so we execute the service directly using node.
CMD [ "node", "table-service.js" ]
