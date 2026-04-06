<script lang="ts">
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import PasswordForm from '$lib/components/PasswordForm.svelte';
</script>

<div in:fly={{ x: 30, duration: 200 }}>
	<PasswordForm entry={null} onclose={() => goto('/passwords')} />
</div>
