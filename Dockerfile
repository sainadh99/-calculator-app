# Use official lightweight Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .

# Ensure data directory exists
RUN mkdir -p /usr/src/app/data

# Expose application port
EXPOSE 3000

# Optional: Use a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Start the app
CMD ["node", "app.js"]
