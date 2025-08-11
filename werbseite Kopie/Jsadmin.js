/* admin.js - Admin Login + Dashboard (client-side)
   - Sichere Passwort-Hashing via Web Crypto PBKDF2 (salt + iterations)
   - Produkte und Inhalte editierbar, gespeichert in localStorage.projecta_data
   - Bilder werden als Data-URL im JSON abgespeichert
   - Export / Import JSON zur Sicherung
*/

/* --- Crypto helpers (PBKDF2) --- */
async function genSalt(len=16){
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  return bufferToHex(a);
}
function bufferToHex(buf){
  if (typeof buf === 'string') return buf;
  const arr = new Uint8Array(buf);
  return Array.from(arr).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function hexToBuffer(hex){
  const bytes = new Uint8Array(hex.match(/.{2}/g).map(b=>parseInt(b,16)));
  return bytes.buffer;
}
async function hashPassword(password, saltHex, iterations=150000){
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), {name:'PBKDF2'}, false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({
    name:'PBKDF2',
    salt: hexToBuffer(saltHex),
    iterations,
    hash:'SHA-256'
  }, key, 256);
  return bufferToHex(derived);
}

/* --- Admin logic --- */
document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
});

async function initAdmin(){
  // Ensure there is initial data & admin account
  const data = window.Projecta.getData();
  if(!data.admin){
    // create default admin with email admin@projecta.local and password admin123
    const salt = await genSalt();
    const hash = await hashPassword('admin123', salt);
    data.admin = { email:'admin@projecta.local', hash, salt, iterations:150000 };
    window.Projecta.saveData(data);
    console.info('Default admin created: admin@projecta.local / admin123 (please change)');
  }

  // UI elements
  const loginSection = document.getElementById('login-section');
  const dashboard = document.getElementById('dashboard');
  const loginForm = document.getElementById('login-form');
  const loginMsg = document.getElementById('login-msg');

  const logoutBtn = document.getElementById('logout');
  const productList = document.getElementById('product-list');
  const newProductBtn = document.getElementById('new-product');
  const missionField = document.getElementById('site-mission');
  const saveContentBtn = document.getElementById('save-content');
  const exportBtn = document.getElementById('export-data');
  const importFile = document.getElementById('import-file');
  const dataMsg = document.getElementById('data-msg');

  // If already logged in (simple flag)
  if(sessionStorage.getItem('projecta_admin_logged') === '1'){
    loginSection.classList.add('hidden');
    dashboard.classList.remove('hidden');
    renderDashboard();
  }

  // Login submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value.trim().toLowerCase();
    const pass = document.getElementById('admin-pass').value;
    const d = window.Projecta.getData();
    if(!d.admin || d.admin.email !== email){
      loginMsg.textContent = 'Ungültige E-Mail oder Passwort';
      return;
    }
    const hash = await hashPassword(pass, d.admin.salt, d.admin.iterations);
    if(hash === d.admin.hash){
      sessionStorage.setItem('projecta_admin_logged','1');
      loginSection.classList.add('hidden');
      dashboard.classList.remove('hidden');
      renderDashboard();
    } else {
      loginMsg.textContent = 'Ungültige E-Mail oder Passwort';
    }
  });

  logoutBtn.addEventListener('click', ()=> {
    sessionStorage.removeItem('projecta_admin_logged');
    location.reload();
  });

  /* Dashboard rendering and handlers */
  function renderDashboard(){
    const d = window.Projecta.getData();
    // mission field
    missionField.value = d.content?.mission || '';

    // products list
    productList.innerHTML = '';
    d.products.forEach(p => {
      const el = document.createElement('div');
      el.className = 'muted';
      el.style.marginBottom = '0.8rem';
      el.innerHTML = `
        <strong>${p.title}</strong> — €${p.price.toFixed(2)}
        <div style="margin-top:.4rem">
          <button class="btn btn-outline edit" data-id="${p.id}">Bearbeiten</button>
          <button class="btn btn-outline del" data-id="${p.id}">Löschen</button>
        </div>
      `;
      productList.appendChild(el);
    });

    // attach edit/delete handlers (delegation simple)
    productList.querySelectorAll('.edit').forEach(btn=>{
      btn.addEventListener('click', ()=> openProductEditor(btn.dataset.id));
    });
    productList.querySelectorAll('.del').forEach(btn=>{
      btn.addEventListener('click', ()=> {
        if(!confirm('Produkt löschen?')) return;
        const id = btn.dataset.id;
        const d2 = window.Projecta.getData();
        d2.products = d2.products.filter(x=>x.id !== id);
        window.Projecta.saveData(d2);
        renderDashboard();
      });
    });
  }

  newProductBtn.addEventListener('click', ()=> openProductEditor());

  saveContentBtn.addEventListener('click', ()=>{
    const d = window.Projecta.getData();
    d.content = d.content || {};
    d.content.mission = missionField.value;
    window.Projecta.saveData(d);
    window.Projecta.showMsg(dataMsg,'Inhalte gespeichert',2000);
  });

  exportBtn.addEventListener('click', ()=>{
    const d = window.Projecta.getData();
    const blob = new Blob([JSON.stringify(d, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'projecta_data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  importFile.addEventListener('change', (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try{
        const parsed = JSON.parse(ev.target.result);
        window.Projecta.saveData(parsed);
        window.Projecta.showMsg(dataMsg,'Import erfolgreich. Seite wird neu geladen...',2000);
        setTimeout(()=>location.reload(),1000);
      }catch(err){
        window.Projecta.showMsg(dataMsg,'Fehler beim Import: ungültige JSON',4000);
      }
    };
    reader.readAsText(file);
  });

  /***** Product editor modal (simple) *****/
  function openProductEditor(id){
    const d = window.Projecta.getData();
    const product = id ? d.products.find(x=>x.id===id) : { id: 'p' + Date.now(), title:'Neues Produkt', price:99.0, desc:'', images:[] };
    // create modal elements
    const modal = document.createElement('div');
    modal.style.position='fixed';modal.style.inset=0;modal.style.background='rgba(0,0,0,0.4)';modal.style.display='flex';
    modal.style.alignItems='center';modal.style.justifyContent='center';modal.style.zIndex=9999;
    const box = document.createElement('div');
    box.style.width='720px';box.style.maxWidth='95%';box.style.background='#fff';box.style.padding='1rem';box.style.borderRadius='12px';
    box.innerHTML = `
      <h3>Produkt bearbeiten</h3>
      <label>Titel</label><input id="e-title" value="${escapeHtml(product.title)}">
      <label>Preis (EUR)</label><input id="e-price" type="number" value="${product.price}">
      <label>Beschreibung</label><textarea id="e-desc" rows="4">${escapeHtml(product.desc)}</textarea>
      <label>Bilder (einzeln auswählen)</label><input id="e-image-file" type="file" accept="image/*">
      <div id="e-images" style="display:flex;gap:.6rem;margin-top:.6rem"></div>
      <div style="margin-top:.8rem">
        <button id="e-save" class="btn btn-primary">Speichern</button>
        <button id="e-cancel" class="btn btn-outline">Abbrechen</button>
      </div>
    `;
    modal.appendChild(box);
    document.body.appendChild(modal);

    // render existing images
    const imgsDiv = modal.querySelector('#e-images');
    function renderImages(){
      imgsDiv.innerHTML = '';
      (product.images || []).forEach((src, idx)=>{
        const img = document.createElement('img');
        img.src = src;
        img.style.width='90px';img.style.height='90px';img.style.objectFit='cover';img.style.borderRadius='8px';
        const del = document.createElement('button');
        del.textContent='✕';del.className='btn btn-outline';
        del.style.marginLeft='6px';
        del.addEventListener('click', ()=> {
          product.images.splice(idx,1);
          renderImages();
        });
        const wrap = document.createElement('div');
        wrap.style.display='flex';wrap.style.flexDirection='column';wrap.style.alignItems='center';
        wrap.appendChild(img); wrap.appendChild(del);
        imgsDiv.appendChild(wrap);
      });
    }
    renderImages();

    // upload file -> dataURL
    const fileInp = modal.querySelector('#e-image-file');
    fileInp.addEventListener('change', (ev)=>{
      const f = ev.target.files[0];
      if(!f) return;
      const r = new FileReader();
      r.onload = (e)=> {
        product.images = product.images || [];
        product.images.push(e.target.result); // Data URL
        renderImages();
      };
      r.readAsDataURL(f);
    });

    modal.querySelector('#e-save').addEventListener('click', ()=>{
      product.title = modal.querySelector('#e-title').value.trim();
      product.price = parseFloat(modal.querySelector('#e-price').value || '0');
      product.desc = modal.querySelector('#e-desc').value.trim();
      // save into data
      const d2 = window.Projecta.getData();
      if(id){
        const i = d2.products.findIndex(x=>x.id===id);
        if(i>=0) d2.products[i] = product;
      } else {
        d2.products.push(product);
      }
      window.Projecta.saveData(d2);
      document.body.removeChild(modal);
      renderDashboard();
    });

    modal.querySelector('#e-cancel').addEventListener('click', ()=>{
      document.body.removeChild(modal);
    });
  }

  /* Simple HTML escape for values inside inputs (prevent tiny markup issues) */
  function escapeHtml(s){
    return (s||'').replace(/[&<>"']/g, function(m){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
  }
}
