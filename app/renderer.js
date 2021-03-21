const path = require('path');
const marked = require('marked');
const { remote, ipcRenderer, shell } = require('electron');

let filePath = null;
let originalContent = '';

const mainProcess = remote.require(`${__dirname}/main.js`);
const currentWindow = remote.getCurrentWindow();

const markdownView = document.querySelector('#markdown');
const htmlView = document.querySelector('#html');
const newFileButton = document.querySelector('#new-file');
const openFileButton = document.querySelector('#open-file');
const saveMarkdownButton = document.querySelector('#save-markdown');
const revertButton = document.querySelector('#revert');
const saveHtmlButton = document.querySelector('#save-html');
const showFileButton = document.querySelector('#show-file');
const openInDefaultButton = document.querySelector('#open-in-default');

const renderMarkdownToHtml = (markdown) => {
	htmlView.innerHTML = marked(markdown, { sanitize: true });
};

const updateUserInterface = (isEdited) => {
	let title = 'Fire Sale';
	if (filePath) {
		title = `${path.basename(filePath)} - ${title}`;
	}
	if (isEdited) {
		title = `${title} (Edited)`;
	}
	if (filePath) {
		currentWindow.setRepresentedFilename(filePath);
	}

	showFileButton.disabled = !filePath;
	openInDefaultButton.disabled = !filePath;

	currentWindow.setDocumentEdited(isEdited);
	saveMarkdownButton.disabled = !isEdited;
	revertButton.disabled = !isEdited;
	currentWindow.setTitle(title);
};

markdownView.addEventListener('keyup', (event) => {
	const currentContent = event.target.value;

	renderMarkdownToHtml(currentContent);
	updateUserInterface(currentContent !== originalContent);
});

openFileButton.addEventListener('click', () => {
	mainProcess.getFileFromUser();
});

const saveMarkdown = () => {
	mainProcess.saveMarkdown(filePath, markdownView.value);
};

const saveHTML = () => {
	mainProcess.saveHtml(htmlView.innerHTML);
};

saveMarkdownButton.addEventListener('click', saveMarkdown);
saveHtmlButton.addEventListener('click', saveHTML);

ipcRenderer.on('save-markdown', saveMarkdown);
ipcRenderer.on('save-html', saveHTML);

showFileButton.addEventListener('click', () => {
	if (!filePath) {
		return alert('No file path');
	}

	shell.showItemInFolder(filePath);
});

openInDefaultButton.addEventListener('click', () => {
	if (!filePath) {
		return alert('There is no file to be opened.');
	}
	shell.openItem(filePath);
});

ipcRenderer.on('file-opened', (event, file, content) => {
	filePath = file;
	originalContent = content;
	markdownView.value = content;

	renderMarkdownToHtml(content);
	updateUserInterface(false);
});

document.addEventListener('dragstart', (event) => event.preventDefault());
document.addEventListener('dragover', (event) => event.preventDefault());
document.addEventListener('dragleave', (event) => event.preventDefault());
document.addEventListener('drop', (event) => event.preventDefault());

const getDraggedFile = (event) => event.dataTransfer.items[0];
const getDroppedFile = (event) => event.dataTransfer.files[0];
const isFileTypeSupported = (file) => {
	// add empty type since markdown files don't return text/markdown in v8/blink...
	return ['text/plain', 'text/markdown', ''].includes(file.type);
};

markdownView.addEventListener('dragover', (event) => {
	const file = getDraggedFile(event);

	if (isFileTypeSupported(file)) {
		markdownView.classList.add('drag-over');
	} else {
		markdownView.classList.add('drag-error');
	}
});

markdownView.addEventListener('dragleave', () => {
	markdownView.classList.remove('drag-over');
	markdownView.classList.remove('drag-error');
});

markdownView.addEventListener('drop', (event) => {
	const file = getDroppedFile(event);

	if (isFileTypeSupported(file)) {
		mainProcess.openFile(file.path);
	} else {
		alert(
			'That file type is not supported, only .txt or .md files are accepted'
		);
	}
});
