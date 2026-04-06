export function getFaviconUrl(url: string): string | null {
    if (!url) return null;

    try {
        const hostname = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
    } catch {
        return null;
    }
}

export function handleFaviconError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';

    const fallback = img.nextElementSibling as HTMLElement | null;
    if (fallback) fallback.style.display = 'flex';
}