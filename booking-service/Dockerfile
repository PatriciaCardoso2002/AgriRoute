FROM node:18

RUN npm install -g @nestjs/cli

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8005

CMD ["npm", "run", "start:dev"]
