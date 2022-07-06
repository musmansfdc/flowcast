<!-- <svelte:head>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/annyang/2.6.1/annyang.min.js" ></script>
</svelte:head> -->
<script lang="ts">
	import * as jq from 'jquery';
	import Editor from '$lib/components/editor.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import Preset from '$lib/components/preset.svelte';
	import Actions from '$lib/components/actions.svelte';
	import Tokens from '$lib/components/tokens.svelte';
	import View from '$lib/components/view.svelte';
	import Card from '$lib/components/card/card.svelte';
	import History from '$lib/components/history/history.svelte';
	
	import {
		updateCode,
		updateConfig,
		updateTokens,
		codeStore,
		serializedState
	} from '$lib/util/state';
	//import { startSpeechAI, stopSpeechAI, populateCodeStore } from '$lib/util/speechAI';
	import { errorStore } from '$lib/util/error';
	import { onMount } from 'svelte';
	import mermaid from 'mermaid';
	import type monaco from 'monaco-editor';
	import { initHandler, syncDiagram } from '$lib/util/util';
	//import Artyom from 'artyom.js';
	//import speechAI from 'speechAI.js';
	import type { EditorUpdateEvent, State, Tab, DocConfig } from '$lib/types';
	import { base } from '$app/paths';

	// const x = () =>{
	// 	let speachRecord = annyang;
	// }	
	//export function SpeachRecord() { }

	let recIcon = '/rec.gif';
	serializedState; // Weird fix for error > serializedState is not defined. Treeshaking?

	type Modes = 'code' | 'config';
	type Languages = 'mermaid' | 'json';

	let selectedMode: Modes = 'code';
	const languageMap: { [key in Modes]: Languages } = {
		code: 'mermaid',
		config: 'json'
	};
	const docURLBase = 'https://mermaid-js.github.io/mermaid';
	const docMap: DocConfig = {
		graph: {
			code: '/#/flowchart',
			config: '/#/flowchart?id=configuration'
		},
		flowchart: {
			code: '/#/flowchart',
			config: '/#/flowchart?id=configuration'
		},
		sequenceDiagram: {
			code: '/#/sequenceDiagram',
			config: '/#/sequenceDiagram?id=configuration'
		},
		classDiagram: {
			code: '/#/classDiagram',
			config: '/#/classDiagram?id=configuration'
		},
		'stateDiagram-v2': {
			code: '/#/stateDiagram'
		},
		gantt: {
			code: '/#/gantt',
			config: '/#/gantt?id=configuration'
		},
		pie: {
			code: '/#/pie'
		},
		erDiagram: {
			code: '/#/entityRelationshipDiagram',
			config: '/#/entityRelationshipDiagram?id=styling'
		},
		journey: {
			code: '/#/user-journey'
		},
		gitGraph: {
			code: '/#/gitgraph',
			config: '/#/gitgraph?id=gitgraph-specific-configuration-options'
		}
	};
	let text = '';
	let docURL = docURLBase;
	let language: Languages = 'mermaid';
	let errorMarkers: monaco.editor.IMarkerData[] = [];
	$: language = languageMap[selectedMode];
	$: {
		if (selectedMode === 'code') {
			text = $codeStore.code;
		} else if (selectedMode === 'config') {
			text = $codeStore.mermaid;
		} else {
			text = $codeStore.tokens;
		}
	}

	codeStore.subscribe((state: State) => {
		if (state.updateEditor) {
			text =
				selectedMode === 'code'
					? state.code
					: selectedMode === 'config'
					? state.mermaid
					: state.tokens;
		}
		const codeTypeMatch = /([\S]+)[\s\n]/.exec(state.code);
		if (codeTypeMatch && codeTypeMatch.length > 1) {
			const docKey = codeTypeMatch[1];
			const docConfig = docMap[docKey] ?? { code: '' };
			docURL = docURLBase + (docConfig[selectedMode] ?? docConfig.code ?? '');
		}
	});
	const tabSelectHandler = (message: CustomEvent<Tab>) => {
		selectedMode =
			message.detail.id === 'code' ? 'code' : message.detail.id === 'config' ? 'config' : 'tokens';
		$codeStore.updateEditor = true;
	};
	const tabs: Tab[] = [
		{
			id: 'code',
			title: 'Code',
			icon: 'fas fa-code'
		},
		{
			id: 'config',
			title: 'Config',
			icon: 'fas fa-cogs'
		},
		{
			id: 'tokens',
			title: 'Tokens',
			icon: 'fas fa-wrench',
			component: Tokens
		}
	];

	const handleCodeUpdate = (code: string): void => {
		mermaid.parse(code);
		updateCode(code, false);
		populateCodeStore(code); 
	};

	const handleConfigUpdate = (config: string): void => {
		JSON.parse(config);
		updateConfig(config, false);
	};

	const handleTokensUpdate = (tokens: string): void => {
		JSON.parse(tokens);
		updateTokens(tokens, false);
	};

	const updateHandler = (message: CustomEvent<EditorUpdateEvent>) => {
		try {
			if (selectedMode === 'code') {
				handleCodeUpdate(message.detail.text);
			} else if (selectedMode === 'config') {
				handleConfigUpdate(message.detail.text);
			} else {
				handleTokensUpdate(message.detail.text);
			}
			errorStore.set(undefined);
			errorMarkers = [];
		} catch (e) {
			errorStore.set(e);
			if (e.hash) {
				const marker: monaco.editor.IMarkerData = {
					severity: 8, //Error
					startLineNumber: e.hash.loc.first_line,
					startColumn: e.hash.loc.first_column,
					endLineNumber: e.hash.loc.last_line,
					endColumn: (e.hash.loc.last_column as number) + 1,
					message: e.str
				};
				errorMarkers.push(marker);
				// Clear all previous errors before this error.
				errorMarkers = errorMarkers.filter(
					(m) => m.startLineNumber >= marker.startLineNumber && m.startColumn >= marker.startColumn
				);
			}
			console.error(e);
		}
	};

	const viewDiagram = () => {
		window.open(`${base}/view#${$serializedState}`, '_blank').focus();
	};

	/*const loadJS = () => {
			// DOM: Create the script element
			var jsElm = document.createElement("script");
			// set the type attribute
			jsElm.type = "application/javascript";
			// make the script element load file
			jsElm.src = 'annyang.min.js';
			// finally insert the element to the body element in order to load the script
			document.body.appendChild(jsElm);
		
			console.log('>>>',annyang);
	};
	loadJS();*/
	onMount(async () => {
		
		/*try {
			// @ts-ignore : This is a hack to handle a svelte-kit error when importing monaco.
			console.log('>>>',annyang)
		} catch {
			await loadMonaco(); // Fix https://github.com/mermaid-js/mermaid-live-editor/issues/175
		}*/

		/*script.addEventListener('load', (this) => {
			console.log('loaded', this);
    })

    script.addEventListener('error', (event) => {
      console.error("something went wrong", event);
    });*/
	

		await initHandler();
		//Annyang = annyang;
		const resizer = document.getElementById('resizeHandler');
		const element = document.getElementById('editorPane');
		const resize = (e) => {
			const newWidth = e.pageX - element.getBoundingClientRect().left;
			if (newWidth > 50) {
				element.style.width = `${newWidth}px`;
			}
		};

		const stopResize = () => {
			window.removeEventListener('mousemove', resize);
		};
		resizer.addEventListener('mousedown', (e) => {
			e.preventDefault();
			window.addEventListener('mousemove', resize);
			window.addEventListener('mouseup', stopResize);
		});
	});

	const resetBtn = () => {
		console.log('>>>', document.getElementById('editor').innerText);
		console.log('>>>', $codeStore);
		console.log('>>>', document.querySelector('.view-line').innerText);
		let code1;
		//document.querySelectorAll('.view-line')
		let items = $codeStore.code;
		items.split('\n').forEach(function (item, index) {
			console.log('>>> - ', index);
			if (index == 0) {
				code1 = item;
			}
			if (item.indexOf('#') == -1 && index > 0) {
				code1 += '\n#' + item;
			}
		});
		//$codeStore.updateDiagram = true;
		//mermaid.parse(code1);
		//updateCode(code1, true);
		updateCode(code1, true, true);
	};

	const nextBtn = () => {
		console.log('>>>', document.getElementById('editor').innerText);
		console.log('>>>', $codeStore);
		console.log('>>>', document.querySelector('.view-line').innerText);
		let code1;
		let i = 1;
		let items = $codeStore.code;
		//document.querySelectorAll('.view-line')
		items.split('\n').forEach(function (item, index) {
			console.log('>>> - ', index);
			if (index == 0) {
				code1 = item;
			} else {
				if (item.indexOf('#') != -1 && i == 1) {
					code1 += '\n' + item.replace('#', '');
					i++;
				} else {
					code1 += '\n' + item;
				}
			}
		});
		updateCode(code1, true, true);
	};

	const onSpeechClick = () => {
		
		populateCodeStore($codeStore.code); 
		let btnRec = jq('#startRecognition').find('span');

		if (btnRec.text() === 'Start Speech') {
		
			btnRec.text('Stop Speech');
			jq('#startRecognition').find('i').addClass('fa-microphone-slash');
			startSpeechAI('#startRecognition');
			jq('#recordId').show();
		} else if (btnRec.text() === 'Stop Speech') {
			
			btnRec.text('Start Speech');
			jq('#startRecognition').find('i').removeClass('fa-microphone-slash');
			stopSpeechAI();
			jq('#recordId').hide();
		}
	};

	jq(function () {
	
		//jq('#startRecognition').click(function () {

		/*jq('.view-line:last-child').focus();	
		jq('#startRecognition').find('span').text(function(i, btext){
			if (btext === "Start Speach") {

				startSpeechAI();
				jq('#recordId').show();
			} else {

				stopSpeechAI();
				jq('#recordId').hide();
			}
			return btext === "Start Speach" ? "Stop Speach" : "Start Speach";
		});                                
		jq(this).find('i').toggleClass('fa-microphone-slash'); */
		//});
	});
	//const speach = () => {
		/*jq(function () {
			try {
				var recognition = new webkitSpeechRecognition();
			} catch (e) {
				var recognition = Object;
			}
			recognition.continuous = true;
			recognition.interimResults = true;
			let fullScript = $codeStore.code;

			recognition.onresult = function (event) {
				var txtRec = '';
				for (var i = event.resultIndex; i < event.results.length; ++i) {
					txtRec += event.results[i][0].transcript;
				}

				fullScript = fullScript + txtRec+'\n'
				//updateCode(fullScript, true, false);
				jq('.view-line:last-child span').text((fullScript.indexOf('sequence diagram') != -1 ? txtRec.replaceAll('sequence diagram','sequenceDiagram') : txtRec) + '\n');
			};
			jq('#startRecognition').click(function (this) {

				jq('.view-line:last-child').focus();	
				jq(this).find('span').text(function(i, btnText){
					if (btnText === "Start Speach") {
						startSpeechAI(this);
						//new speechAI.intiSpeechAI(new Artyom());
						//recognition.start();
						// Let's define a command.
//   const commands = {
//     'hello': () => { alert('Hello world!'); }
//   };

//   // Add our commands to annyang
//   annyangInit.annyang.addCommands(commands);
//   annyangInit.annyang.start();
						jq('#recordId').show();
					} else {
						stopSpeechAI();
						//recognition.stop();
						//annyangInit.annyang.stop();
						jq('#recordId').hide();
					}
					return btnText === "Start Speach" ? "Stop Speach" : "Start Speach";
				});                                
				jq(this).find('i').toggleClass('fa-microphone-slash'); 
			});*/
			/*jq('#stopRecognition').click(function () {
				recognition.stop();
				jq(this).prop('disabled', true);
				jq('#startRecognition').prop('disabled', false);
				jq('#recordId').hide();
			});*/
		//});
	//};
	/*let annyangInit;
	const annyang1 = () => {
		//window.onload = function(){
			x = new window.annyang;
			if (annyang) {
				var commands = {
					'Hello': function() {
					alert('Hi! I can hear you.');
				}
			};
			//annyang.addCommands(commands);
				annyang.start();
			}
		//}
	}*/

	/*export const loadGistData = async (): Promise<State> => {
		const { history } =  
			await fetch(`https://cdnjs.cloudflare.com/ajax/libs/annyang/2.6.1/annyang.min.js`)
		 console.log(history);
		 console.log(annyang);
	};
	loadGistData();*/
	
