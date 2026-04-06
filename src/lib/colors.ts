const PALETTE = [
	{ bg: 'bg-blue-900/50', text: 'text-blue-300', dot: 'bg-blue-400' },
	{ bg: 'bg-cyan-900/50', text: 'text-cyan-300', dot: 'bg-cyan-400' },
	{ bg: 'bg-emerald-900/50', text: 'text-emerald-300', dot: 'bg-emerald-400' },
	{ bg: 'bg-violet-900/50', text: 'text-violet-300', dot: 'bg-violet-400' },
	{ bg: 'bg-amber-900/50', text: 'text-amber-300', dot: 'bg-amber-400' },
	{ bg: 'bg-rose-900/50', text: 'text-rose-300', dot: 'bg-rose-400' },
	{ bg: 'bg-pink-900/50', text: 'text-pink-300', dot: 'bg-pink-400' },
	{ bg: 'bg-teal-900/50', text: 'text-teal-300', dot: 'bg-teal-400' },
	{ bg: 'bg-indigo-900/50', text: 'text-indigo-300', dot: 'bg-indigo-400' },
	{ bg: 'bg-orange-900/50', text: 'text-orange-300', dot: 'bg-orange-400' }
];

function hashString(str: string): number {
	let hash = 0;

	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
	}

	return Math.abs(hash);
}

export function getColorForName(name: string) {
	return PALETTE[hashString(name) % PALETTE.length];
}

export function getInitial(name: string): string {
	return name.charAt(0).toUpperCase();
}
