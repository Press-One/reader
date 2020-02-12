FROM node:10.15.2

ADD . /app
RUN rm -rf /app/be/build
RUN mv /app/fe/build /app/be/build

WORKDIR /app/be
RUN npm config set registry https://registry.npm.taobao.org
RUN npm install
RUN npm install wait-on -g

WORKDIR /app

EXPOSE 9000