# Use official Ubuntu image as the base
FROM ubuntu:22.04

# Install necessary packages including Node.js
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
  
# Set working directory
WORKDIR /circbackend/app

# Copy package files first (optimized layer caching)
COPY package.json package-lock.json ./

# Install dependencies (consider using --omit=dev for production)
RUN npm install --omit=dev

# Copy remaining project files
COPY . .

# Expose port
EXPOSE 3302

# Start the application
CMD ["npm", "run", "dev"]
