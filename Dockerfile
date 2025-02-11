# Use Node.js for building
FROM node:18-slim AS builder

# Set working directory
WORKDIR /app

# Copy only package.json (omit package-lock.json)
COPY package.json ./

# Install dependencies (this will generate a node_modules based on package.json)
RUN npm install --verbose

# Copy the rest of the source code
COPY . .

# Build the application
RUN npm run build

# Use a lightweight image for serving
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy build artifacts and package files from the builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Install only production dependencies (without using npm ci, since there's no lock file)
RUN npm install --production

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
