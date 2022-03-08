FROM node:16
RUN apt-get update && apt-get install -y openjdk-11-jdk

LABEL maintainer="sergio@pue.es"

COPY . /app
WORKDIR /app
RUN npm install
EXPOSE 10010

CMD ["npm", "start"]