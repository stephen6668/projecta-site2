/* product.js - Produktseite: Karussell und Zoom
   - Einfacher click-to-switch thumbnails
   - Zoom on hover (desktop)
*/

document.addEventListener('DOMContentLoaded', () => {
  initGallery();
  initAddToCart();
});

function initGallery(){
  const thumbs = document.querySelectorAll('#thumbs img');
  const mainImg = document.getElementById('zoom-image');
  if(!thumbs || !mainImg) return;

  thumbs.forEach(t => {
    t.addEventListener('click', () => {
      const full = t.dataset.full || t.src;
      mainImg.src = full;
    });
  });

  // Zoom on hover (desktop)
  const mainWrap = document.getElementById('main-image');
  if(mainWrap){
    mainWrap.addEventListener('mousemove', (e) => {
      if(window.innerWidth < 900) return;
      const rect = mainWrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width * 100;
      const y = (e.clientY - rect.top) / rect.height * 100;
      mainImg.style.transformOrigin = `${x}% ${y}%`;
      mainImg.style.transition = 'transform .12s';
      mainImg.style.transform = 'scale(1.9)';
    });
    mainWrap.addEventListener('mouseleave', () => {
      mainImg.style.transform = 'scale(1)';
      mainImg.style.transition = 'transform .2s';
    });
  }
}

/* Add to cart (very simple, localStorage) */
function initAddToCart(){
  const addBtn = document.getElementById('add-to-cart');
  if(!addBtn) return;
  addBtn.addEventListener('click', () => {
    const qty = parseInt(document.getElementById('quantity').value || '1',10);
    const product = {
      id:'p1', title: document.getElementById('product-title').textContent || 'Projecta', price: parseFloat((document.getElementById('product-price') || {}).textContent?.replace('€','') || 129),
      qty
    };
    const cart = JSON.parse(localStorage.getItem('projecta_cart') || '[]');
    cart.push(product);
    localStorage.setItem('projecta_cart', JSON.stringify(cart));
    alert('Produkt zum Warenkorb hinzugefügt (lokal).');
  });
}
