FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

# Copy source code.
# .env TIDAK ikut ter-copy karena sudah didaftarkan di backend/.dockerignore,
# sehingga kredensial tidak pernah tertanam di dalam image.
# Konfigurasi dikirim saat runtime lewat `env_file` di docker-compose.yml.
COPY . .

EXPOSE 5001

CMD ["node", "server.js"]