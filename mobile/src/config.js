// Configuration for Mobile App
// Edit this file to change server addresses

// Ganti dengan IP lokal komputer Anda (cek pakai ipconfig) jika test di HP asli
// Atau gunakan alamat dari Railway/Render/ngrok nanti
// Gunakan IP lokal komputer untuk terhubung ke backend lokal (dari Expo QR Code: 192.168.1.10)
const DEV_URL = 'http://localhost:5000';
const PROD_URL = 'https://app-agendaku-production.up.railway.app';

export const BASE_URL = `${PROD_URL}/api`;
export const AVATAR_URL = `${PROD_URL}/uploads/avatars/`;

