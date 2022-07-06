<script lang="ts">
	import {
		updateCode,
		updateConfig,
		updateTokens,
		codeStore,
		serializedState
	} from '$lib/util/state';
	import { persist, localStorage } from '@macfja/svelte-persistent-store';
    import type monaco from 'monaco-editor';
    import initEditor from 'monaco-mermaid';
    
    let Monaco;
	let columns = [
		{
			label: 'Token Name',
			name: 'token_name'
		},
		{
			label: 'Token Type',
			name: 'token_type'
		}
	];

	let rows = localStorage()?.getValue('codeStore')?.tokens || [
		{
			token_name: 'Account',
			token_type: 'sObject'
		}
	];

	function addRow(e) {
		rows.push({});
		rows = rows;
		handleTokensUpdate();
	}

	function removeRow(i) {
		const part = rows.splice(i, 1);
		rows = rows;
		handleTokensUpdate();
	}

	/*function moveRow(i, direction) {
		const part = rows.splice(i, 1);
		const pos = Math.min(rows.length, Math.max(0, i + direction));
		rows.splice(pos, 0, ...part);
		rows = rows;
	}*/

	function handleTokensUpdate() {
		updateTokens(rows, false);
	}

    const loadMonaco = async () => {
		let i = 0;
		while (i++ < 10) {
			try {
				// @ts-ignore : This is a hack to handle a svelte-kit error when importing monaco.
				Monaco = monaco;
				return;
			} catch {
				await new Promise((r) => setTimeout(r, 500));
			}
		}
		alert('Loading Monaco Editor failed. Please try refreshing the page.');
	};

    function save() {
		handleTokensUpdate();
        //async () => {
		try {
			// @ts-ignore : This is a hack to handle a svelte-kit error when importing monaco.
			Monaco = monaco;
		} catch {
			 loadMonaco(); // Fix https://github.com/mermaid-js/mermaid-live-editor/issues/175
		}
		initEditor(Monaco);

        //let completionItemProvider = Monaco.editor.IDisposable;
        //completionItemProvider.dispose();
        //Monaco.editor.dispose();
        console.log('>>>>>>>>>>>>>>>>', Monaco.editor.IStandaloneCodeEditor);
        //let count = 0;
        var tokens = localStorage()?.getValue('codeStore')?.tokens;
		
		Monaco.languages.registerCompletionItemProvider('mermaid', {
			provideCompletionItems: function (model, position, context) {

                var word = model.getWordUntilPosition(position);
				let suggestions = [];
				var range = {
					startLineNumber: position.lineNumber,
					endLineNumber: position.lineNumber,
					startColumn: word.startColumn,
					endColumn: word.endColumn
				};
				
				tokens.forEach(function(item, index) { 
					suggestions.push({
						label: item.token_name,
						insertText: item.token_name,
						range: range
					});
					console.log(item);
				});

				return {
					suggestions
				};
            }
    	});        
    }
</script>

