const { app, BrowserWindow } = require('electron');

let mainWindow = null;

app.on('ready', () => {
	console.log("It's ready");
	mainWindow = new BrowserWindow({
		show: false,
	});
	mainWindow.loadFile(`${__dirname}/index.html`);
	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
	});
});

console.log('Starting Application');
