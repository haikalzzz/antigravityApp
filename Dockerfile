# Gunakan Node.js image resmi berbasis Linux Alpine yang ringan
FROM node:20-alpine

# Set direktori kerja di dalam kontainer
WORKDIR /app

# Salin package.json dan package-lock.json (jika ada)
COPY package*.json ./

# Install dependencies untuk production
RUN npm install --omit=dev

# Salin seluruh file proyek ke dalam kontainer
COPY . .

# Ekspos port aplikasi Express
EXPOSE 3000

# Jalankan server
CMD ["node", "server.js"]
