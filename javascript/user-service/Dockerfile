FROM node:boron-alpine

RUN apk update && apk add python make g++

# create an app user to not execute the app as root, for security reason.
# also creates an app directory /home/app
RUN addgroup -S app && adduser -S -g app app

WORKDIR /home/app/

# Install app dependencies
COPY package.json /home/app/
RUN chown -R app:app /home/app/*
USER app
RUN npm install

# Bundle app source
USER root
COPY . /home/app
RUN chown -R app:app /home/app/*
USER app

CMD [ "node", "user-service.js" ]

