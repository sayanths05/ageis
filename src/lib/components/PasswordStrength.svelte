<script lang="ts" module>
	export interface StrengthInfo {
		level: number;
		label: string;
		borderColor: string;
		textColor: string;
	}

	export function getPasswordStrength(password: string): StrengthInfo {
		if (!password) return { level: 0, label: '', borderColor: '', textColor: '' };

		const hasUpper = /[A-Z]/.test(password);
		const hasLower = /[a-z]/.test(password);
		const hasNumber = /[0-9]/.test(password);
		const hasSymbol = /[^A-Za-z0-9]/.test(password);

		let level = 1;

		if (password.length >= 16 && hasUpper && hasLower && hasNumber && hasSymbol) {
			level = 4;
		} else if (password.length >= 12 && hasUpper && hasLower && hasNumber) {
			level = 3;
		} else if (password.length >= 8) {
			level = 2;
		}

		const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
		const borderColors = ['', 'border-red-500/60', 'border-amber-500/60', 'border-blue-500/60', 'border-emerald-500/60'];
		const textColors = ['', 'text-red-500', 'text-amber-500', 'text-blue-500', 'text-emerald-500'];

		return {
			level,
			label: labels[level],
			borderColor: borderColors[level],
			textColor: textColors[level]
		};
	}
</script>
