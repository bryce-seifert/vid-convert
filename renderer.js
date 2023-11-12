const { ipcRenderer } = require('electron')

function fadeDragZone(state) {
	let zone = document.getElementById('drag-zone')

	if (state && zone) {
		zone.style.opacity = '.9'
		zone.style.transition = '.5s'
	} else {
		zone.style.opacity = '0'
		zone.style.transition = '.5s'
	}
}

document.addEventListener('dragover', (e) => {
	fadeDragZone(true)

	e.preventDefault()
	e.stopPropagation()
})

document.addEventListener('dragleave', (e) => {
	fadeDragZone(false)

	e.preventDefault()
	e.stopPropagation()
})

document.addEventListener('dragenter', (e) => {
	//ipcRenderer.send("test", "test")
	e.preventDefault()
	e.stopPropagation()
})

document.addEventListener('drop', (event) => {
	fadeDragZone(false)

	event.preventDefault()
	event.stopPropagation()

	let pathArr = []
	for (const f of event.dataTransfer.files) {
		// Using the path attribute to get absolute file path
		pathArr.push(f.path) // assemble array for main.js
	}

	ipcRenderer.send('dropped-file', pathArr)
})

ipcRenderer.on('test', (event, data) => {
	console.log('test')
	let el = document.getElementById('drag-zone')
	el.style.color = 'red'
	console.log('test')
})
