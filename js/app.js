/* app.js
   Funcionalidad compartida: productos, carrito (localStorage), registro/login (localStorage),
   manipulación DOM para index, detalle, carrito, perfil, registro y login.
*/

/* ---------- Datos de productos (6 productos ) ---------- */
const products = [
  {
    id: 'p1',
    name: 'Classic Juice 60ml',
    price: 12.99,
    image: 'assets/images/classic-juice.png',
    description: 'E-liquid con sabor clásico. Nicotine-free disponible.',
    stock: 25
  },
  {
    id: 'p2',
    name: 'Mint Boost 30ml',
    price: 9.5,
    image: 'assets/images/mint-boost.jpg',
    description: 'Toque mentolado refrescante. Ideal para pod systems.',
    stock: 18
  },
  {
    id: 'p3',
    name: 'Shorty Mod (2000mAh)',
    price: 59.99,
    image: 'assets/images/shorty-mod.jpg',
    description: 'Dispositivo compacto con puerto USB-C.',
    stock: 7
  },
  {
    id: 'p4',
    name: 'Lost Angel – Pro Max',
    price: 34.0,
    image: 'assets/images/stealth-pod.jpg',
    description: 'Vaper descartable de alto rendimiento, con sabor intenso y larga duración..',
    stock: 12
  },
  {
    id: 'p5',
    name: 'Nic Salts 20mg',
    price: 11.5,
    image: 'assets/images/nic-salts.jpg',
    description: 'Sales de nicotina para uso en pod devices.',
    stock: 30
  },
  {
    id: 'p6',
    name: 'Vape Ignite',
    price: 41,
    image: 'assets/images/vape-accessory.jpg',
    description: 'Pod descartable potente, con excelente autonomía y sabor a tabaco bien equilibrado.',
    stock: 18
  }
];

/* ---------- Utilidades de storage ---------- */
const storage = {
  getCart() {
    return JSON.parse(localStorage.getItem('vapestore_cart') || '[]');
  },
  setCart(cart) {
    localStorage.setItem('vapestore_cart', JSON.stringify(cart));
    updateCartCount();
  },
  getUsers() {
    return JSON.parse(localStorage.getItem('vapestore_users') || '[]');
  },
  setUsers(users) {
    localStorage.setItem('vapestore_users', JSON.stringify(users));
  },
  getCurrentUser(){
    return JSON.parse(localStorage.getItem('vapestore_current_user') || 'null');
  },
  setCurrentUser(user){
    localStorage.setItem('vapestore_current_user', JSON.stringify(user));
  },
  logout(){
    localStorage.removeItem('vapestore_current_user');
  }
};

/* ---------- Carrito: agregar, actualizar, remover ---------- */
function addToCart(productId, qty = 1) {
  const prod = products.find(p => p.id === productId);
  if(!prod) return alert('Producto no encontrado');

  let cart = storage.getCart();
  const idx = cart.findIndex(i => i.id === productId);
  if (idx >= 0) {
    cart[idx].qty += qty;
    if (cart[idx].qty > prod.stock) cart[idx].qty = prod.stock;
  } else {
    cart.push({ id: productId, qty: Math.min(qty, prod.stock) });
  }
  storage.setCart(cart);
  showToast('Producto añadido al carrito');
}

/* Quitar item */
function removeFromCart(productId) {
  let cart = storage.getCart().filter(i => i.id !== productId);
  storage.setCart(cart);
  renderCartPage();
}

/* Cambiar cantidad */
function updateCartQty(productId, qty) {
  let cart = storage.getCart();
  const idx = cart.findIndex(i => i.id === productId);
  if (idx < 0) return;
  cart[idx].qty = Math.max(1, qty);
  const prod = products.find(p => p.id === productId);
  if (prod && cart[idx].qty > prod.stock) cart[idx].qty = prod.stock;
  storage.setCart(cart);
  renderCartPage();
}

/* Mostrar cuenta del carrito en cabecera */
function updateCartCount() {
  const cart = storage.getCart();
  const count = cart.reduce((s,i) => s + i.qty, 0);
  document.querySelectorAll('#cart-count').forEach(el => el.textContent = count);
}

