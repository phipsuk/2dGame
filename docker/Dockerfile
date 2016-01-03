FROM node:slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm config set production

COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app

CMD ["node", "index.js"]
EXPOSE 3000
