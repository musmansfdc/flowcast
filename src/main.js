import App from './app.html';//'./routes/edit.svelte';

const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

export default app;