# Official Node.js LTS image as base for building the API
FROM node:16.20.2-alpine3.18

# Create and set user and working directory in the container
RUN addgroup app && adduser -S -G app app
USER app
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build TypeScript code to JavaScript
RUN npm run build

# Expose port on which the server will run
EXPOSE 4001

# Command to run the application
CMD ["npm", "start"]