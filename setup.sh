#!/bin/bash
# setup.sh — Setup otomatis AgendaKu
# Jalankan dari root folder agendaku/: bash setup.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${BLUE}ℹ  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠  $1${NC}"; }

echo ""
echo "🚀 AgendaKu — Setup Otomatis"
echo "================================"
echo ""

# Cek Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js tidak ditemukan. Install dari https://nodejs.org"
  exit 1
fi
log "Node.js $(node -v) ditemukan"

# ─── Backend Setup ────────────────────────────────────────────────────────────
info "Menginstal dependencies backend..."
cd backend
npm install --silent
log "Backend dependencies terinstal"

# Buat .env jika belum ada
if [ ! -f .env ]; then
  cp .env.example .env
  warn ".env dibuat dari template. Edit DATABASE_URL & JWT_SECRET di backend/.env"
  echo ""
  echo "  Buka file: backend/.env"
  echo "  Ubah nilai ini:"
  echo "    DATABASE_URL=\"mysql://root:PASSWORD@localhost:3306/agendaku_db\""
  echo "    JWT_SECRET=\"string-acak-panjang-kamu\""
  echo ""
  read -p "  Tekan Enter setelah mengedit .env..."
fi

# Migrasi database
info "Menjalankan migrasi database..."
npx prisma generate --silent
npx prisma migrate dev --name init 2>/dev/null || npx prisma db push 2>/dev/null || warn "Migrasi gagal — pastikan MySQL berjalan dan DATABASE_URL benar"
log "Database siap"

# Seed data
info "Mengisi data awal..."
npm run db:seed 2>/dev/null || warn "Seed dilewati (data mungkin sudah ada)"

cd ..

# ─── Frontend Web Setup ───────────────────────────────────────────────────────
info "Menginstal dependencies frontend web..."
cd frontend-web
npm install --silent
log "Frontend web dependencies terinstal"
cd ..

# ─── Ringkasan ────────────────────────────────────────────────────────────────
echo ""
echo "================================"
echo "🎉 Setup selesai!"
echo "================================"
echo ""
echo "Untuk menjalankan aplikasi, buka 2 terminal:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend && npm run dev"
echo "    → API: http://localhost:5000"
echo ""
echo "  Terminal 2 (Frontend Web):"
echo "    cd frontend-web && npm run dev"
echo "    → Web: http://localhost:5173"
echo ""
echo "  Login demo: demo@agendaku.com / password123"
echo ""
echo "  Untuk mobile (Expo):"
echo "    cd mobile && npm install && npx expo start"
echo ""
