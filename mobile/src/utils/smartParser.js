// ─── Smart Natural Language Parser ─────────────────────────────────────────
// Mendeteksi tanggal, waktu, prioritas, kategori, dan perulangan
// dari teks input judul tugas secara otomatis.

// ─── Daftar Keyword Terpusat ───────────────────────────────────────────────
export const SMART_KEYWORDS = {
  date: ['besok', 'tomorrow', 'lusa', 'hari', 'ini', 'today', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu', 'seminggu', 'sebulan', 'setahun', 'bulan', 'tahun', 'depan', 'akhir'],
  time: ['jam', 'at', 'nanti', 'sore', 'malam', 'pagi'],
  priority: ['urgent', 'penting', 'segera', 'asap'],
  recurrence: ['setiap', 'tiap', 'every'],
};

// Untuk mengecek apakah sebuah kata adalah keyword (dipakai oleh UI highlighting)
export function classifyWord(word) {
  const clean = word.toLowerCase().replace(/[!,:]/g, '');
  if (SMART_KEYWORDS.priority.includes(clean) || SMART_KEYWORDS.recurrence.includes(clean)) return 'priority';
  if (SMART_KEYWORDS.time.includes(clean) || /^\d+$/.test(clean)) return 'time';
  if (SMART_KEYWORDS.date.includes(clean)) return 'date';
  // Kata "lagi" merupakan bagian dari "X hari lagi"
  if (clean === 'lagi') return 'date';
  return null;
}

// ─── Fungsi Parser Utama ───────────────────────────────────────────────────
export function parseNaturalLanguage(text, categories = []) {
  if (!text || !text.trim()) return null;

  const lowerText = text.toLowerCase();
  const now = new Date();
  let detectedDate = null;
  let detectedTime = null;
  let detectedPriority = null;
  let detectedCategory = null;
  let detectedRecurrence = null;
  const wordsToRemove = [];

  // --- 1. Deteksi Prioritas ---
  SMART_KEYWORDS.priority.forEach(w => {
    if (lowerText.includes(w)) {
      detectedPriority = 'TINGGI';
      wordsToRemove.push(w);
    }
  });

  // --- 2. Deteksi Perulangan (Recurring) ---
  const hasRecurrence = SMART_KEYWORDS.recurrence.some(w => lowerText.includes(w));
  if (hasRecurrence) {
    const daysIndo = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
    const hasDay = daysIndo.some(d => lowerText.includes(d));
    detectedRecurrence = hasDay ? 'MINGGUAN' : 'HARIAN';

    const recWords = [...SMART_KEYWORDS.recurrence, 'mingguan', 'harian', 'bulanan'];
    recWords.forEach(w => { if (lowerText.includes(w)) wordsToRemove.push(w); });
  }

  // --- 3. Deteksi Kategori (Intent) ---
  const catMap = {
    'belanja': ['beli', 'belanja', 'buy', 'shop'],
    'belajar': ['belajar', 'baca', 'study', 'read', 'kursus'],
    'kerja':   ['rapat', 'meeting', 'kerja', 'work', 'proyek', 'deadline'],
    'kesehatan': ['olahraga', 'gym', 'lari', 'dokter', 'obat', 'sehat'],
  };

  Object.keys(catMap).forEach(catName => {
    catMap[catName].forEach(keyword => {
      if (lowerText.includes(keyword)) {
        const foundCat = categories.find(c => c.name.toLowerCase().includes(catName));
        if (foundCat) detectedCategory = String(foundCat.id);
      }
    });
  });

  // --- 4. Deteksi Tanggal ---
  const daysLaterMatch = lowerText.match(/(\d+)\s*hari\s*(?:lagi)?/);
  if (daysLaterMatch) {
    const d = new Date();
    d.setDate(now.getDate() + parseInt(daysLaterMatch[1]));
    detectedDate = d;
    wordsToRemove.push(daysLaterMatch[0]);
  }

  // "X minggu (lagi)" / "seminggu"
  if (!detectedDate) {
    const weeksMatch = lowerText.match(/(\d+)\s*minggu\s*(?:lagi)?/);
    if (weeksMatch) {
      const d = new Date(); d.setDate(now.getDate() + parseInt(weeksMatch[1]) * 7);
      detectedDate = d;
      wordsToRemove.push(weeksMatch[0]);
    } else if (lowerText.includes('seminggu')) {
      const d = new Date(); d.setDate(now.getDate() + 7);
      detectedDate = d;
      wordsToRemove.push('seminggu');
    }
  }

  // "X bulan (lagi)" / "sebulan"
  if (!detectedDate) {
    const monthsMatch = lowerText.match(/(\d+)\s*bulan\s*(?:lagi)?/);
    if (monthsMatch) {
      const d = new Date(); d.setMonth(now.getMonth() + parseInt(monthsMatch[1]));
      detectedDate = d;
      wordsToRemove.push(monthsMatch[0]);
    } else if (lowerText.includes('sebulan')) {
      const d = new Date(); d.setMonth(now.getMonth() + 1);
      detectedDate = d;
      wordsToRemove.push('sebulan');
    }
  }

  // "X tahun (lagi)" / "setahun"
  if (!detectedDate) {
    const yearsMatch = lowerText.match(/(\d+)\s*tahun\s*(?:lagi)?/);
    if (yearsMatch) {
      const d = new Date(); d.setFullYear(now.getFullYear() + parseInt(yearsMatch[1]));
      detectedDate = d;
      wordsToRemove.push(yearsMatch[0]);
    } else if (lowerText.includes('setahun')) {
      const d = new Date(); d.setFullYear(now.getFullYear() + 1);
      detectedDate = d;
      wordsToRemove.push('setahun');
    }
  }

  // "Minggu depan", "Akhir bulan"
  if (lowerText.includes('minggu depan')) {
    const d = new Date(); d.setDate(now.getDate() + 7); detectedDate = d;
    wordsToRemove.push('minggu depan');
  } else if (lowerText.includes('akhir bulan')) {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Hari terakhir bulan ini
    detectedDate = d;
    wordsToRemove.push('akhir bulan');
  }

  // Hari ini, Besok, Lusa
  if (!detectedDate) {
    if (lowerText.includes('besok') || lowerText.includes('tomorrow')) {
      const d = new Date(); d.setDate(now.getDate() + 1); detectedDate = d;
      wordsToRemove.push('besok', 'tomorrow');
    } else if (lowerText.includes('lusa')) {
      const d = new Date(); d.setDate(now.getDate() + 2); detectedDate = d;
      wordsToRemove.push('lusa');
    } else if (lowerText.includes('hari ini') || lowerText.includes('today')) {
      detectedDate = now;
      wordsToRemove.push('hari ini', 'today');
    }
  }

  // Deteksi Nama Hari (Senin, Selasa, dst.)
  if (!detectedDate) {
    const daysIndo = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    daysIndo.forEach((day, idx) => {
      if (lowerText.includes(day) && !detectedDate) {
        const targetDay = new Date();
        let diff = idx - now.getDay();
        if (diff <= 0) diff += 7;
        targetDay.setDate(now.getDate() + diff);
        detectedDate = targetDay;
        wordsToRemove.push(day);
      }
    });
  }

  // --- 5. Deteksi Waktu ---
  // "Nanti sore", "Nanti malam", "Pagi ini"
  if (lowerText.includes('nanti sore')) { detectedTime = '16:00'; wordsToRemove.push('nanti sore'); }
  else if (lowerText.includes('nanti malam')) { detectedTime = '20:00'; wordsToRemove.push('nanti malam'); }
  else if (lowerText.includes('pagi ini')) { detectedTime = '08:00'; wordsToRemove.push('pagi ini'); }

  // Jam spesifik — WAJIB ada prefix "jam"/"at" ATAU format HH:MM
  if (!detectedTime) {
    const timeRegex = /(?:jam\s+|at\s+)(\d{1,2})(?::(\d{2}))?\s*(am|pm|siang|sore|malam|pagi)?|(\d{1,2}):(\d{2})\s*(am|pm|siang|sore|malam|pagi)?/i;
    const tMatch = lowerText.match(timeRegex);
    if (tMatch) {
      let h, m;
      if (tMatch[1]) {
        h = parseInt(tMatch[1]);
        m = tMatch[2] ? parseInt(tMatch[2]) : 0;
        const period = tMatch[3]?.toLowerCase();
        if (['pm', 'siang', 'sore', 'malam'].includes(period) && h < 12) h += 12;
        else if (['am', 'pagi'].includes(period) && h === 12) h = 0;
      } else if (tMatch[4]) {
        h = parseInt(tMatch[4]);
        m = parseInt(tMatch[5]);
        const period = tMatch[6]?.toLowerCase();
        if (['pm', 'siang', 'sore', 'malam'].includes(period) && h < 12) h += 12;
        else if (['am', 'pagi'].includes(period) && h === 12) h = 0;
      }

      if (h !== undefined && h >= 0 && h < 24) {
        detectedTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        wordsToRemove.push(tMatch[0].trim());
      }
    }
  }

  // --- Hasil ---
  const hasDetection = detectedDate || detectedTime || detectedPriority || detectedCategory || detectedRecurrence;
  if (!hasDetection) return null;

  // Bangun summary untuk UI bubble — tampilkan info spesifik
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const summary = [];
  if (detectedDate) summary.push(`${detectedDate.getDate()} ${BULAN[detectedDate.getMonth()]}`);
  if (detectedTime) summary.push(detectedTime);
  if (detectedPriority) summary.push('⚡ Urgent');

  // Format tanggal
  const deadlineStr = detectedDate
    ? `${detectedDate.getFullYear()}-${String(detectedDate.getMonth() + 1).padStart(2, '0')}-${String(detectedDate.getDate()).padStart(2, '0')}`
    : null;

  return {
    deadline: deadlineStr,
    time: detectedTime,
    priority: detectedPriority,
    categoryId: detectedCategory,
    isRecurring: detectedRecurrence ? true : null,
    recurrence: detectedRecurrence,
    summary: summary.join(', '),
    wordsToRemove: [...new Set(wordsToRemove)],
  };
}

// ─── Fungsi Pembersihan Judul ──────────────────────────────────────────────
export function cleanTitle(title, wordsToRemove) {
  let cleaned = title;
  // Urutkan terpanjang dulu agar tidak salah potong (misal "hari ini" sebelum "hari")
  const sorted = [...wordsToRemove].sort((a, b) => b.length - a.length);
  sorted.forEach(phrase => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(escaped, 'gi'), '');
  });
  return cleaned.replace(/\s+/g, ' ').trim();
}