/* ---------- Index: render productos y carrusel ---------- */
function renderIndexProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='assets/images/placeholder.png'"/>
      <h3>${p.name}</h3>
      <p class="price">$${p.price.toFixed(2)}</p>
      <p class="desc">${p.description}</p>
      <div class="actions">
        <a class="btn ghost" href="detalle.html?id=${p.id}">Ver detalle</a>
        <button class="btn primary" data-add="${p.id}">Agregar</button>
      </div>`;
    grid.appendChild(card);
  });

  // Botones "Agregar"
  grid.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-add');
      addToCart(id, 1);
    });
  });
}

/* Carrusel simple */
function renderCarousel() {
  const c = document.getElementById('carousel');
  if (!c) return;
  c.innerHTML = '';
  products.slice(0,3).forEach(p => {
    const el = document.createElement('div');
    el.className = 'carousel-item';
    el.style.background = `linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${p.image}) center/cover no-repeat`;
    el.style.height = '220px';
    el.style.borderRadius = '12px';
    el.innerHTML = `<div style="padding:18px"><h3 style="color:var(--accent)">${p.name}</h3><p>${p.description}</p></div>`;
    c.appendChild(el);
  });
}

/* ---------- Carrito page render ---------- */
function renderCartPage() {
  const cartList = document.getElementById('cart-list');
  const cartEmpty = document.getElementById('cart-empty');
  const cartSummary = document.getElementById('cart-summary');
  const cartTotalEl = document.getElementById('cart-total');

  if (!cartList) return;

  const cart = storage.getCart();
  if (cart.length === 0) {
    cartList.innerHTML = '';
    cartEmpty.style.display = 'block';
    cartSummary.hidden = true;
    return;
  }
  cartEmpty.style.display = 'none';
  cartSummary.hidden = false;

  cartList.innerHTML = '';
  let total = 0;
  cart.forEach(item => {
    const prod = products.find(p => p.id === item.id);
    if (!prod) return;
    const lineTotal = prod.price * item.qty;
    total += lineTotal;

    const div = document.createElement('div'); div.className = 'cart-item';
    div.innerHTML = `
      <img src="${prod.image}" alt="${prod.name}" onerror="this.src='assets/images/placeholder.png'"/>
      <div style="flex:1">
        <h4 style="margin:0;color:var(--accent)">${prod.name}</h4>
        <p style="margin:6px 0">$${prod.price.toFixed(2)} x <span class="item-qty">${item.qty}</span> = $${lineTotal.toFixed(2)}</p>
        <div class="qty-controls">
          <button class="btn ghost btn-decrease" data-id="${prod.id}">-</button>
          <input type="number" min="1" max="${prod.stock}" value="${item.qty}" class="qty-input" data-id="${prod.id}" style="width:60px;padding:6px;border-radius:6px;background:#000;color:var(--text)"/>
          <button class="btn ghost btn-increase" data-id="${prod.id}">+</button>
          <button class="btn" style="margin-left:12px" data-remove="${prod.id}">Eliminar</button>
        </div>
      </div>
    `;
    cartList.appendChild(div);
  });

  cartTotalEl.textContent = total.toFixed(2);

  // listeners
  cartList.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      removeFromCart(e.currentTarget.getAttribute('data-remove'));
    });
  });
  cartList.querySelectorAll('.btn-decrease').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const id = e.currentTarget.getAttribute('data-id');
      const current = storage.getCart().find(i=>i.id===id);
      if(current) updateCartQty(id, Math.max(1,current.qty-1));
    });
  });
  cartList.querySelectorAll('.btn-increase').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const id = e.currentTarget.getAttribute('data-id');
      const current = storage.getCart().find(i=>i.id===id);
      if(current) updateCartQty(id, Math.min(current.qty+1, (products.find(p=>p.id===id)||{stock:99}).stock));
    });
  });
  cartList.querySelectorAll('.qty-input').forEach(input=>{
    input.addEventListener('change', e=>{
      const id = e.currentTarget.getAttribute('data-id');
      let v = parseInt(e.currentTarget.value) || 1;
      updateCartQty(id, v);
    });
  });
}

/* Checkout (simulado) */
function setupCheckout() {
  const btn = document.getElementById('checkout-btn');
  if (!btn) return;
  btn.addEventListener('click', ()=>{
    const user = storage.getCurrentUser();
    if(!user){
      if(confirm('Necesitás iniciar sesión para finalizar la compra. Ir a iniciar sesión?')){
        window.location.href = 'login.html';
      }
      return;
    }
    // Simulación de compra: vaciamos carrito y guardamos un registro simple
    const cart = storage.getCart();
    if(cart.length === 0) return alert('El carrito está vacío.');
    // Guardar en usuario (orders)
    const users = storage.getUsers();
    const uidx = users.findIndex(u => u.email === user.email);
    if(uidx >= 0){
      users[uidx].orders = users[uidx].orders || [];
      users[uidx].orders.push({ date: new Date().toISOString(), items: cart });
      storage.setUsers(users);
    }
    storage.setCart([]);
    alert('Compra finalizada. Gracias por tu compra!');
    renderCartPage();
    window.location.href = 'perfil.html';
  });
}

/* ---------- Registro y login (validación simple) ---------- */
function setupRegisterForm() {
  const form = document.getElementById('register-form');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    if(!fullname || !email || !password) return alert('Completá todos los campos');

    const users = storage.getUsers();
    if(users.find(u=>u.email===email)) return alert('Ya existe un usuario con ese correo');
    users.push({ fullname, email, password, orders: [] });
    storage.setUsers(users);
    storage.setCurrentUser({ fullname, email });
    alert('Registro exitoso. Sesión iniciada.');
    window.location.href = 'index.html';
  });
}

function setupLoginForm() {
  const form = document.getElementById('login-form');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const users = storage.getUsers();
    const user = users.find(u=>u.email===email && u.password===password);
    if(!user) return alert('Credenciales inválidas');
    storage.setCurrentUser({ fullname: user.fullname, email: user.email });
    alert('Sesión iniciada');
    window.location.href = 'index.html';
  });
}

/* Perfil */
function renderProfilePage() {
  const el = document.getElementById('profile-info');
  if(!el) return;
  const user = storage.getCurrentUser();
  if(!user){
    el.innerHTML = `<p>No hay usuario logueado. <a href="login.html">Iniciá sesión</a></p>`;
    return;
  }
  const users = storage.getUsers();
  const dbUser = users.find(u=>u.email===user.email) || {};
  el.innerHTML = `
    <p><strong>Nombre:</strong> ${user.fullname}</p>
    <p><strong>Correo:</strong> ${user.email}</p>
  `;
  const ordersEl = document.getElementById('profile-orders');
  if(ordersEl){
    ordersEl.innerHTML = '';
    const orders = dbUser.orders || [];
    if(orders.length === 0){
      ordersEl.innerHTML = '<p>No hay compras registradas.</p>';
    } else {
      orders.forEach(o=>{
        const div = document.createElement('div');
        div.style.background='#0b0b0b';
        div.style.padding='12px'; div.style.borderRadius='10px'; div.style.marginBottom='8px';
        div.innerHTML = `<p><strong>Fecha:</strong> ${new Date(o.date).toLocaleString()}</p>
          <ul>${o.items.map(it=>{
            const prod = products.find(p=>p.id===it.id);
            return `<li>${prod ? prod.name : it.id} x ${it.qty}</li>`;
          }).join('')}</ul>`;
        ordersEl.appendChild(div);
      });
    }
  }
}

/* Logout */
function setupLogout() {
  const btn = document.getElementById('logout-btn');
  if (!btn) return;
  btn.addEventListener('click', ()=>{
    storage.logout();
    alert('Sesión cerrada');
    window.location.href = 'index.html';
  });
}

/* ---------- Detalle de producto ---------- */
function renderProductDetail() {
  const container = document.getElementById('product-detail');
  if(!container) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if(!id){
    container.innerHTML = '<p>Producto no especificado</p>';
    return;
  }
  const p = products.find(x=>x.id===id);
  if(!p){ container.innerHTML = '<p>Producto no encontrado</p>'; return; }
  container.innerHTML = `
    <div class="detail-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
      <div>
        <img src="${p.image}" alt="${p.name}" style="width:100%;max-height:420px;object-fit:cover;border-radius:12px" onerror="this.src='assets/images/placeholder.png'"/>
      </div>
      <div>
        <h1 style="color:var(--accent)">${p.name}</h1>
        <p class="price">$${p.price.toFixed(2)}</p>
        <p>${p.description}</p>
        <p><strong>Stock:</strong> ${p.stock}</p>
        <div style="margin-top:12px;">
          <input id="detail-qty" type="number" min="1" max="${p.stock}" value="1" style="width:80px;padding:8px;border-radius:8px;background:transparent;color:var(--text)"/>
          <button id="detail-add" class="btn primary">Agregar al carrito</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('detail-add').addEventListener('click', ()=>{
    const q = parseInt(document.getElementById('detail-qty').value) || 1;
    addToCart(p.id, q);
  });
}

