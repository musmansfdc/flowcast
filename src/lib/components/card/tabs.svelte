<script lang="ts">
	import type { Tab, TabEvents } from '$lib/types';
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	export let isCloseable = true;
	export let tabs: Tab[] = [];
	export let title: string;
	export let isOpen = false;
	export let isOpenDiagram = false;
	export let cardIcon = '';

	$: activeTabID = tabs[0]?.id;

	const dispatch = createEventDispatcher<TabEvents>();
	const toggleTabs = (tab: Tab) => {
		activeTabID = tab.id;
		dispatch('select', tab);
	};

	const toggleSideBar = () => {
		let toggleSide = (isOpenDiagram = !isOpenDiagram);
		document.getElementById('editorPane').style.width = toggleSide ? '0%' : '35%';
		document.getElementById('editorPane').style.transitionDuration = '0.7s';
		return toggleSide;
	};
</script>

<div class="flex cursor-default">
	<div>
		{#if cardIcon == 'bookmark'}
			<div class="btn btn-secondary btn-xs" on:click|stopPropagation={() => toggleSideBar()}>
				<i class="fas fa-chevron-left icon" class:isOpenDiagram />
			</div>
		{/if}

		<span class="mr-2 font-semibold" on:click|stopPropagation={() => (isOpen = !isOpen)}>
			{#if isCloseable}
				<i class="fas fa-chevron-right icon" class:isOpen />
			{/if}

			{title}</span>
	</div>
	{#if isOpen && tabs}
		<ul class="tabs" transition:fade>
			{#each tabs as tab}
				<div
					class="tab tab-lifted {activeTabID === tab.id ? 'tab-active' : 'text-primary-content'}"
					on:click|stopPropagation={() => toggleTabs(tab)}>
					<i class="mr-1 {tab.icon}" />
					{tab.title}
				</div>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.icon {
		transition-duration: 0.5s;
	}
	.isOpen {
		transform: rotate(90deg);
	}
	.isOpenDiagram {
		-webkit-transform: rotate(180deg);
		-moz-transform: rotate(180deg);
		-ms-transform: rotate(180deg);
		-o-transform: rotate(180deg);
		transform: rotate(180deg);
	}
</style>
