# Use Node.js for building
FROM node:18-slim AS builder

# Set working directory
WORKDIR /app

# Cache package.json and package-lock.json to avoid re-installing dependencies if unchanged
COPY package.json package-lock.json ./

# Install dependencies (all dependencies are installed here)
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
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Install only production dependencies using the lock file for consistency
RUN npm ci --production

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
