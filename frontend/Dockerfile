# Build the React app
FROM node:20-alpine

WORKDIR /app

# Install dependencies with network retry options
COPY package.json package-lock.json ./
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install

# Copy the rest of the code and build
COPY . .
RUN npm run build

# Create a simple script to keep container running
RUN echo '#!/bin/sh' > /keep-alive.sh && \
    echo 'while true; do sleep 3600; done' >> /keep-alive.sh && \
    chmod +x /keep-alive.sh

# Keep container running (no nginx, just build files)
CMD ["/keep-alive.sh"] 