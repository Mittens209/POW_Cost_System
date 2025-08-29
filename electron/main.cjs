const { app, BrowserWindow } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const fs = require('fs');

let mainWindow;

function getIndexHtmlPath() {
	const isPackaged = app.isPackaged;
	if (isPackaged) {
		// In packaged/unpacked, app files live under resources/app
		return path.join(app.getAppPath(), 'dist', 'index.html');
	}
	// In development, load local dist build if present
	return path.join(__dirname, '..', 'dist', 'index.html');
}

function createMainWindow() {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		show: false,
		webPreferences: {
			preload: path.join(__dirname, 'preload.cjs'),
			contextIsolation: true,
			nodeIntegration: false,
			webSecurity: false,
			allowRunningInsecureContent: true,
		},
	});

	const indexHtmlPath = getIndexHtmlPath();
	if (!fs.existsSync(indexHtmlPath)) {
		console.error('index.html not found at', indexHtmlPath);
	}
	const fileUrl = pathToFileURL(indexHtmlPath).toString();
	mainWindow.loadURL(fileUrl).catch((err) => {
		console.error('Failed to load index.html', err);
	});

	mainWindow.on('ready-to-show', () => {
		mainWindow.show();
		if (!app.isPackaged) {
			mainWindow.webContents.openDevTools({ mode: 'detach' });
		}
	});

	// Diagnostics for white screen
	mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDesc, validatedURL) => {
		console.error('did-fail-load', { errorCode, errorDesc, validatedURL });
	});
	mainWindow.webContents.on('render-process-gone', (_event, details) => {
		console.error('render-process-gone', details);
	});
	mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
		console.log('renderer console:', { level, message, line, sourceId });
	});

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

app.whenReady().then(() => {
	createMainWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});


