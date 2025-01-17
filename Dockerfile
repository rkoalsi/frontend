# Use Node.js for building
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the source code
COPY . .

# Build the application
RUN npm run build

# Use a lightweight image for serving
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only the build output and required files
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Install only production dependencies
RUN npm install --production

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
