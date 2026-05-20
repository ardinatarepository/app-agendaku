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

# Ekspos port default aplikasi
EXPOSE 5000

# Jalankan server
CMD ["npm", "start"]

