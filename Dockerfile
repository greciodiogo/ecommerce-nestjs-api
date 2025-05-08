FROM node:18-alpine as base

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm i -g @nestjs/cli


FROM base as dev

RUN npm install --legacy-peer-deps

COPY . .


FROM base as prod

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

