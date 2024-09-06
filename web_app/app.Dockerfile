FROM node:alpine

# Set working directory
WORKDIR /app

# Install PM2 globally
RUN npm install --global pm2

# Copy "package.json" and "package-lock.json" before other files
# Utilise Docker cache to save re-installing dependencies if unchanged
COPY ./src/package*.json /app

# Install dependencies
RUN npm install --production

# Copy all files
COPY ./src /app
WORKDIR ./src

# Build app
RUN npm run build

# Expose the listening port
EXPOSE 3001

# Run container as non-root (unprivileged) user
# The "node" user is provided in the Node.js Alpine base image
USER node

# Launch app with PM2
CMD [ "pm2-runtime", "start", "npm", "--", "start" ]