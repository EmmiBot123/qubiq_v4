var { ipcRenderer, shell, clipboard } = require("electron")
var { exec } = require('child_process')
var sp = require('serialport')
var fs = require('fs')
var path = require('path')
var appVersion = window.require('electron').remote.app.getVersion()

var arduino_basepath = process.platform == 'win32' ? arduino_basepath = './compilation/arduino' : path.join(__dirname, '../../compilation/arduino')
var arduino_ide_cmd = process.platform == 'win32' ? 'arduino-cli.exe' : arduino_ide_cmd = path.join(__dirname, '../../compilation/arduino/arduino-cli')

function renderPreview() {
	// You must get langToggle and previewEl inside the function, since DOM may not be ready yet
	const langToggle = document.getElementById('lang_toggle');
	const previewEl = document.getElementById('pre_previewArduino');
	if (!langToggle || !previewEl) return; // DOM not ready

	const progInput = langToggle.querySelector('input[name="lang"]:checked');
	if (!progInput) return;
	const prog = progInput.value;
	let rawCode;

	if (prog === 'micropython') {
		rawCode = Blockly.Arduino.workspaceToCode(BlocklyDuino.workspace);
	} else if (prog === 'java') {
		rawCode = Blockly.Arduino.workspaceToCode(BlocklyDuino.workspace);
	} else {
		rawCode = Blockly.Arduino.workspaceToCode(BlocklyDuino.workspace);
	}

	if (prog === 'arduino') {
		previewEl.textContent = rawCode;
		if (window.PR) PR.prettyPrint();
		return;
	}

	previewEl.textContent = 'Loading...';

	// ① Attach listener first
	ipcRenderer.once('translate-snippet-reply', (event, result) => {
		if (result.success) {
			const langToggle = document.getElementById('lang_toggle');
			const progInput = langToggle.querySelector('input[name="lang"]:checked');
			const prog = progInput ? progInput.value : 'arduino';
			if (prog != 'arduino') {
				previewEl.textContent = result.code;
				if (window.PR) PR.prettyPrint();
			}
		} else {
			previewEl.textContent = `Error: ${result.error}`;
		}
	});

	// ② Then send message
	console.log("Sending IPC message to main");
	ipcRenderer.send('translate-snippet', { code: rawCode, lang: prog });
}
window.renderPreview = renderPreview;

