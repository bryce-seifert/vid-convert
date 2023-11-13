const { app, Notification, ipcMain, BrowserWindow, webContents } = require('electron')
const path = require('node:path')
const fs = require('fs')
const homeDir = require('os').homedir()
const desktopDir = `${homeDir}/Desktop`

const ffmpegStatic = require('ffmpeg-static')
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegStatic)

function createWindow() {
	this.mainWindow = new BrowserWindow({
		width: 400,
		height: 400,
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
}

app.on('open-file', function (event, filePath) {
	event.preventDefault()
	findFiles(filePath)
})

app.whenReady().then(() => {
	createWindow()

	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on('window-all-closed', function () {
	app.quit()
})

ipcMain.on('dropped-file', (event, arg) => {
	console.log('Dropped File(s):', arg)

	if (arg.length) {
		arg.forEach((file) => {
			console.log(file)
			findFiles(file)
		})
	}
})

ipcMain.on('test', (event, arg) => {
	console.log(arg)
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
			console.log('File')
			convert(path)
		} else if (stats.isDirectory()) {
			console.log('Directory')
			fs.readdir(path, function (err, files) {
				if (err) {
					return console.log('Unable to scan directory: ' + err)
				}

				files.forEach(function (file) {
					convert(path + '/' + file)
				})
			})
		} else {
			console.log('Unknown file type')
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
		.size('1920x?')
		.aspect('16:9')
		.format('mp4')
		.videoBitrate('5000k')
		.outputOptions([
			'-crf 18',
			'-profile:v high',
			'-level:v 4.1',
		  ])
		.videoFilters('format=yuv420p')

		// Audio
		.outputOptions([
			'-ab 192k',
			'-ac 2',
			'-ar 48000',
		  ])

		.on('progress', (progress) => {
			if (progress?.percent) {
				// console.log(`Processing: ${Math.floor(progress.percent)}% done`)
				progressLoad(Math.floor(progress.percent))
			}
		})

		// Output file
		.saveToFile(`${desktopDir}/converted/${fileName}.mp4`)

		.on('end', () => {
			console.log('FFmpeg has finished.')
			progressLoad(-1)

			showNotification('Vid Convert', `${fileName} is converted`)
			adjustBadgeCount(false)
		})

		.on('error', (error) => {
			showNotification('Vid Convert', `${error}`)
			adjustBadgeCount(false)
			console.error(error)
		})
}

/*   require('electron-reload')(__dirname, {
	electron: require(`${__dirname}/node_modules/electron`),
})  */
