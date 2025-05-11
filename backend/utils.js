import Time from './time.js';

export function toUnixTimestamp(dateString) {
    // Dividere la stringa in giorno, mese, anno, ore e minuti
    const [day, month, year, hours, minutes] = dateString.match(/\d+/g).map(Number);

    // Riorganizzare la data nel formato ISO accettato da dayjs: "YYYY-MM-DDTHH:mm"
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Convertire in timestamp UNIX
    return dayjs(formattedDate).unix();
}

export function isSafeReturnUrl(url) {
    try {
        // Disallow full URLs
        const parsed = new URL(url, 'http://localhost'); // base to parse relative URLs
        return parsed.origin === 'http://localhost' && parsed.pathname.startsWith('/');
    } catch {
        return false;
    }
};