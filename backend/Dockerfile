FROM node:20-alpine

# Set working directory
WORKDIR /app

# Salin package.json dan package-lock.json ke container
COPY package*.json ./

# Install seluruh dependensi (termasuk devDependencies untuk Prisma CLI)
RUN npm install

# Salin folder prisma untuk melakukan generate client
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Salin seluruh file kode program backend
COPY . .

# Ekspos port default aplikasi
EXPOSE 5000

# Jalankan server
CMD ["npm", "start"]
