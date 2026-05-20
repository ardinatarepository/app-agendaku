FROM node:20-alpine

# Set working directory
WORKDIR /app

# Salin package.json dan package-lock.json ke container
COPY package*.json ./

# Install seluruh dependensi (termasuk devDependencies untuk Prisma CLI)
RUN npm install

# Salin seluruh file kode program backend
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Buat user non-root dengan UID khusus (antara 10000 - 20000) untuk memenuhi kebijakan keamanan Choreo
RUN adduser --disabled-password --gecos "" --home "/nonexistent" --shell "/sbin/nologin" --no-create-home --uid 10014 choreo \
    && chown -R 10014:10014 /app

# Pindah ke user non-root secara numerik
USER 10014

# Ekspos port default aplikasi
EXPOSE 5000

# Jalankan server
CMD ["npm", "start"]


