import Utils from './utils.js';

export const init = (callback) => {
	const dropZone = document.querySelector('.chooseWasm__label');
	const dropZoneText = document.querySelector('.chooseWasm__text');
	const maxFileSize = 5000000;

	dropZone.ondragover = function () {
		this.classList.add('hover');
		return false;
	};
	dropZone.ondragleave = function () {
		this.classList.remove('hover');
		return false;
	};
	dropZone.addEventListener('drop', async function (e) {
		// event - file droped 
		e.preventDefault();
		this.classList.remove('hover');
		this.classList.add('drop');
		const uploadDragFiles = e.dataTransfer.files;
		const files = await uploadDragFiles[0].arrayBuffer();
		callback(files);
		console.log(uploadDragFiles[0].name);
		Utils.callApi('form-generator', 'invoke_contract', {
			contract: Array.from(new Uint8Array(files)),
			create_tx: false
		});

		if (uploadDragFiles[0].size > maxFileSize) {
			dropZoneText.textContent = 'Размер превышает допустимое значение!';
			this.addClass('error');
			return false;
		} else dropZoneText.textContent = uploadDragFiles[0].name;
	});
};
