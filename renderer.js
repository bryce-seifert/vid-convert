const { ipcRenderer } = require('electron')

document.addEventListener('dragover', (e) => {
	//ipcRenderer.send("test", "test")
	e.preventDefault()
	e.stopPropagation()
})

document.addEventListener('dragenter', (e) => {
	//ipcRenderer.send("test", "test")
	e.preventDefault()
	e.stopPropagation()
})

document.addEventListener('drop', (event) => {
	event.preventDefault()
	event.stopPropagation()

	let pathArr = []
	for (const f of event.dataTransfer.files) {
		// Using the path attribute to get absolute file path
		pathArr.push(f.path) // assemble array for main.js
	}

	ipcRenderer.send('dropped-file', pathArr)
})

ipcRenderer.on('test-message', function (evt, message) {
	const element = document.getElementById('drag-zone')
	if (element) element.style.color = 'red'
})
