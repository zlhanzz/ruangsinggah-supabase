/**
 * Utility untuk manajemen waktu di aplikasi RuangSinggah.
 * Memungkinkan simulasi waktu (Time Travel) untuk keperluan testing.
 */

export const getCurrentDate = (): Date => {
    // Cek apakah ada waktu simulasi di localStorage
    const mockTime = typeof window !== 'undefined' ? localStorage.getItem('RS_MOCK_TIME') : null;
    if (mockTime) {
        return new Date(mockTime);
    }
    return new Date();
};

export const setMockDate = (dateStr: string | null) => {
    if (typeof window === 'undefined') return;
    
    if (dateStr) {
        localStorage.setItem('RS_MOCK_TIME', dateStr);
    } else {
        localStorage.removeItem('RS_MOCK_TIME');
    }

    // Notify other tabs via BroadcastChannel (modern, instant)
    let channel: any = null;
    try {
        channel = new BroadcastChannel('RS_TIME_SYNC');
        channel.postMessage({ type: 'TIME_CHANGED', date: dateStr });
    } catch (e) {
        // Fallback for older browsers (storage event will still handle it)
        console.warn('BroadcastChannel not supported, relying on storage event');
    }

    // Reload halaman untuk memastikan seluruh state aplikasi sinkron dengan waktu baru
    // Beri sedikit delay agar BroadcastChannel punya waktu untuk mengirim pesan sebelum tab direload
    setTimeout(() => {
        if (channel) channel.close();
        window.location.reload();
    }, 50);
};

export const getMockDateStr = (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('RS_MOCK_TIME') || '';
};

/**
 * Mem-parsing string tanggal secara aman, mendukung format ISO dan format bahasa Indonesia.
 */
export const parseDateSafely = (dateStr: any): Date | null => {
    if (!dateStr || dateStr === '-') return null;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;

    // Fallback untuk format Indonesia "23 Apr 2026" atau "23 April 2026"
    try {
        const months: { [key: string]: number } = {
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mei': 4, 'jun': 5,
            'jul': 6, 'agu': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'des': 11,
            'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'juni': 5,
            'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
        };
        const parts = String(dateStr).toLowerCase().split(' ');
        if (parts.length >= 3) {
            const day = parseInt(parts[0]);
            const month = months[parts[1]];
            const year = parseInt(parts[2]);
            if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                return new Date(year, month, day);
            }
        }
    } catch (e) {}
    return null;
};

/**
 * Menghitung selisih hari antara tanggal target dengan waktu saat ini.
 * Menggunakan normalisasi ke awal hari (00:00:00) untuk perhitungan hari kalender yang akurat.
 */
export const calculateDaysRemaining = (endDateStr: string | null | undefined): number => {
    if (!endDateStr || endDateStr === '-') return 999;
    const end = parseDateSafely(endDateStr);
    if (!end) return 999;
    
    const today = getCurrentDate();
    // Normalisasi ke midnight agar perbedaan jam tidak mempengaruhi hitungan hari
    const tNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const eNorm = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    const diff = eNorm.getTime() - tNorm.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
