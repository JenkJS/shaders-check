export const formGenerator = (obj, Utils, contractShader) => {
	const inputContainer = document.querySelector('.input__place');
	inputContainer.innerHTML = '';

	const form = document.createElement('form');
	const roles = Object.entries(obj.roles);
	const roleZone = document.createElement('div');
	const actionZone = document.createElement('div');
	const paramsZone = document.createElement('div');
	const submit = document.createElement('input');
	submit.value = 'Send Request';
	submit.setAttribute('type', 'submit');
	roleZone.append(submit);
	roleZone.className = 'input__radio';
	actionZone.className = 'input__methods';
	paramsZone.className = 'input__params';
	form.addEventListener('submit', e => {
		e.preventDefault();
		const args = [];
		Array.prototype.find.call(
			form.querySelectorAll('.roles__input'),
			el => el.checked && args.push(`role=${el.id}`)
		);
		Array.prototype.find.call(
			form.querySelectorAll('.action__input'),
			el => el.checked && args.push(`action=${el.id}`)
		);
		Array.prototype.forEach.call(
			form.querySelectorAll('.method__input'),
			el => el.value.length && args.push(`${el.id}=${el.value}`)
		);
		console.log(args);
		Utils.callApi('allMethods-view', 'invoke_contract', {
			create_tx: false,
			contract: Array.from(new Uint8Array(contractShader)),
			args: args.join(','),
		});
	});

	form.append(roleZone, actionZone, paramsZone);
	inputContainer.appendChild(form);
	roles.forEach((role, i) => {
		const methods = Object.entries(role[1]);
		const input = document.createElement('INPUT');
		const label = document.createElement('LABEL');
		input.id = role[0];
		input.setAttribute('type', 'radio');
		input.setAttribute('name', 'role');
		input.className = 'roles__input';
		input.dataset.role = role[0];
		label.className = 'roles__label';
		label.innerText = role[0];
		label.append(input);
		label.setAttribute('for', role[0]);
		input.checked = i === 0;
		roleZone.append(input, label);

		const actionRender = methods.map(method =>
			methodInputCreator(method, paramsZone, true)
		);

		if (input.checked) {
			actionZone.append(...actionRender);
		}

		// const paramsRender = params.map((param) => methodInputCreator(param));

		input.addEventListener('change', e => {
			if (e.target.checked) {
				actionZone.innerHTML = '';
				paramsZone.innerHTML = '';
				actionZone.append(...actionRender);
			}
		});
	});
};

function methodInputCreator(method, place, action) {
	const input = document.createElement('INPUT');
	const label = document.createElement('LABEL');
	const innerParams = Object.entries(method[1]);
	action && input.setAttribute('type', 'radio');
	action && input.setAttribute('name', 'method');
	action && label.insertAdjacentText('beforeend', method[0]);
	label.setAttribute('for', method[0]);
	label.classList = 'method__label';
	input.id = method[0];
	input.placeholder = !action ? method[0] : '';
	input.checked = method[0] === 'view';
	input.classList = `${action ? 'action' : 'method'}__input`;

	label.append(input);
	
	if (action) {
		const params = innerParams.map(el => methodInputCreator(el, place));
		if (innerParams.length && input.checked) {
			place.append(...params);
		}
		input.addEventListener('change', () => {
			place.innerHTML = '';
			if (innerParams.length) {
				place.append(...params);
			}
		});
	}
	return label;
}
