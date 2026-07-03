// Configuration for Mobile App
// Edit this file to change server addresses

// Opsi 1: Gunakan IP lokal komputer Anda (dari ipconfig) jika test di HP asli lewat Wi-Fi yang sama
const DEV_URL = 'http://10.0.2.2:5000';

// Opsi 2: Gunakan http://10.0.2.2:5000 jika Anda menggunakan Android Emulator
// const DEV_URL = 'http://10.0.2.2:5000';

// Opsi 3: Gunakan URL Cloudflare Tunnel/ngrok Anda jika ingin akses publik
// const DEV_URL = 'https://rural-furniture-quantitative-dakota.trycloudflare.com';

const PROD_URL = 'http://10.0.2.2:5000';

export const BASE_URL = `${DEV_URL}/api`;
export const AVATAR_URL = `${DEV_URL}/uploads/avatars/`;