<div style="background-color:#fff;height: 100vh;">
	<div style="margin:20px;">
		<p>
			Add Tokens by Click on "Add New Token" or "Remove". The input's are populated with the text "undefined"
		</p><br/>
		<table>
			<tr>
				<th>S.No &varr;</th>
				{#each columns as column (column.name)}
					<th>{column.label} &varr;</th>
				{/each}
				<th />
			</tr>
			{#each rows as row, i (i)}
				<tr class:odd={i % 2}>
					<td width="14%">{i + 1}</td>
					{#each columns as column (column.name)}
						<td width="38%">
							<!-- {row[column.name]} -->
							<input bind:value={row[column.name]} />
						</td>
					{/each}
					<td width="10%" align="center">
						<a title="Delete Token" href on:click|preventDefault={(e) => removeRow(i)}
							><i class="fa fa-trash" aria-hidden="true" /></a>
						<!--<a href on:click|preventDefault={(e) => moveRow(i, -1)}>Up</a>
				<a href on:click|preventDefault={(e) => moveRow(i, 1)}>Down</a>-->
					</td>
				</tr>
			{/each}
		</table>
		<div style="text-align: right; margin: 20px 0;">
			<a class="btn btn-secondary btn-xs btn-token" href on:click|preventDefault={addRow}
				>Add NEW TOKEN</a>
		</div>
		<center>
			<button class="btn btn-primary btn-xs btn-token" on:click|preventDefault={save}
				>Save</button>
		</center>
		<pre style="display:none;">{JSON.stringify(rows, null, 2)}</pre>
	</div>
</div>
<!--"
<select>
	<option value={undefined}></option>
	{#each rows as row, i (i)}
		<option value={row.code}>{row.label || ""}</option>
	{/each}
</select>
-->

<!--script>
	let count = 1;
	import { flip } from 'svelte/animate';
	import Spinner from './spinner.svelte';
	import { writable, get, derived } from 'svelte/store';
	import { persist, localStorage } from '@macfja/svelte-persistent-store';

	export const codeStore = localStorage();

	let things = [];
	let colNames = [];
	let rowkeys = [];
	let sourceJson = 'users';

	async function getThings() {
		console.log(sourceJson);

		const res = await fetch(`https://jsonplaceholder.typicode.com/` + sourceJson);
		const json = await res.json();

		if (res.ok) {
			setTimeout(() => {
				things = JSON.parse(codeStore.getValue('codeStore').tokens); //json;
				//grab column names
				colNames = Object.keys(things[0]);

				return true;
			}, 0 * Math.random());
		} else {
			throw new Error(text);
		}
	}

	let promise = getThings();

	function onDelete(id) {
		things = things.filter((t) => t.id != id);
	}

	function reload(newSource) {
		sourceJson = newSource;
		promise = getThings();
	}

	let sortBy = { col: 'name', ascending: true };

	$: sort = (column) => {
		if (sortBy.col == column) {
			sortBy.ascending = !sortBy.ascending;
		} else {
			sortBy.col = column;
			sortBy.ascending = true;
		}

		// Modifier to sorting function for ascending or descending
		let sortModifier = sortBy.ascending ? 1 : -1;

		let sort = (a, b) =>
			a[column] < b[column] ? -1 * sortModifier : a[column] > b[column] ? 1 * sortModifier : 0;

		things = things.sort(sort);
	};

	console.log('-------------------', JSON.parse(codeStore.getValue('codeStore').tokens));
</script>

<h2>And we can have interactive content like this</h2>
<p>
	<input type="text" />
	The count is: {count}
</p>
<button on:click={() => (count += 1)}> Increment </button>
<button on:click={() => (count -= 1)}> Decrement </button>

<button on:click={reload(sourceJson)}>Reload</button>
<button on:click={sort('name')}>Name &varr;</button>
<button on:click={sort('email')}>email &varr;</button>

<select on:change={() => reload(document.getElementById('jsonSelector').value)} id="jsonSelector">
	<option value="users">Users</option>
	<option value="photos">Photos</option>
	<option value="comments">Comments</option>
</select>

{#await promise}
	<Spinner />
{:then getThings}
	<table>
		<thead>
			<tr>
				{#each colNames as col}
					<th on:click={sort(col)}>{col} &varr;</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each things as thing, index (thing.id)}
				<tr>
					{#each colNames as col, index}
						<td>{thing[col]}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
{:catch error}
	<p style="color: red">{error.message}</p>
{/await}

<style>
	table {
		max-width: 100%;
		border: 0;
		white-space: nowrap;
		border-collapse: collapse;
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 4px;
	}

	th {
		height: 56px;
		font-family: Roboto, sans-serif;
		-moz-osx-font-smoothing: grayscale;
		-webkit-font-smoothing: antialiased;
		font-size: 0.875rem;
		line-height: 1.375rem;
		font-weight: 500;
		letter-spacing: 0.00714em;
		text-decoration: inherit;
		text-transform: inherit;
		text-align: left;
		padding-right: 16px;
		padding-left: 16px;
	}

	tbody {
		font-family: Roboto, sans-serif;
		-moz-osx-font-smoothing: grayscale;
		-webkit-font-smoothing: antialiased;
		font-size: 0.875rem;
		line-height: 1.25rem;
		font-weight: 400;
		letter-spacing: 0.01786em;
		text-decoration: inherit;
		text-transform: inherit;
	}
	tr {
		height: 52px;
		border-top-color: rgba(0, 0, 0, 0.12);
		border-top-width: 1px;
		border-top-style: solid;
	}
	tr:hover {
		background-color: rgba(0, 0, 0, 0.04);
	}

	td {
		padding-right: 16px;
		padding-left: 16px;
	}

	button {
		border-radius: 0.25rem;
		cursor: pointer;
		font-weight: bold;
		background-color: #fff;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
		max-width: 250px;
	}
	button:active {
		background-color: #fff;
		box-shadow: 0 0px 0px 0 rgba(0, 0, 0, 0.1), 0 0px 0px 0 rgba(0, 0, 0, 0.06);
	}
</style>-->
<style>
	table {
		border-collapse: collapse;
		border-spacing: 0;
		empty-cells: show;
		width: 100%;
	}
	table th {
		background-color: #eee;
		text-align: left;
		margin: 12px;
	}
	table td:first-child {
		text-align: center;
	}
	table th,
	table td {
		padding: 2px;
		border: 1px solid #c6c5c5;
	}
	table td input {
		margin-bottom: 0;
		padding: 0px 5px;
		width: 100%;
	}
	table tr.odd {
		background-color: #eee;
	}
	.btn-token {
		padding: 12px;
		min-height: unset;
		height: unset;
		width: 130px;
	}
</style>
