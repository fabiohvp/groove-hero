<script lang="ts">
	import favicon from '$lib/assets/favicon.png';
	import { page } from '$app/stores';
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Groove Hero - Learn & Play</title>
	<link rel="icon" href={favicon} />
	
	<!-- Primary Meta Tags -->
	<meta name="title" content="Groove Hero - Learn & Play" />
	<meta name="description" content="Game powered music learning. Play interactively with your MIDI files and master your skills on piano and guitar!" />
	<meta name="keywords" content="music learning, rhythm game, piano game, guitar game, midi player, groove hero, svelte" />
	<meta name="theme-color" content="#080c14" />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={$page.url.href} />
	<meta property="og:title" content="Groove Hero - Learn & Play" />
	<meta property="og:description" content="Game powered music learning. Play interactively with your MIDI files and master your skills on piano and guitar!" />
	<meta property="og:image" content={`${$page.url.origin}${favicon}`} />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary" />
	<meta property="twitter:url" content={$page.url.href} />
	<meta property="twitter:title" content="Groove Hero - Learn & Play" />
	<meta property="twitter:description" content="Game powered music learning. Play interactively with your MIDI files and master your skills on piano and guitar!" />
	<meta property="twitter:image" content={`${$page.url.origin}${favicon}`} />
</svelte:head>
{@render children()}
