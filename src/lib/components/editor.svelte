<script lang="ts">
	import type { EditorEvents } from '$lib/types';
	import { codeStore } from '$lib/util/state';
	import { themeStore } from '$lib/util/theme';
	import type monaco from 'monaco-editor';
	import { createEventDispatcher, onMount } from 'svelte';
	import initEditor from 'monaco-mermaid';
	import { persist, localStorage } from '@macfja/svelte-persistent-store';

	let divEl: HTMLDivElement = null;
	let editor: monaco.editor.IStandaloneCodeEditor;
	let Monaco;

	export let text: string;
	export let language: string;
	//TODO suggestOptions - remove
	/*export let suggestOptions: monaco.editor.ISuggestOptions = {
		insertMode: 'insert'
	};*/

	export let editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
		value: text,
		language: language,
		minimap: {
			enabled: false
		},
		theme: 'mermaid',
		overviewRulerLanes: 0
		//suggest: suggestOptions //TODO suggestOptions - remove
	};
	export let errorMarkers: monaco.editor.IMarkerData[] = [];
	let oldText = text;
	$: editor && Monaco?.editor.setModelLanguage(editor.getModel(), language);
	$: {
		if (text !== oldText) {
			if ($codeStore.updateEditor) {
				editor?.setValue(text);
			}
			oldText = text;
		}
		editor && Monaco?.editor.setModelMarkers(editor.getModel(), 'test', errorMarkers);
	}

	themeStore.subscribe(({ isDark }) => {
		editor && Monaco?.editor.setTheme(isDark ? 'mermaid-dark' : 'mermaid');
	});

	const dispatch = createEventDispatcher<EditorEvents>();
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
	onMount(async () => {
		try {
			// @ts-ignore : This is a hack to handle a svelte-kit error when importing monaco.
			Monaco = monaco;
		} catch {
			await loadMonaco(); // Fix https://github.com/mermaid-js/mermaid-live-editor/issues/175
		}
		initEditor(Monaco);

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

		//TODO suggest working code
		/*Monaco.languages.registerCompletionItemProvider('mermaid', {
			provideCompletionItems: function (model, position) {
				var word = model.getWordUntilPosition(position);
				var range = {
					startLineNumber: position.lineNumber,
					endLineNumber: position.lineNumber,
					startColumn: word.startColumn,
					endColumn: word.endColumn
				};
				
				return {
					suggestions: [{
						label: 'Account',
						//kind: Monaco.languages.CompletionItemKind.Snippet,
						insertText: 'Account',//['opt ${1:Describing text11}', '\t$0', 'end1'].join('\n'),
						//insertTextRules: Monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						//documentation: '',
					},
					{
							label: 'Connect Solid ->',
							//kind: Monaco.languages.CompletionItemKind.Snippet,
							insertText: '-->>+',//['opt ${1:Describing text11}', '\t$0', 'end1'].join('\n'),
							//insertTextRules: Monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
							//documentation: '',
					},
					,
					{
							label: 'Connect Dotted->',
							//kind: Monaco.languages.CompletionItemKind.Snippet,
							insertText: '-->>-',//['opt ${1:Describing text11}', '\t$0', 'end1'].join('\n'),
							//insertTextRules: Monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
							//documentation: '',
					}]
				};
			}
    	});	*/

		editor = Monaco.editor.create(divEl, editorOptions);
		editor.onDidChangeModelContent(() => {
			text = editor.getValue();
			dispatch('update', {
				text
			});
		});
		Monaco?.editor.setTheme($themeStore.isDark ? 'mermaid-dark' : 'mermaid');
		const resizeObserver = new ResizeObserver((entries) => {
			editor.layout({
				height: entries[0].contentRect.height,
				width: entries[0].contentRect.width
			});
		});

		resizeObserver.observe(divEl.parentElement);
		return () => {
			editor.dispose();
		};
	});

	/*function createProposals() {
		return [
			{ label: 'Server' },
			{ label: 'Request' },
			{ label: 'Response' },
			{ label: 'Session' }
		];
	}*/


/*const editor1 = monaco.editor.create(document.getElementById('container'), {
	value: 'customt\n ',
	language: 'javascript'
});


setTimeout(() => {
  editor.setPosition({column: 8, lineNumber: 1})
editor1.trigger('', 'editor.action.triggerSuggest', {})
}, [1000]);*/
</script>

<div bind:this={divEl} id="editor" class="overflow-hidden" />
