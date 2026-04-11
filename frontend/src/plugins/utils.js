


export function formatDateTime(date) {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString("it-IT", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatHms(seconds) {
    const hours = Math.floor(seconds/3600);
    const minutes = Math.floor(seconds/60 - hours * 60);
    let formatted = (hours > 0 ? hours + "h " : "") + (minutes > 0 ? minutes + "m " : "");
    if (formatted == "") {
        formatted = seconds + "s ";
    }
    return formatted;
}