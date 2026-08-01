export function barScale(value: number, ceiling: number): number {
	if (ceiling <= 0) return 0.02;
	return Math.max(0.02, value / ceiling);
}

export function formatMs(ms: number): string {
	if (ms < 0.01) return "<0.01ms";
	if (ms < 1) return `${ms.toFixed(3)}ms`;
	if (ms < 100) return `${ms.toFixed(2)}ms`;
	return `${Math.round(ms)}ms`;
}

export function formatCount(value: number): string {
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	return value.toLocaleString();
}
