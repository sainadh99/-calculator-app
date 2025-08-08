FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY . .

RUN mkdir -p /usr/src/app/data

EXPOSE 3000

CMD ["node", "app.js"]

