# Builder stage
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Copy and install dependencies (including dev for build)
COPY package.json .
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /usr/src/app

# Copy only production dependencies
COPY package.json .
RUN npm install --omit=dev

# Copy built output
COPY --from=builder /usr/src/app/dist ./dist

# Expose application port
EXPOSE 3001

# Start the server
CMD ["node", "dist/index.js"]