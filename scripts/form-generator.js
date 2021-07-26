export const formGenerator = (obj, Utils) => {
	const inputContainer = document.querySelector('.input__place');
	inputContainer.innerHTML = '';
  const form = document.createElement('form');
	const roles = Object.entries(obj.roles);
  const radioZone = document.createElement('div');
	const methodZone = document.createElement('div');
	const submit = document.createElement('input');
	submit.value = 'Send Request';
	submit.setAttribute('type', 'submit');
	radioZone.append(submit);
	radioZone.className = 'input__radio';
	methodZone.className = 'input__methods';
	form.addEventListener('submit', e => {
		console.log(e.target);
	})

  form.append(radioZone, methodZone);
	inputContainer.appendChild(form);
	roles.forEach((role, i) => {
		const methods = Object.entries(role[1]);
		const params = []
		const input = document.createElement('INPUT');
		const label = document.createElement('LABEL');
		input.id = role[0];
		input.setAttribute('type', 'radio');
		input.setAttribute('name', 'role');
		input.className = 'roles__input';
		input.dataset.role = role[0];
		label.className = 'roles__label';
		label.innerText = role[0];
		label.setAttribute('for', role[0]);
		input.checked = i === 0;
		radioZone.append(input, label);
		const methodRender = methods.map(
			method => methodInputCreator(method, role, params)
		);
		const paramsRender = params.map(
			param => methodInputCreator(param, role)
		);
		if(input.checked){
			methodZone.append(...methodRender, ...paramsRender);
		}
		input.addEventListener('change', (e) => {
			if (e.target.checked){
				methodZone.innerHTML = '';
				methodZone.append(...methodRender, ...paramsRender);
			}
		});	
	});
};

function methodInputCreator (method, role, params) {
	const input = document.createElement('INPUT');
	const label = document.createElement('LABEL');
	const innerParams = Object.entries(method[1]);
	input.classList = 'method__input';
	label.classList = `method__label ${role}`;
	input.id = method[0];
	label.setAttribute('for', method[0]);
	label.innerText = method[0];
	label.append(input);
	if(params){
	innerParams.forEach(key => {
		const coincidence = params.find(el => el[0] === key[0]);
		if (!coincidence) params.push(key);
	});
	}
	return label
}