</script>

<!-- <svelte:head>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/annyang/2.6.1/annyang.min.js" on:load={annyangInit}></script>
</svelte:head> -->

<div class="h-full flex flex-col overflow-hidden">
	<Navbar />
	<div class="flex-1 flex overflow-hidden">
		<div class="hidden md:flex flex-col" id="editorPane" style="width: 35%">
			<Card on:select={tabSelectHandler} {tabs} isCloseable={false} title="">
				<div slot="actions">
					<div class="flex flex-row items-center">
						<div class="form-control flex-row items-center">
							<label class="cursor-pointer label" for="autoSync">
								<span> Auto sync</span>
								<input
									type="checkbox"
									class="toggle {$codeStore.autoSync ? 'btn-secondary' : 'toggle-primary'} ml-1"
									id="autoSync"
									bind:checked={$codeStore.autoSync} />
							</label>
						</div>

						{#if !$codeStore.autoSync}
							<button
								class="btn btn-secondary btn-xs mr-1"
								title="Sync Diagram"
								data-cy="sync"
								on:click={syncDiagram}><i class="fas fa-sync" /></button>
						{/if}

						<button class="btn btn-secondary btn-xs" title="View documentation">
							<a target="_blank" href={docURL} data-cy="docs"><i class="fas fa-book mr-1" />Docs</a>
						</button>
					</div>
				</div>
				{#if selectedMode != 'tokens'}
					<Editor on:update={updateHandler} {language} bind:text {errorMarkers} />
				{:else}
					<Tokens />
				{/if}
			</Card>

			<div class="-mt-2">
				<Preset />
				<History />
				<Actions />
			</div>
		</div>
		<div id="resizeHandler" class="hidden md:block" />
		<div class="flex-1 flex flex-col overflow-hidden">
			<Card
				class="fas fa-arrow-alt-circle-right mr-1"
				title="Diagram"
				cardIcon="bookmark"
				isCloseable={false}>
				<div slot="actions">
					<span id="recordId" style="display:none">
						<div>
							<img src={recIcon} class="record-gif" alt="Recording..."/>						
						</div><span style="margin-right: 15px;color: #000;font-weight: 500;">REC</span>
					</span>
					<button id="startRecognition"
						class="btn btn-secondary btn-xs"
						title="Start Recognition"						
						on:click|stopPropagation={() => onSpeechClick()}><i class="fas fa-microphone mr-1" /><span>Start Speech</span></button>
					<!-- <button id="stopRecognition"
						class="btn btn-secondary btn-xs"
						title="Stop Recognition" disabled="true"						
						><i class="fas fa-microphone-slash mr-1" />Stop Speach</button> -->
					<button
						class="btn btn-secondary btn-xs"
						title="Comment All"
						on:click|stopPropagation={() => resetBtn()}
						><i class="fas fa-code mr-1" />Comment All</button>
					<button
						class="btn btn-secondary btn-xs"
						title="Show Next Line"
						on:click|stopPropagation={() => nextBtn()}
						><i class="fas fa-arrow-alt-circle-right mr-1" />Show Next Line</button>
					<button
						class="btn btn-secondary btn-xs"
						title="View diagram in new page"
						on:click|stopPropagation={() => viewDiagram()}
						><i class="far fa-eye mr-1" />View</button>
				</div>
				<div class="flex-1 overflow-auto">
					<View />
				</div>
			</Card>
			<div class="md:hidden rounded shadow p-2 mx-2">
				Code editing not supported on mobile. Please use a desktop browser.
			</div>
		</div>
	</div>
</div>

<style>
	#resizeHandler {
		cursor: col-resize;
		padding: 0 2px;
	}

	#resizeHandler::after {
		width: 2px;
		height: 100%;
		top: 0;
		content: '';
		position: absolute;
		background-color: hsla(var(--b3));
		margin-left: -1px;
		transition-duration: 0.2s;
	}

	#resizeHandler:hover::after {
		margin-left: -2px;
		background-color: hsla(var(--p));
		width: 4px;
	}
	.record-gif{
		position: absolute;
		margin-left: -30px;
		height: 1rem;
		padding-left: 0.5rem;
		padding-right: 0.5rem;
		min-height: 1rem;
		margin-top: 5px;
	}
</style>
