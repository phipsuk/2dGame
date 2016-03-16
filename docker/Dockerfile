FROM node:slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm config set production
RUN npm config set http-proxy "http://10.0.2.2:8080"
RUN npm config set https-proxy "http://10.0.2.2:8080"
RUN npm config set proxy "http://10.0.2.2:8080"
RUN npm config set strict-ssl false

COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app

CMD ["node", "index.js"]
EXPOSE 3000
