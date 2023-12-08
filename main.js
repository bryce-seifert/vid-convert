const { app, Notification, ipcMain, BrowserWindow, Menu, webContents } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('node:path')
const fs = require('fs')
const homeDir = require('os').homedir()
const desktopDir = `${homeDir}/Desktop`

const ffmpegStatic = require('ffmpeg-static')
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegStatic)

let manualCheck = false

function createWindow() {
	this.mainWindow = new BrowserWindow({
		width: 400,
		height: 400,
		show: false,
		transparent: true,
		titleBarStyle: 'hidden',
		resizable: false,
		maximizable: false,
		icon: path.join(__dirname, './assets/icon.png'),
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: false,
			nodeIntegration: true,
		},
	})
	//this.mainWindow.webContents.openDevTools()

	this.mainWindow.loadFile('index.html')
	this.mainWindow.webContents.once('ready-to-show', () => {
		this.mainWindow.show()
	})
}

app.on('open-file', function (event, filePath) {
	event.preventDefault()
	findFiles(filePath)
})

app.on('window-all-closed', function () {
	app.quit()
})

app.whenReady().then(() => {
	createWindow()
	autoUpdater.checkForUpdatesAndNotify()

	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})

	//Custom menu
	const template = [
		{
			label: app.name,
			submenu: [
				{
					label: 'Check for Updates...',
					click() {
						manualCheck = true
						autoUpdater.checkForUpdatesAndNotify()
					},
				},
				{ type: 'separator' },
				{ role: 'services' },
				{ type: 'separator' },
				{ role: 'hide' },
				{ role: 'hideOthers' },
				{ role: 'unhide' },
				{ type: 'separator' },
				{ role: 'quit' },
			],
		},
	]
	Menu.setApplicationMenu(Menu.buildFromTemplate(template))
})

//Auto Updater
autoUpdater.on('error', (error) => {
	showNotification('Update Error', String(error))
})

autoUpdater.on('checking-for-update', () => {
	if (manualCheck) {
		showNotification('Checking for Updates', 'A newer version of the app will be downloaded if available')
	}
})

autoUpdater.on('update-not-available', () => {
	if (manualCheck) {
		showNotification('No Updates Available', 'You are using the most recent version')
		this.manualCheck = false
	}
})

//App Version
ipcMain.on('app_version', (event) => {
	event.sender.send('app_version', { version: app.getVersion() })
})

ipcMain.on('dropped-file', (event, arg) => {
	//console.log('Dropped File(s):', arg)

	if (arg.length) {
		arg.forEach((file) => {
			findFiles(file)
		})
	}
})

function createConvertedFolder() {
	fs.mkdir(`${desktopDir}/converted`, { recursive: true }, (err) => {
		if (err) throw err
	})
}

function showNotification(title, message) {
	new Notification({ title: title, body: message }).show()
}

function progressLoad(percent) {
	let completion = percent / 100
	if (completion) {
		this.mainWindow.setProgressBar(completion)
	} else {
		this.mainWindow.setProgressBar(-1)
	}
}

function checkFolder(path) {
	let pathString = String(path)

	fs.stat(pathString, (err, stats) => {
		if (err) {
			console.error(err)
			return
		}
		if (stats.isFile()) {
			convert(path)
		} else if (stats.isDirectory()) {
			fs.readdir(path, function (err, files) {
				if (err) {
					return showNotification('Conversion Error', `Unable to scan directory: ${err}`)
				}

				files.forEach(function (file) {
					convert(path + '/' + file)
				})
			})
		} else {
			showNotification('Conversion Error', `Unknown file type`)
		}
	})
}

function findFiles(path) {
	createConvertedFolder()
	checkFolder(path)
}

function adjustBadgeCount(adjust) {
	let current = app.getBadgeCount()
	if (current >= 0) {
		if (adjust) {
			app.setBadgeCount(current + 1)
		} else {
			app.setBadgeCount(current - 1)
		}
	} else {
		app.setBadgeCount(0)
	}
}

function convert(path) {
	let fileName = path.substring(path.lastIndexOf('/') + 1)
	fileName = fileName.substring(0, fileName.lastIndexOf('.'))

	adjustBadgeCount(true)

	ffmpeg()
		// Input file
		.input(path)

		//Video
		.format('mp4')
		.videoBitrate('5000k')
		.fps('29.97')
		.outputOptions(['-crf 18', '-profile:v high', '-level:v 4.1'])
		.videoFilters(['format=yuv420p', `scale='min(1920,iw)':-1`])

		// Audio
		.outputOptions(['-ab 192k', '-ac 2', '-ar 48000'])

		.on('progress', (progress) => {
			if (progress?.percent) {
				progressLoad(Math.floor(progress.percent))
			}
		})

		// Output file
		.saveToFile(`${desktopDir}/converted/${fileName}.mp4`)

		.on('end', () => {
			progressLoad(-1)

			showNotification('Vid Convert', `${fileName} is converted`)
			adjustBadgeCount(false)
		})

		.on('error', (error) => {
			showNotification('Conversion Error', `${error}`)
			adjustBadgeCount(false)
			console.error(error)
		})
}

/* require('electron-reload')(__dirname, {
	electron: require(`${__dirname}/node_modules/electron`),
}) */
