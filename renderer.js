const { ipcRenderer } = require('electron')

//App Version Text
const version = document.getElementById('version')
ipcRenderer.send('app_version')
ipcRenderer.on('app_version', (event, arg) => {
	ipcRenderer.removeAllListeners('app_version')
	version.innerText = 'v' + arg.version
})

//Drag/Drop Animation
function triggerDragZone(state) {
	let zone = document.getElementById('drag-zone')
	let logo = document.getElementById('logo')
	if (state && zone) {
		zone.style.opacity = '.9'
		zone.style.transition = '.5s'
	} else {
		zone.style.opacity = '0'
		zone.style.transition = '.5s'
	}
	if (state && logo) {
		logo.style.top = '90px'
		logo.style.left = '110px'
		logo.style.backgroundSize = '50%'
		logo.style.transition = '.5s'
	} else {
		logo.style.top = '60px'
		logo.style.left = '125px'
		logo.style.backgroundSize = '40%'
		logo.style.transition = '.5s'
	}
}

function triggerConfirmZone(state) {
	let zone = document.getElementById('confirm-zone')
	let logo = document.getElementById('logo')
	if (state && zone) {
		zone.style.opacity = '.9'
		zone.style.transition = '.5s'
	}
	if (state && logo) {
		logo.style.top = '60px'
		logo.style.left = '60px'
		logo.style.backgroundSize = '70%'
		logo.style.transition = '1s'
	}

	setTimeout(function () {
		zone.style.opacity = '0'
		zone.style.transition = '.5s'
		logo.style.top = '60px'
		logo.style.left = '125px'
		logo.style.backgroundSize = '40%'
		logo.style.transition = '.5s'
	}, 1000)
}

document.addEventListener('dragover', (e) => {
	triggerDragZone(true)

	e.preventDefault()
	e.stopPropagation()
})

document.addEventListener('dragleave', (e) => {
	triggerDragZone(false)

	e.preventDefault()
	e.stopPropagation()
})

document.addEventListener('dragenter', (e) => {
	e.preventDefault()
	e.stopPropagation()
})

document.addEventListener('drop', (event) => {
	triggerDragZone(false)
	triggerConfirmZone(true)
	event.preventDefault()
	event.stopPropagation()

	let pathArr = []
	for (const f of event.dataTransfer.files) {
		// Using the path attribute to get absolute file path
		pathArr.push(f.path) // assemble array for main.js
	}

	ipcRenderer.send('dropped-file', pathArr)
})