window.addEventListener('load', function load(event) {
	var quitDiv = '<button type="button" class="close" data-dismiss="modal" aria-label="Close">&#215;</button>'
	var checkBox = document.getElementById('verifyUpdate')
	var portserie = document.getElementById('portserie')
	var messageDiv = document.getElementById('messageDIV')
	localStorage.setItem("verif", false)
	document.getElementById('versionapp').textContent = " Otto Blockly V" + appVersion
	function uploadOK() {
		messageDiv.style.color = '#009000'
		messageDiv.innerHTML = Blockly.Msg.upload + ': ✅ OK code uploaded' + quitDiv
		$('#message').modal('show');
		setTimeout(function () {
			$('#message').modal('hide');
		}, 3000);
	}
	$('#btn_forum').on('click', function () {
		shell.openExternal('https://discord.gg/CZZytnw')
	})
	$('#btn_site').on('click', function () {
		shell.openExternal('https://www.ottodiy.com/')
	})
	$('#btn_contact').on('click', function () {
		shell.openExternal('https://github.com/OttoDIY/blockly/issues')
	})
	$('#portserie').mouseover(function () {
		sp.list(function (err, ports) {
			var nb_com = localStorage.getItem("nb_com"), menu_opt = portserie.getElementsByTagName('option')
			if (ports.length > nb_com) {
				ports.forEach(function (port) {
					if (port.vendorId) {
						var opt = document.createElement('option')
						opt.value = port.comName
						opt.text = port.comName
						portserie.appendChild(opt)
						localStorage.setItem("com", port.comName)
					}
				})
				localStorage.setItem("nb_com", ports.length)
				localStorage.setItem("com", portserie.options[1].value)
			}
			if (ports.length < nb_com) {
				while (menu_opt[1]) {
					portserie.removeChild(menu_opt[1])
				}
				localStorage.setItem("com", "com")
				localStorage.setItem("nb_com", ports.length)
			}
		})
	})
	$('#btn_copy').on('click', function () {
		clipboard.writeText($('#pre_previewArduino').text())
	})
	$('#btn_bin').on('click', function () {
		if (localStorage.getItem('verif') == "false") {
			$("#message").modal("show")
			messageDiv.style.color = '#000000'
			messageDiv.innerHTML = Blockly.Msg.verif + quitDiv
			return
		}
		localStorage.setItem("verif", false)
		ipcRenderer.send('save-bin')
	})
	$.ajax({
		cache: false,
		url: "../config.json",
		dataType: "json",
		success: function (data) {
			$.each(data, function (i, update) {
				if (update == "true") {
					$('#verifyUpdate').prop('checked', true)
					checkBox.dispatchEvent(new Event('change'))
					ipcRenderer.send("version", "")
				} else {
					$('#verifyUpdate').prop('checked', false)
					checkBox.dispatchEvent(new Event('change'))
				}
			})
		}
	})
	checkBox.addEventListener('change', function (event) {
		if (event.target.checked) {
			fs.writeFile('config.json', '{ "update": "true" }', function (err) {
				if (err) return console.log(err)
			})
		} else {
			fs.writeFile('config.json', '{ "update": "false" }', function (err) {
				if (err) return console.log(err)
			})
		}
	})
	sp.list(function (err, ports) {
		var opt = document.createElement('option')
		opt.value = "com"
		opt.text = Blockly.Msg.com1
		portserie.appendChild(opt)
		ports.forEach(function (port) {
			if (port.vendorId) {
				var opt = document.createElement('option')
				opt.value = port.comName
				opt.text = port.comName
				portserie.appendChild(opt)
			}
		})
		localStorage.setItem("nb_com", ports.length)
		if (portserie.options.length > 1) {
			portserie.selectedIndex = 1
			localStorage.setItem("com", portserie.options[1].value)
		} else {
			localStorage.setItem("com", "com")
		}
	})
	$('#btn_version').on('click', function () {
		$('#aboutModal').modal('hide')
		ipcRenderer.send("version", "")
	})
	$('#btn_term').on('click', function () {
		if (portserie.value == "com") {
			$("#message").modal("show")
			messageDiv.style.color = '#ff0000'
			messageDiv.innerHTML = Blockly.Msg.com2 + quitDiv
			return
		}
		if (localStorage.getItem("prog") == "python") { ipcRenderer.send("repl", "") } else { ipcRenderer.send("prompt", "") }
	})
	$('#btn_factory').on('click', function () {
		ipcRenderer.send("factory", "")
	})
	$('#btn_verify').on('click', function () {
		if (localStorage.getItem('content') == "off") {
			var data = editor.getValue()
		} else {
			var data = $('#pre_previewArduino').text()
		}
		var carte = localStorage.getItem('card')
		var prog = localStorage.getItem('prog')
		var com = portserie.value
		messageDiv.style.color = '#000000'
		messageDiv.innerHTML = Blockly.Msg.check + '<i class="fa fa-spinner fa-pulse fa-1_5x fa-fw"></i>'

		if (prog == "python") {
			fs.writeFile('./compilation/python/py/sketch.py', data, function (err) {
				if (err) return console.log(err)
			})
			exec('python -m pyflakes ./py/sketch.py', { cwd: "./compilation/python" }, function (err, stdout, stderr) {
				if (stderr) {
					rech = RegExp('token')
					if (rech.test(stderr)) {
						messageDiv.style.color = '#ff0000'
						messageDiv.innerHTML = Blockly.Msg.error + quitDiv
					} else {
						messageDiv.style.color = '#ff0000'
						messageDiv.innerHTML = err.toString() + quitDiv
					}
					return
				}
				messageDiv.style.color = '#009000'
				messageDiv.innerHTML = Blockly.Msg.check + ':✅ OK' + quitDiv
			})
		} else {
			//fs.writeFile('./compilation/arduino/ino/sketch.ino', data, function(err){

			fs.writeFile(`${arduino_basepath}/sketch/sketch.ino`, data, function (err) {

				if (err) return console.log(err)
			})

			var upload_arg = window.profile[carte].upload_arg
			var cmd = `${arduino_ide_cmd} compile --fqbn ` + upload_arg + ' sketch/sketch.ino'

			/*
			   exec( cmd, {cwd:'./compilation/arduino'}, function(err, stdout, stderr){
				//exec('verify.bat ' + carte, {cwd:'./compilation/arduino'}, function(err, stdout, stderr){
					if (stderr) {
						rech=RegExp('token')
						if (rech.test(stderr)){
							messageDiv.style.color = '#ff0000'
							messageDiv.innerHTML = Blockly.Msg.error + quitDiv
						} else {
							messageDiv.style.color = '#ff0000'
							messageDiv.innerHTML = err.toString() + quitDiv
						}
						return
					}
	
					messageDiv.style.color = '#009000'
					messageDiv.innerHTML = Blockly.Msg.check + ': OK' + quitDiv
				}) */

			exec(cmd, { cwd: arduino_basepath }, (error, stdout, stderr) => {
				if (error) {

					messageDiv.style.color = '#ff0000'
					messageDiv.innerHTML = error.toString() + quitDiv
					return
				}

				messageDiv.style.color = '#009000'
				messageDiv.innerHTML = Blockly.Msg.check + ': ✅ Code is ready to upload' + quitDiv
				$('#message').modal('show');
				setTimeout(function () {
					$('#message').modal('hide');
				}, 3000);

			})


		}
		localStorage.setItem("verif", true)
	})
	$('#btn_flash').on('click', function () {


		const crypto = require('crypto');

		var data = $('#pre_previewArduino').text();
		var carte = localStorage.getItem('card');
		var prog = profile[carte].prog;
		var cpu = profile[carte].cpu;
		var com = portserie.value;
		var upload_arg = window.profile[carte].upload_arg;

		if (com === "com") {
			messageDiv.style.color = '#ff0000';
			messageDiv.innerHTML = Blockly.Msg.com2 + quitDiv;
			return;
		}

		/* ===================== HELPERS ===================== */

		function hashCode(code) {
			return crypto.createHash("sha256").update(code).digest("hex").slice(0, 16);
		}

		function safeMkdir(dir) {
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir);
			}
		}

		function removeDirRecursive(dir) {
			if (!fs.existsSync(dir)) return;

			fs.readdirSync(dir).forEach(function (file) {
				var cur = path.join(dir, file);
				if (fs.lstatSync(cur).isDirectory()) {
					removeDirRecursive(cur);
				} else {
					fs.unlinkSync(cur);
				}
			});
			fs.rmdirSync(dir);
		}

		function copyRecursive(src, dest) {
			safeMkdir(dest);

			fs.readdirSync(src).forEach(function (item) {
				var srcPath = path.join(src, item);
				var destPath = path.join(dest, item);

				if (fs.lstatSync(srcPath).isDirectory()) {
					copyRecursive(srcPath, destPath);
				} else {
					fs.copyFileSync(srcPath, destPath);
				}
			});
		}

		/* =================================================== */

		if (localStorage.getItem('verif') === "false") {

			messageDiv.style.color = '#000000';
			messageDiv.innerHTML = Blockly.Msg.check +
				'<i class="fa fa-spinner fa-pulse fa-1_5x fa-fw"></i>';

			var codeHash = hashCode(data);

			var cacheDir = path.join(__dirname, 'cache');
			var cacheHashDir = path.join(cacheDir, codeHash);

			var sketchDir = path.join(arduino_basepath, 'sketch');
			var buildDir = path.join(sketchDir, 'build');
			var sketchPath = path.join(sketchDir, 'sketch.ino');

			safeMkdir(cacheDir);

			/* ===================== CACHE HIT ===================== */

			if (fs.existsSync(cacheHashDir)) {

				try {
					if (fs.existsSync(buildDir)) removeDirRecursive(buildDir);
					safeMkdir(buildDir);

					copyRecursive(cacheHashDir, buildDir);

					messageDiv.style.color = '#000000';
					messageDiv.innerHTML = Blockly.Msg.upload +
						'<i class="fa fa-spinner fa-pulse fa-1_5x fa-fw"></i>';

					var uploadCmd =
						arduino_ide_cmd +
						' upload --port ' + portserie.value +
						' --fqbn ' + upload_arg +
						' --input-dir "sketch/build"';

					exec(uploadCmd, { cwd: arduino_basepath }, function (err) {
						if (err) {
							messageDiv.style.color = '#ff0000';
							messageDiv.innerHTML = err.toString() + quitDiv;
							return;
						}
						uploadOK();
					});

				} catch (e) {
					messageDiv.style.color = '#ff0000';
					messageDiv.innerHTML = e.toString() + quitDiv;
				}

				localStorage.setItem("verif", false);
				return;
			}

			/* ===================== CACHE MISS ===================== */

			safeMkdir(sketchDir);
			fs.writeFileSync(sketchPath, data);

			if (fs.existsSync(buildDir)) removeDirRecursive(buildDir);
			safeMkdir(buildDir);

			var compileCmd =
				arduino_ide_cmd +
				' compile --fqbn ' + upload_arg +
				' --output-dir "sketch/build" "sketch/sketch.ino"';

			exec(compileCmd, { cwd: arduino_basepath }, function (error) {

				if (error) {
					messageDiv.style.color = '#ff0000';
					messageDiv.innerHTML = error.toString() + quitDiv;
					return;
				}

				messageDiv.style.color = '#009000';
				messageDiv.innerHTML = Blockly.Msg.check + ': ✅ OK' + quitDiv;

				safeMkdir(cacheHashDir);
				copyRecursive(buildDir, cacheHashDir);

				messageDiv.style.color = '#000000';
				messageDiv.innerHTML = Blockly.Msg.upload +
					'<i class="fa fa-spinner fa-pulse fa-1_5x fa-fw"></i>';

				var uploadCmd =
					arduino_ide_cmd +
					' upload --port ' + portserie.value +
					' --fqbn ' + upload_arg +
					' --input-dir "sketch/build"';

				exec(uploadCmd, { cwd: arduino_basepath }, function (err) {
					if (err) {
						messageDiv.style.color = '#ff0000';
						messageDiv.innerHTML = err.toString() + quitDiv;
						return;
					}
					uploadOK();
				});
			});

			localStorage.setItem("verif", false);
			return;
		}

		/* ===================== DIRECT UPLOAD ===================== */

		messageDiv.style.color = '#000000';
		messageDiv.innerHTML = Blockly.Msg.upload +
			'<i class="fa fa-spinner fa-pulse fa-1_5x fa-fw"></i>';

		var directCmd =
			arduino_ide_cmd +
			' upload --port ' + portserie.value +
			' --fqbn ' + upload_arg +
			' sketch/sketch.ino';

		exec(directCmd, { cwd: arduino_basepath }, function (err) {
			if (err) {
				messageDiv.style.color = '#ff0000';
				messageDiv.innerHTML = err.toString() + quitDiv;
				return;
			}
			uploadOK();
		});

		localStorage.setItem("verif", false);
	});

	$('#btn_saveino').on('click', function () {
		if (localStorage.getItem("prog") == "python") { ipcRenderer.send('save-py') } else { ipcRenderer.send('save-ino') }
	})
	$('#btn_saveXML').on('click', function () {
		if (localStorage.getItem("content") == "on") {
			ipcRenderer.send('save-bloc')
		} else {
			if (localStorage.getItem("prog") == "python") { ipcRenderer.send('save-py') } else { ipcRenderer.send('save-ino') }
		}
	})
	ipcRenderer.on('saved-ino', function (event, path) {
		var code = $('#pre_previewArduino').text()
		if (path === null) {
			return
		} else {
			fs.writeFile(path, code, function (err) {
				if (err) return console.log(err)
			})
		}
	})
	ipcRenderer.on('saved-py', function (event, path) {
		var code = $('#pre_previewArduino').text()
		if (path === null) {
			return
		} else {
			fs.writeFile(path, code, function (err) {
				if (err) return console.log(err)
			})
		}
	})
	ipcRenderer.on('saved-bloc', function (event, path) {
		if (path === null) {
			return
		} else {
			var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace)
			var toolbox = localStorage.getItem("toolbox")
			if (!toolbox) {
				toolbox = $("#toolboxes").val()
			}
			if (toolbox) {
				var newel = document.createElement("toolbox")
				newel.appendChild(document.createTextNode(toolbox))
				xml.insertBefore(newel, xml.childNodes[0])
			}
			var toolboxids = localStorage.getItem("toolboxids")
			if (toolboxids === undefined || toolboxids === "") {
				if ($('#defaultCategories').length) {
					toolboxids = $('#defaultCategories').html()
				}
			}
			var code = Blockly.Xml.domToPrettyText(xml)
			fs.writeFile(path, code, function (err) {
				if (err) return console.log(err)
			})
		}
	})
	ipcRenderer.on('saved-bin', function (event, path) {
		if (path === null) {
			return
		} else {
			var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace)
			var toolbox = localStorage.getItem("toolbox")
			if (!toolbox) {
				toolbox = $("#toolboxes").val()
			}
			if (toolbox) {
				var newel = document.createElement("toolbox")
				newel.appendChild(document.createTextNode(toolbox))
				xml.insertBefore(newel, xml.childNodes[0])
			}
			var toolboxids = localStorage.getItem("toolboxids")
			if (toolboxids === undefined || toolboxids === "") {
				if ($('#defaultCategories').length) {
					toolboxids = $('#defaultCategories').html()
				}
			}
			var code = Blockly.Xml.domToPrettyText(xml)
			var res = path.split(".")
			fs.writeFile(res[0] + '.bloc', code, function (err) {
				if (err) return console.log(err)
			})
			fs.copyFile(`${arduino_basepath}/build/sketch.ino.with_bootloader.hex`, res[0] + '_with_bootloader.hex', (err) => { if (err) throw err })
			fs.copyFile(`${arduino_basepath}/build/sketch.ino.hex`, res[0] + '.hex', (err) => { if (err) throw err })
			fs.copyFile(`${arduino_basepath}/ino/sketch.ino`, res[0] + '.ino', (err) => { if (err) throw err })
		}
	})
})
