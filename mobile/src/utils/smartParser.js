// ─── Smart Natural Language Parser ─────────────────────────────────────────
// Mendeteksi tanggal, waktu, prioritas, kategori, dan perulangan
// dari teks input judul tugas secara otomatis.

function hasWord(text, keyword) {
  if (!text || !keyword) return false;
  const escaped = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(?:^|\\s|[.,\\/#!$%\\^&\\*;:{}=\\-_'~()?])` + escaped + `(?:$|\\s|[.,\\/#!$%\\^&\\*;:{}=\\-_'~()?])`, 'i');
  return regex.test(text);
}

// ─── Daftar Keyword Terpusat ───────────────────────────────────────────────
export const SMART_KEYWORDS = {
  date: ['besok', 'tomorrow', 'lusa', 'hari', 'ini', 'today', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu', 'seminggu', 'sebulan', 'setahun', 'bulan', 'tahun', 'depan', 'akhir'],
  time: ['jam', 'at', 'nanti', 'sore', 'malam', 'pagi'],
  priority_high: [
    'urgent', 'penting', 'segera', 'asap', 'tinggi', 'high', 'darurat', 'mendesak', 
    'critical', 'crucial', 'vital', 'utama', 'cepat', 'lekas', 'wajib', 'serius', 
    'gawat', 'harus', 'bahaya', 'prioritas', 'priority', 'top', 'must', 'force', 
    'instan', 'instant', 'now', 'sekarang', 'kilat', 'ekstra', 'extra', 'mepet', 
    'kepepet', 'genting', 'kritis', 'primer', 'primary', 'pokok'
  ],
  priority_normal: [
    'normal', 'sedang', 'biasa', 'medium', 'standard', 'standar', 'average', 
    'rutin', 'menengah', 'moderate', 'default', 'reguler', 'biasa-biasa', 
    'secukupnya', 'sekadarnya', 'intermediat', 'intermediate', 'standart', 'regular'
  ],
  priority_low: [
    'santai', 'rendah', 'low', 'fleksibel', 'senggang', 'optional', 'opsional', 
    'chill', 'casual', 'tunda', 'bebas', 'ringan', 'seadanya', 'secondary', 
    'sekunder', 'mending', 'slow', 'kelak', 'kapan-kapan', 'nanti-nanti', 
    'sampingan', 'remeh', 'enteng', 'low-priority', 'unimportant'
  ],
  recurrence: [
    'setiap', 'tiap', 'every', 'harian', 'mingguan', 'bulanan', 'tahunan', 
    'daily', 'weekly', 'monthly', 'yearly', 'rutin', 'selalu', 'berulang', 
    'per', 'tiap-tiap', 'regularly', 'always', 'periodik', 'periodic', 
    'sirkular', 'berkala', 'berkelanjutan', 'kontinu', 'terus-menerus', 'terus', 
    'sering', 'seringkali'
  ],
  status: [
    'selesai', 'beres', 'done', 'kelar', 'complete', 'sukses', 'finish', 
    'achieved', 'terpenuhi', 'berjalan', 'proses', 'doing', 'sedang', 'progress', 
    'ongoing', 'aktif', 'active', 'lewat', 'terlewat', 'overdue', 'telat', 
    'ketinggalan', 'late', 'delay', 'tertunda', 'diarsipkan', 'archive', 
    'batal', 'cancel', 'canceled', 'ditolak', 'failed', 'gagal', 'terlewatkan', 
    'lampau', 'past'
  ],
  reminder: [
    'ingat', 'ingatkan', 'remind', 'sebelum', 'pengingat', 'alarm', 'notifikasi', 
    'pemberitahuan', 'warning', 'alert', 'ingat-ingat', 'notif', 'pesan', 
    'lonceng', 'bell', 'bunyi', 'reminder', 'ingatin', 'ingatlah'
  ],
};

// Helper untuk menghapus imbuhan awalan (prefix) dan akhiran (suffix) Bahasa Indonesia
export function getIndonesianRootWord(word) {
  let clean = word.toLowerCase().trim();
  
  // Bersihkan tanda baca di sekeliling kata
  clean = clean.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '');

  // Hapus partikel penegas/imbuhan akhir umum (suffix)
  // -lah, -kah, -pun, -nya, -kan, -an, -i
  if (clean.endsWith('lah') && clean.length > 5) clean = clean.slice(0, -3);
  else if (clean.endsWith('kah') && clean.length > 5) clean = clean.slice(0, -3);
  else if (clean.endsWith('pun') && clean.length > 5) clean = clean.slice(0, -3);
  else if (clean.endsWith('nya') && clean.length > 5) clean = clean.slice(0, -3);
  else if (clean.endsWith('kan') && clean.length > 5) clean = clean.slice(0, -3);
  else if (clean.endsWith('an') && clean.length > 4) clean = clean.slice(0, -2);
  else if (clean.endsWith('i') && clean.length > 4) clean = clean.slice(0, -1);

  // Hapus imbuhan awal umum (prefix)
  // me-, men-, mem-, meny-, meng-, di-, ter-, ber-, se-, pe-
  if (clean.startsWith('meng') && clean.length > 6) {
    clean = clean.slice(4);
  } else if (clean.startsWith('meny') && clean.length > 5) {
    clean = 's' + clean.slice(4); // menyapu -> sapu
  } else if (clean.startsWith('men') && clean.length > 5) {
    clean = clean.slice(3);
  } else if (clean.startsWith('mem') && clean.length > 5) {
    clean = clean.slice(3);
  } else if (clean.startsWith('me') && clean.length > 4) {
    clean = clean.slice(2);
  } else if (clean.startsWith('di') && clean.length > 4) {
    clean = clean.slice(2);
  } else if (clean.startsWith('ter') && clean.length > 5) {
    clean = clean.slice(3);
  } else if (clean.startsWith('ber') && clean.length > 5) {
    clean = clean.slice(3);
  } else if (clean.startsWith('pe') && clean.length > 4) {
    clean = clean.slice(2);
  } else if (clean.startsWith('se') && clean.length > 4) {
    clean = clean.slice(2);
  }

  return clean;
}

// Untuk mengecek apakah sebuah kata adalah keyword (dipakai oleh UI highlighting)
export function classifyWord(word) {
  const clean = word.toLowerCase().replace(/[!,:]/g, '');
  const root = getIndonesianRootWord(clean);
  
  if (SMART_KEYWORDS.priority_high.includes(clean) || SMART_KEYWORDS.priority_high.includes(root)) return 'priority_high';
  if (SMART_KEYWORDS.priority_normal.includes(clean) || SMART_KEYWORDS.priority_normal.includes(root)) return 'priority_normal';
  if (SMART_KEYWORDS.priority_low.includes(clean) || SMART_KEYWORDS.priority_low.includes(root)) return 'priority_low';
  if (SMART_KEYWORDS.recurrence.includes(clean) || SMART_KEYWORDS.recurrence.includes(root)) return 'recurrence';
  if (SMART_KEYWORDS.status.includes(clean) || SMART_KEYWORDS.status.includes(root)) return 'status';
  if (SMART_KEYWORDS.reminder.includes(clean) || SMART_KEYWORDS.reminder.includes(root)) return 'reminder';
  if (SMART_KEYWORDS.time.includes(clean) || SMART_KEYWORDS.time.includes(root) || /^\d+$/.test(clean)) return 'time';
  if (SMART_KEYWORDS.date.includes(clean) || SMART_KEYWORDS.date.includes(root)) return 'date';
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
  let detectedStatus = null;
  let detectedCategory = null;
  let detectedRecurrence = null;
  let detectedReminderHours = null;
  let detectedSubtasks = [];
  const wordsToRemove = [];

  // --- 1. Deteksi Prioritas ---
  SMART_KEYWORDS.priority_high.forEach(w => {
    if (hasWord(lowerText, w)) {
      detectedPriority = 'TINGGI';
      wordsToRemove.push(w);
    }
  });
  SMART_KEYWORDS.priority_normal.forEach(w => {
    if (hasWord(lowerText, w) && !detectedPriority) {
      detectedPriority = 'NORMAL';
      wordsToRemove.push(w);
    }
  });
  SMART_KEYWORDS.priority_low.forEach(w => {
    if (hasWord(lowerText, w) && !detectedPriority) {
      detectedPriority = 'RENDAH';
      wordsToRemove.push(w);
    }
  });

  // --- 2. Deteksi Status ---
  const statusDone = ['selesai', 'beres', 'done', 'kelar'];
  const statusDoing = ['berjalan', 'proses', 'doing', 'sedang'];
  const statusOverdue = ['lewat', 'terlewat', 'overdue', 'telat'];

  statusDone.forEach(w => {
    if (hasWord(lowerText, w)) {
      detectedStatus = 'SELESAI';
      wordsToRemove.push(w);
    }
  });
  statusDoing.forEach(w => {
    if (hasWord(lowerText, w) && !detectedStatus) {
      detectedStatus = 'SEDANG_DIKERJAKAN';
      wordsToRemove.push(w);
    }
  });
  statusOverdue.forEach(w => {
    if (hasWord(lowerText, w) && !detectedStatus) {
      detectedStatus = 'TERLEWAT';
      wordsToRemove.push(w);
    }
  });

  // --- 3. Deteksi Perulangan (Recurring) ---
  const dailyWords = ['harian', 'setiap hari', 'tiap hari', 'daily'];
  const weeklyWords = ['mingguan', 'setiap minggu', 'tiap minggu', 'weekly'];
  const monthlyWords = ['bulanan', 'setiap bulan', 'tiap bulan', 'monthly'];

  let isRecurring = false;
  dailyWords.forEach(w => {
    if (hasWord(lowerText, w)) {
      isRecurring = true;
      detectedRecurrence = 'HARIAN';
      wordsToRemove.push(w);
    }
  });
  weeklyWords.forEach(w => {
    if (hasWord(lowerText, w) && !detectedRecurrence) {
      isRecurring = true;
      detectedRecurrence = 'MINGGUAN';
      wordsToRemove.push(w);
    }
  });
  monthlyWords.forEach(w => {
    if (hasWord(lowerText, w) && !detectedRecurrence) {
      isRecurring = true;
      detectedRecurrence = 'BULANAN';
      wordsToRemove.push(w);
    }
  });

  // Backward compatibility check for general 'setiap' / 'tiap' / 'every'
  if (!detectedRecurrence && SMART_KEYWORDS.recurrence.some(w => hasWord(lowerText, w))) {
    const daysIndo = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
    const hasDay = daysIndo.some(d => hasWord(lowerText, d));
    detectedRecurrence = hasDay ? 'MINGGUAN' : 'HARIAN';
    isRecurring = true;

    const recWords = [...SMART_KEYWORDS.recurrence, 'every'];
    recWords.forEach(w => { if (hasWord(lowerText, w)) wordsToRemove.push(w); });
  }

  // --- 4. Deteksi Pengingat (Reminder Hours) ---
  const reminderRegex = /(?:ingat(?:kan)?|remind)\s+(\d+)\s*(?:jam|hour|hours)|(\d+)\s*(?:jam|hour|hours)\s*(?:sebelum|before)/i;
  const remMatch = lowerText.match(reminderRegex);
  if (remMatch) {
    const hrs = parseInt(remMatch[1] || remMatch[2]);
    if (!isNaN(hrs)) {
      detectedReminderHours = String(hrs);
      wordsToRemove.push(remMatch[0]);
    }
  }

  // --- 5. Deteksi Sub-tugas ---
  const subtaskRegex = /(?:subtugas|sub-tugas|dengan sub|dengan subtugas|termasuk sub)\s*(?::)?\s*([^.]+)/i;
  const subMatch = lowerText.match(subtaskRegex);
  if (subMatch) {
    const rawItems = subMatch[1];
    const items = rawItems.split(/,|\bdan\b|&/i).map(item => item.trim()).filter(Boolean);
    if (items.length > 0) {
      detectedSubtasks = items.map(title => ({ title, isDone: false }));
      wordsToRemove.push(subMatch[0]);
    }
  }

  // --- 6. Deteksi Kategori ---
  // Direct category name check (dynamic custom categories)
  categories.forEach(cat => {
    const nameLower = cat.name.toLowerCase();
    if (lowerText.includes(nameLower)) {
      detectedCategory = String(cat.id);
      wordsToRemove.push(nameLower);
    }
  });

  if (!detectedCategory) {
    const catMap = {
      'belanja': ['beli', 'belanja', 'buy', 'shop', 'groceries', 'supermarket', 'pasar', 'mal', 'susu', 'roti', 'kopi', 'sayur', 'buah', 'daging'],
      'belajar': ['belajar', 'baca', 'study', 'read', 'kursus', 'pr', 'tugas kuliah', 'kuliah', 'sekolah', 'buku', 'sertifikat', 'ujian', 'uts', 'uas'],
      'kerja':   ['rapat', 'meeting', 'kerja', 'work', 'proyek', 'deadline', 'kantor', 'klien', 'client', 'briefing', 'gaji', 'laporan', 'tugas', 'brief', 'email'],
      'kesehatan': ['olahraga', 'gym', 'lari', 'dokter', 'obat', 'sehat', 'sakit', 'klinik', 'periksa', 'jogging', 'sepeda', 'senam', 'fitness', 'medis'],
      'pribadi': ['pribadi', 'personal', 'santai', 'keluarga', 'family', 'rumah', 'home', 'liburan', 'jalan-jalan', 'nonton', 'game'],
      'keuangan': ['bayar', 'tagihan', 'gaji', 'transfer', 'uang', 'finance', 'duit', 'tabung', 'investasi', 'rekening', 'atm', 'kasir'],
    };

    Object.keys(catMap).forEach(catName => {
      catMap[catName].forEach(keyword => {
        if (lowerText.includes(keyword) && !detectedCategory) {
          const foundCat = categories.find(c => c.name.toLowerCase().includes(catName));
          if (foundCat) {
            detectedCategory = String(foundCat.id);
            wordsToRemove.push(keyword);
          }
        }
      });
    });
  }

  // --- 7. Deteksi Tanggal ---
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
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
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

  // --- 8. Deteksi Waktu ---
  if (lowerText.includes('nanti sore')) { detectedTime = '16:00'; wordsToRemove.push('nanti sore'); }
  else if (lowerText.includes('nanti malam')) { detectedTime = '20:00'; wordsToRemove.push('nanti malam'); }
  else if (lowerText.includes('pagi ini')) { detectedTime = '08:00'; wordsToRemove.push('pagi ini'); }

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
  const hasDetection = detectedDate || detectedTime || detectedPriority || detectedStatus || detectedCategory || detectedRecurrence || detectedReminderHours || (detectedSubtasks && detectedSubtasks.length > 0);
  if (!hasDetection) return null;

  // Bangun summary untuk UI bubble dengan Emojis Refined
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const summary = [];
  if (detectedDate) summary.push(`${detectedDate.getDate()} ${BULAN[detectedDate.getMonth()]}`);
  if (detectedTime) summary.push(`${detectedTime}`);
  
  if (detectedPriority) {
    const prioLabel = { RENDAH: 'Rendah', NORMAL: 'Normal', TINGGI: 'Tinggi' }[detectedPriority];
    summary.push(`${prioLabel}`);
  }
  
  if (detectedStatus) {
    const statusLabel = { SEDANG_DIKERJAKAN: 'Berjalan', SELESAI: 'Selesai', TERLEWAT: 'Terlewat' }[detectedStatus];
    summary.push(`${statusLabel}`);
  }
  
  if (detectedRecurrence) {
    const recLabel = { HARIAN: 'Harian', MINGGUAN: 'Mingguan', BULANAN: 'Bulanan' }[detectedRecurrence];
    summary.push(`${recLabel}`);
  }
  
  if (detectedReminderHours) {
    summary.push(`${detectedReminderHours} Jam`);
  }
  
  if (detectedCategory) {
    const catObj = categories.find(c => String(c.id) === detectedCategory);
    if (catObj) summary.push(`${catObj.name}`);
  }
  
  if (detectedSubtasks && detectedSubtasks.length > 0) {
    summary.push(`📝 ${detectedSubtasks.length} Sub-tugas`);
  }

  // Format tanggal
  const deadlineStr = detectedDate
    ? `${detectedDate.getFullYear()}-${String(detectedDate.getMonth() + 1).padStart(2, '0')}-${String(detectedDate.getDate()).padStart(2, '0')}`
    : null;

  return {
    deadline: deadlineStr,
    time: detectedTime,
    priority: detectedPriority,
    status: detectedStatus,
    categoryId: detectedCategory,
    isRecurring: isRecurring ? true : null,
    recurrence: detectedRecurrence,
    reminderHours: detectedReminderHours,
    subtasks: detectedSubtasks.length > 0 ? detectedSubtasks : null,
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
