const login = document.querySelector('#login');
const workspace = document.querySelector('#workspace');
const status = document.querySelector('#status');
const issued = document.querySelector('#issued');
let account;
async function request(body) {
  const response = await fetch('/api/market-access', body ? {
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),
  } : {});
  const data = await response.json();
  if (!response.ok) throw Error(data.error || 'Request failed.');
  return data;
}
function revealCode(code) {
  issued.hidden = false;
  issued.textContent = 'Copy this code and share it privately with the owner. It is shown only for this operation.\n' + code;
}
async function directory() {
  const data = await request({action:'directory'});
  document.querySelector('#accounts').replaceChildren(...data.accounts.map(item => {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = item.label + ' · ' + item.role;
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.textContent = 'Replace access code';
    reset.addEventListener('click', async () => {
      if (!confirm('Replace this code and sign out the current sessions for ' + item.label + '?')) return;
      reset.disabled = true;
      try {revealCode((await request({action:'reset',targetId:item.id})).code);}
      catch(error) {status.textContent = error.message;}
      finally {reset.disabled = false;}
    });
    li.append(label, reset);
    if (account.role === 'owner' && item.role !== 'owner') {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.textContent = item.active ? 'Disable access' : 'Enable access';
      toggle.addEventListener('click', async () => {
        toggle.disabled = true;
        try {
          await request({action:'set-active',targetId:item.id,active:!item.active});
          await directory();
        } catch(error) {status.textContent = error.message;toggle.disabled = false;}
      });
      li.append(toggle);
    }
    return li;
  }));
  document.querySelector('#businesses').replaceChildren(...data.businesses.map(shop => {
    const option = document.createElement('option');
    option.value = shop.id; option.textContent = shop.name;
    return option;
  }));
}
async function show(data) {
  account = data.account;
  login.hidden = true; workspace.hidden = false; status.textContent = '';
  document.querySelector('#welcome').textContent = account.label;
  const manager = ['owner','manager'].includes(account.role);
  document.querySelector('#management').hidden = !manager;
  document.querySelector('#seller-note').hidden = manager;
  document.querySelector('#create').hidden = account.role !== 'owner';
  if (manager) await directory();
  window.dispatchEvent(new CustomEvent('market-account',{detail:account}));
}
login.addEventListener('submit', async event => {
  event.preventDefault();
  const button = login.querySelector('button'); button.disabled = true;
  try {await show(await request({action:'login',code:login.elements.code.value})); login.reset();}
  catch(error) {status.textContent = error.message;}
  finally {button.disabled = false;}
});
document.querySelector('#logout').addEventListener('click', async () => {
  if(window.catalogueDirty && !confirm('Leave without saving your catalogue changes?')) return;
  try {await request({action:'logout'});location.reload();}
  catch(error) {status.textContent = error.message;}
});
const create = document.querySelector('#create');
create.addEventListener('submit', async event => {
  event.preventDefault();
  const button = create.querySelector('button'); button.disabled = true;
  try {
    const result = await request({action:'create',...Object.fromEntries(new FormData(create))});
    await directory(); revealCode(result.code);
  } catch(error) {status.textContent = error.message;}
  finally {button.disabled = false;}
});
request().then(show).catch(error => {status.textContent = error.message;});
