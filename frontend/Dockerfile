FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json ./

# Clean npm cache dan install dependencies
RUN npm cache clean --force && \
    npm ci --no-audit --legacy-peer-deps

# Build args untuk NEXT_PUBLIC_* (di-bake saat build time)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_KEYCLOAK_ISSUER
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT_ID

# Copy source code
COPY . .

# Build aplikasi Next.js
RUN npm run build

# Set environment variable untuk port
# Next.js jalan di 3002 (lihat script "start" di package.json: next start -p 3002)
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

EXPOSE 3002

# Start aplikasi
CMD ["npm", "start"]