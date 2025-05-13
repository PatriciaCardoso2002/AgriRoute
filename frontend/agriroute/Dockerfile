FROM node:18 as builder

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM node:18-alpine

RUN npm install -g serve
WORKDIR /app

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]


