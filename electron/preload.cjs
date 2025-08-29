const { contextBridge } = require('electron');

// Expose a minimal API if needed later. For now, just an app marker
contextBridge.exposeInMainWorld('appInfo', {
	version: '1.0.0',
});