/* ---------- Small toast for UX ---------- */
function showToast(msg){
  // simple alert-like but nicer
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.position='fixed';
  t.style.bottom='18px';
  t.style.left='50%';
  t.style.transform='translateX(-50%)';
  t.style.background='var(--accent)';
  t.style.color='#000';
  t.style.padding='10px 14px';
  t.style.borderRadius='10px';
  t.style.zIndex=9999;
  document.body.appendChild(t);
  setTimeout(()=> t.style.opacity='0',1700);
  setTimeout(()=> t.remove(),2200);
}

/* ---------- Inicialización según página ---------- */
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();

  // Index
  renderIndexProducts();
  renderCarousel();

  // Generic: if carrito page present
  renderCartPage();
  setupCheckout();

  // Auth
  setupRegisterForm();
  setupLoginForm();
  renderProfilePage();
  setupLogout();

  // Detail
  renderProductDetail();

  // Update header nav links visibility según sesión
  const current = storage.getCurrentUser();
  if(current){
    document.getElementById('nav-login-link')?.setAttribute('hidden', 'true');
    document.getElementById('nav-register-link')?.setAttribute('hidden', 'true');
    const profileLink = document.getElementById('nav-profile-link');
    if(profileLink){ profileLink.removeAttribute('hidden'); profileLink.href='perfil.html'; }
  }
});
