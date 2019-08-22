FROM node:10.15.2

ADD . /app

WORKDIR /app/fe
RUN npm install -g -s --no-progress yarn
RUN yarn install
RUN yarn build

WORKDIR /app

EXPOSE 4008

CMD chmod 777 *.sh && ./start-prod.sh