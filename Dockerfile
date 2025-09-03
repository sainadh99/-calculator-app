FROM node:18-alpine

WORKDIR /usr/src/app

# Copying package.json files
COPY package*.json ./
RUN npm install --only=production

COPY . .

# Create data directory
RUN mkdir -p /usr/src/app/data

EXPOSE 3000

CMD ["node", "app.js"]
