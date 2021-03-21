const fs = require('fs');
const { app, BrowserWindow, dialog, Menu } = require('electron');

let mainWindow = null;

app.on('ready', () => {
	mainWindow = new BrowserWindow({
		show: false,
	});
	Menu.setApplicationMenu(applicationMenu);
	mainWindow.loadFile(`${__dirname}/index.html`);
	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
	});
});

exports.getFileFromUser = () => {
	const files = dialog.showOpenDialog(mainWindow, {
		properties: ['openFile'],
		buttonLabel: 'Choose this file',
		title: 'Open Text Document',
		filters: [
			{ name: 'Markdown Files', extensions: ['md', 'mdown', 'markdown'] },
			{ name: 'Text Files', extensions: ['txt', 'text'] },
		],
	});

	if (!files) {
		return;
	}
	const file = files[0];
	openFile(file);
};

exports.saveMarkdown = (file, content) => {
	if (!file) {
		file = dialog.showSaveDialog(mainWindow, {
			title: 'Save Markdown File',
			defaultPath: app.getPath('desktop'),
			buttonLabel: 'Save Markdown File',
			filters: [
				{
					name: 'Markdown Files',
					extensions: ['md', 'markdown', 'mdown'],
				},
			],
		});
	}

	if (!file) {
		return;
	}

	fs.writeFileSync(file, content);
	openFile(file);
};

exports.saveHtml = (content) => {
	const file = dialog.showSaveDialog(mainWindow, {
		title: 'Save HTML File',
		defaultPath: app.getPath('desktop'),
		buttonLabel: 'Save HTML File',
		filters: [
			{
				name: 'HTML Files',
				extensions: ['html'],
			},
		],
	});

	if (!file) {
		return;
	}

	fs.writeFileSync(file, content);
};

const openFile = (exports.openFile = (file) => {
	const content = fs
		.readFileSync(file, { encoding: 'utf8' })
		.toString()
		// strip carriage returns because HTMLInputElement.value strips these
		.replace(/\r/gm, '');

	app.addRecentDocument(file);
	mainWindow.webContents.send('file-opened', file, content);
});

const menuTemplate = [
	{
		label: 'File',
		submenu: [
			{
				label: 'Open File',
				accelerator: 'CommandOrControl+O',
				click() {
					exports.getFileFromUser();
				},
			},
			{
				label: 'Save File',
				accelerator: 'CommandOrControl+S',
				click() {
					mainWindow.webContents.send('save-markdown');
				},
			},
			{
				label: 'Save HTML',
				accelerator: 'CommandOrControl+Shift+S',
				click() {
					mainWindow.webContents.send('save-html');
				},
			},
			{
				label: 'Copy',
				role: 'copy',
			},
		],
	},
];

if (process.platform === 'darwin') {
	const applicationName = 'Fire Sale';
	menuTemplate.unshift({
		label: applicationName,
		submenu: [
			{
				label: `About ${applicationName}`,
				role: 'about',
			},
			{
				label: `Quit ${applicationName}`,
				role: 'quit',
			},
		],
	});
}

const applicationMenu = Menu.buildFromTemplate(menuTemplate);
