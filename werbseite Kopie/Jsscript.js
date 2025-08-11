/* script.js - gemeinsame UI-Funktionen
   - mobile burger menu
   - sticky nav handled by CSS (position: sticky)
   - parallax for hero (data-parallax)
   - smooth section scroll (native smooth scroll used)
   - load product previews from localStorage (or default)
   - contact form handler (local simulation)
*/

/* Utility: query */
const $ = (s, ctx=document) => ctx.querySelector(s);

/* DOM ready */
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initParallax();
  loadYear();
  loadProductPreviews();
  initContactForm();
  initFAQ();
  initBurger();
});

/* Header / Burger */
function initHeader(){
  // nothing heavy here — sticky via CSS
}

function initBurger(){
  const burger = $('#burger');
  const nav = $('#main-nav');
  if(!burger || !nav) return;
  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
    burger.classList.toggle('open');
  });
}

/* Parallax simple */
function initParallax(){
  const el = document.querySelector('[data-parallax]');
  if(!el) return;
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    // subtle translate for parallax
    el.style.transform = `translateY(${scrolled * -0.12}px) scale(1.05)`;
  });
}

/* Load current year */
function loadYear(){
  document.querySelectorAll('#year, #year2, #year3, #year4').forEach(n => {
    if(n) n.textContent = new Date().getFullYear();
  });
}

/* Default product data (used if no data in localStorage) */
const DEFAULT_DATA = {
  products: [
    { id: 'p1', title: 'Projecta Classic', price: 129.00, desc: 'Elegantes Armband mit GPS und Alarm.', images: ['images/product1.jpg','images/product2.jpg'], bestseller:true },
    { id: 'p2', title: 'Projecta Slim', price: 149.00, desc: 'Schlankes Design, lange Akkulaufzeit.', images: ['images/product2.jpg','images/product3.jpg'], bestseller:true },
    { id: 'p3', title: 'Projecta Kids', price: 99.00, desc: 'Speziell für Kinder, robust und leicht.', images: ['images/product3.jpg','images/product1.jpg'], bestseller:false }
  ],
  content: { mission: 'Projecta bringt Sicherheit in eleganter Form.' },
  admin: null
};

/* Load or initialize data in localStorage */
function getData(){
  const raw = localStorage.getItem('projecta_data');
  if(!raw){
    localStorage.setItem('projecta_data', JSON.stringify(DEFAULT_DATA));
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  try{
    return JSON.parse(raw);
  }catch(e){
    console.error('Fehler beim Parsen projecta_data', e);
    return DEFAULT_DATA;
  }
}
function saveData(data){
  localStorage.setItem('projecta_data', JSON.stringify(data));
}

/* Product previews on index */
function loadProductPreviews(){
  const preview = $('#product-preview');
  if(!preview) return;
  const data = getData();
  preview.innerHTML = '';
  data.products.slice(0,6).forEach(p => {
    const card = document.createElement('article');
    card.className = 'product-card';
    const img = document.createElement('img');
    img.src = p.images && p.images[0] ? p.images[0] : 'images/product1.jpg';
    img.alt = p.title;
    const title = document.createElement('h3');
    title.textContent = p.title;
    const price = document.createElement('div');
    price.className = 'price';
    price.textContent = `€${p.price.toFixed(2)}`;
    const btn = document.createElement('a');
    btn.className = 'btn btn-primary';
    btn.href = 'product.html';
    btn.textContent = 'Details';
    card.append(img,title,price,btn);
    preview.appendChild(card);
  });
}

/* Contact form - simulation */
function initContactForm(){
  const form = $('#contact-form');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = $('#c-name').value.trim();
    const email = $('#c-email').value.trim();
    const msg = $('#c-message').value.trim();
    const storage = JSON.parse(localStorage.getItem('projecta_messages') || '[]');
    storage.push({name,email,msg,date:new Date().toISOString()});
    localStorage.setItem('projecta_messages', JSON.stringify(storage));
    $('#contact-msg').textContent = 'Danke — Nachricht gespeichert (lokal).';
    form.reset();
  });
}

/* FAQ accordion */
function initFAQ(){
  document.querySelectorAll('.accordion-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const panel = btn.nextElementSibling;
      const open = panel.style.display === 'block';
      document.querySelectorAll('.accordion-panel').forEach(p=>p.style.display='none');
      if(!open) panel.style.display = 'block'; else panel.style.display = 'none';
    });
  });
}

/* Small helper for showing toasts / messages (not a lib) */
function showMsg(target, text, timeout=3000){
  if(!target) return;
  target.textContent = text;
  setTimeout(()=>{ target.textContent = ''; }, timeout);
}

/* Expose for admin/product pages to use */
window.Projecta = {
  getData, saveData, showMsg
};
