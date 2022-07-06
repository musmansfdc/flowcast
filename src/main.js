import App from './routes/edit.svelte';//'./app.html';//

const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

export default app;