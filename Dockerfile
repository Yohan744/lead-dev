FROM node:alpine
COPY . /app
WORKDIR /app
RUN npm install
#EXPOSE 3000
CMD node app/server.js