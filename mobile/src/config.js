// Configuration for Mobile App
// Edit this file to change server addresses

// Ganti dengan IP lokal komputer Anda (cek pakai ipconfig) jika test di HP asli
// Atau gunakan alamat dari Railway/Render/ngrok nanti
const SERVER_IP = '10.0.2.2'; // Alamat default Android Emulator
const PORT = '5000';

export const BASE_URL = `http://${SERVER_IP}:${PORT}/api`;
export const AVATAR_URL = `http://${SERVER_IP}:${PORT}/uploads/avatars/`;
