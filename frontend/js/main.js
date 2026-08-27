/* =========================================================
   VIJAYKUMAR'S MUTTA BONDA SHOP — Frontend logic
   Sections: data, cart, menu render, forms, animations
   ========================================================= */
const API_BASE =
  localStorage.getItem("vb_api_base") ||
  window.API_BASE ||
  (window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.protocol === "file:"
    ? "http://localhost:5000/api"
    : "https://mutta-bonda.onrender.com/api");

/* ---------------- HELPER FUNCTIONS ---------------- */
function imgUrl(name, width = 80, height = 80) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff6b35&color=fff&size=${width}`;
}

/* ---------------- MENU DATA ---------------- */
const MENU_DATA = [
  { name: "Chicken Mutta Bonda", price: 60, category: "Special Bonda", img: "muttabonda-1", tag: "Signature" },
  { name: "Kaara Bonda", price: 20, category: "Veg Bonda", img: "kaara-bonda" },
  { name: "Keerai Bonda", price: 20, category: "Veg Bonda", img: "keerai-bonda" },
  { name: "Murunga Keerai Bonda", price: 25, category: "Veg Bonda", img: "murunga-bonda" },
  { name: "Thandu Keerai Bonda", price: 25, category: "Veg Bonda", img: "thandu-bonda" },
  { name: "Paneer Bonda", price: 35, category: "Veg Bonda", img: "paneer-bonda" },
  { name: "Cheese Bonda", price: 40, category: "Veg Bonda", img: "cheese-bonda" },
  { name: "Beef Bonda", price: 55, category: "Non-Veg Bonda", img: "beef-bonda" },
  { name: "Mutton Bonda", price: 65, category: "Non-Veg Bonda", img: "mutton-bonda" },
  { name: "Normal Tea", price: 10, category: "Tea", img: "normal-tea" },
  { name: "Ginger Tea", price: 12, category: "Tea", img: "ginger-tea" },
  { name: "Black Tea", price: 10, category: "Tea", img: "black-tea" },
  { name: "Masala Tea", price: 15, category: "Tea", img: "masala-tea" },
  { name: "Green Tea", price: 15, category: "Tea", img: "green-tea" },
  { name: "Filter Coffee", price: 15, category: "Coffee", img: "filter-coffee" },
  { name: "Bru Coffee", price: 15, category: "Coffee", img: "bru-coffee" },
  { name: "Cold Coffee", price: 40, category: "Coffee", img: "cold-coffee" },
  { name: "Boost", price: 20, category: "Coffee", img: "boost" },
  { name: "Horlicks", price: 20, category: "Coffee", img: "horlicks" },
  { name: "Badam Milk", price: 30, category: "Coffee", img: "badam-milk" },
  { name: "Mint Juice", price: 25, category: "Juices", img: "mint-juice" },
  { name: "Lemon Mint", price: 25, category: "Juices", img: "lemon-mint" },
  { name: "Watermelon Juice", price: 30, category: "Juices", img: "watermelon-juice" },
  { name: "Mosambi Juice", price: 30, category: "Juices", img: "mosambi-juice" },
  { name: "Fresh Lime Soda", price: 20, category: "Juices", img: "lime-soda" },
];

let liveMenuData = [...MENU_DATA];

async function fetchMenuFromAPI() {
  try {
    const res = await fetch(`${API_BASE}/menu`);
    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        liveMenuData = items;
        renderMenu();
      }
    }
  } catch (err) {
    console.log("Using offline default menu.");
  }
}

const REVIEWS = [
  { name: "Karthik R.", visits: "Regular, 2 years", stars: 5, text: "The mutta bonda here is the reason I detour on my way home every evening. Consistently hot, consistently good." },
  { name: "Divya S.", visits: "Weekly visitor", stars: 5, text: "Family combo is unbeatable value. Kids ask for it by name now." },
  { name: "Prem Kumar", visits: "First-time customer", stars: 4, text: "Found this place through a friend's recommendation. The ginger tea paired with kaara bonda was perfect for the weather." },
  { name: "Anitha M.", visits: "Regular, 5 years", stars: 5, text: "Been coming here since it was a small cart. Quality has only gone up." },
];

/* ---------------- PRELOADER ---------------- */
window.addEventListener("load", () => {
  const pre = document.getElementById("preloader");
  if (pre) setTimeout(() => pre.classList.add("is-hidden"), 400);
  fetchMenuFromAPI();
});

/* ---------------- CURSOR GLOW ---------------- */
const glow = document.getElementById("cursorGlow");
if (glow && window.matchMedia("(hover:hover)").matches) {
  document.addEventListener("mousemove", (e) => {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  });
}

/* ---------------- NAV ---------------- */
const nav = document.getElementById("siteNav");
if (nav) {
  window.addEventListener("scroll", () => {
    nav.style.boxShadow = window.scrollY > 40 ? "0 10px 30px rgba(0,0,0,.4)" : "none";
  });
}
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
if (hamburger && navLinks) {
  hamburger.addEventListener("click", () => navLinks.classList.toggle("is-open"));
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => navLinks.classList.remove("is-open")));
}

/* ---------------- SCROLL REVEAL ---------------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ---------------- MENU RENDER + FILTER/SEARCH ---------------- */
const menuGrid = document.getElementById("menuGrid");
const menuEmpty = document.getElementById("menuEmpty");
const menuSearch = document.getElementById("menuSearch");
const filterChips = document.getElementById("filterChips");
let activeFilter = "all";

const PRODUCT_IMAGES = {
  "chicken mutta bonda": "assets/images/chicken_mutta_bonda.jpg",
  "kaara bonda": "assets/images/kaara_bonda.jpg",
  "keerai bonda": "assets/images/keerai_bonda.jpg",
  "murunga keerai bonda": "assets/images/keerai_bonda.jpg",
  "thandu keerai bonda": "assets/images/keerai_bonda.jpg",
  "paneer bonda": "assets/images/paneer_bonda.jpg",
  "cheese bonda": "assets/images/cheese_bonda.jpg",
  "beef bonda": "assets/images/mutton_bonda.jpg",
  "mutton bonda": "assets/images/mutton_bonda.jpg",
  "normal tea": "assets/images/ginger_tea.jpg",
  "ginger tea": "assets/images/ginger_tea.jpg",
  "black tea": "assets/images/ginger_tea.jpg",
  "masala tea": "assets/images/ginger_tea.jpg",
  "green tea": "assets/images/lemon_mint.jpg",
  "filter coffee": "assets/images/filter_coffee.jpg",
  "bru coffee": "assets/images/filter_coffee.jpg",
  "cold coffee": "assets/images/badam_milk.jpg",
  "boost": "assets/images/badam_milk.jpg",
  "horlicks": "assets/images/badam_milk.jpg",
  "badam milk": "assets/images/badam_milk.jpg",
  "mint juice": "assets/images/lemon_mint.jpg",
  "lemon mint": "assets/images/lemon_mint.jpg",
  "watermelon juice": "assets/images/watermelon_juice.jpg",
  "mosambi juice": "assets/images/watermelon_juice.jpg",
  "fresh lime soda": "assets/images/lemon_mint.jpg"
};

function getItemImg(item) {
  if (item.image_url) return item.image_url;
  if (item.image) return item.image;
  const nameKey = (item.name || "").toLowerCase().trim();
  if (PRODUCT_IMAGES[nameKey]) return PRODUCT_IMAGES[nameKey];
  return "assets/images/chicken_mutta_bonda.jpg";
}

const CATEGORY_PRIORITY = {
  "Special Bonda": 1,
  "Veg Bonda": 2,
  "Non-Veg Bonda": 3,
  "Tea": 4,
  "Coffee": 5,
  "Juices": 6,
  "Combo": 7
};

function renderMenu() {
  if (!menuGrid) return;
  const query = menuSearch ? menuSearch.value.trim().toLowerCase() : "";
  const items = liveMenuData.filter((item) => {
    if (item.is_available === false || item.isAvailable === false) return false;
    const matchesFilter = activeFilter === "all" || item.category === activeFilter;
    const matchesSearch = item.name.toLowerCase().includes(query) || (item.category && item.category.toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });

  items.sort((a, b) => {
    const pA = CATEGORY_PRIORITY[a.category] || 99;
    const pB = CATEGORY_PRIORITY[b.category] || 99;
    if (pA !== pB) return pA - pB;
    const orderA = a.display_order ?? a.sort_order ?? 0;
    const orderB = b.display_order ?? b.sort_order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return (a.id || 0) - (b.id || 0);
  });

  menuGrid.innerHTML = items
    .map(
      (item) => `
    <article class="menu-card">
      <div class="menu-card__img">
        <img src="${getItemImg(item)}" alt="${item.name}" loading="lazy">
        <span class="menu-card__cat">${item.category}</span>
      </div>
      <div class="menu-card__body">
        <h4>${item.name}</h4>
        <div class="menu-card__row">
          <span class="price">&#8377;${item.price}</span>
          <button class="icon-btn" aria-label="Add ${item.name} to cart"
            data-add-cart data-name="${item.name}" data-price="${item.price}" data-category="${item.category}">+</button>
        </div>
      </div>
    </article>`
    )
    .join("");

  if (menuEmpty) menuEmpty.hidden = items.length !== 0;
}

if (filterChips) {
  filterChips.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    filterChips.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    activeFilter = chip.dataset.filter;
    renderMenu();
  });
}
if (menuSearch) menuSearch.addEventListener("input", renderMenu);
renderMenu();

/* ---------------- GALLERY ---------------- */
const galleryGrid = document.getElementById("galleryGrid");
if (galleryGrid) {
  const galleryImages = [
    "assets/images/chicken_mutta_bonda.jpg",
    "assets/images/kaara_bonda.jpg",
    "assets/images/keerai_bonda.jpg",
    "assets/images/paneer_bonda.jpg",
    "assets/images/cheese_bonda.jpg",
    "assets/images/mutton_bonda.jpg",
    "assets/images/ginger_tea.jpg",
    "assets/images/filter_coffee.jpg"
  ];
  galleryGrid.innerHTML = galleryImages
    .map((src, i) => `<img src="${src}" alt="Shop moment ${i + 1}" loading="lazy" data-lightbox>`)
    .join("");

  galleryGrid.addEventListener("click", (e) => {
    const img = e.target.closest("img");
    if (!img) return;
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:300;cursor:zoom-out;padding:2rem;";
    overlay.innerHTML = `<img src="${img.src}" style="max-width:90vw;max-height:85vh;border-radius:14px;">`;
    overlay.addEventListener("click", () => overlay.remove());
    document.body.appendChild(overlay);
  });
}

/* ---------------- REVIEWS CAROUSEL ---------------- */
const reviewsTrack = document.getElementById("reviewsTrack");
const reviewsDots = document.getElementById("reviewsDots");
if (reviewsTrack && reviewsDots) {
  reviewsTrack.innerHTML = REVIEWS.map(
    (r, i) => `
    <article class="review-card">
      <div class="review-card__stars">${"&#9733;".repeat(r.stars)}${"&#9734;".repeat(5 - r.stars)}</div>
      <p>&ldquo;${r.text}&rdquo;</p>
      <div class="review-card__who">
        <img class="review-card__avatar" src="${imgUrl(r.name, 80, 80)}" alt="${r.name}">
        <div><strong>${r.name}</strong><span>${r.visits}</span></div>
      </div>
    </article>`
  ).join("");
  reviewsDots.innerHTML = REVIEWS.map((_, i) => `<span class="${i === 0 ? "is-active" : ""}"></span>`).join("");

  reviewsTrack.addEventListener("scroll", () => {
    if (!reviewsTrack.firstElementChild) return;
    const cardWidth = reviewsTrack.firstElementChild.offsetWidth + 22;
    const idx = Math.round(reviewsTrack.scrollLeft / cardWidth);
    reviewsDots.querySelectorAll("span").forEach((d, i) => d.classList.toggle("is-active", i === idx));
  });
}

/* ---------------- STAR RATING WIDGET ---------------- */
document.querySelectorAll(".stars").forEach((starGroup) => {
  starGroup.innerHTML = [1, 2, 3, 4, 5].map((n) => `<span class="star" data-value="${n}">&#9733;</span>`).join("");
  let value = 0;
  starGroup.addEventListener("click", (e) => {
    const star = e.target.closest(".star");
    if (!star) return;
    value = Number(star.dataset.value);
    starGroup.dataset.value = value;
    starGroup.querySelectorAll(".star").forEach((s) => s.classList.toggle("is-on", Number(s.dataset.value) <= value));
  });
});

/* ---------------- CART & CHECKOUT ---------------- */
const CART_KEY = "vb_cart";
let cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
let appliedDiscount = 0;

const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const cartItemsEl = document.getElementById("cartItems");
const cartCountEl = document.getElementById("cartCount");
const cartSubtotalEl = document.getElementById("cartSubtotal");
const cartDeliveryEl = document.getElementById("cartDelivery");
const cartTotalEl = document.getElementById("cartTotal");
const discountRow = document.getElementById("discountRow");
const cartDiscountEl = document.getElementById("cartDiscount");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutActionBox = document.getElementById("checkoutActionBox");
const checkoutBtn = document.getElementById("checkoutBtn");
const cancelCheckoutBtn = document.getElementById("cancelCheckoutBtn");

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function openCart() {
  if (cartDrawer) cartDrawer.classList.add("is-open");
  if (cartOverlay) cartOverlay.classList.add("is-open");
}
function closeCart() {
  if (cartDrawer) cartDrawer.classList.remove("is-open");
  if (cartOverlay) cartOverlay.classList.remove("is-open");
  hideCheckoutForm();
}

document.getElementById("cartToggle")?.addEventListener("click", openCart);
document.getElementById("cartClose")?.addEventListener("click", closeCart);
if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

function addToCart(name, price, category) {
  const existing = cart.find((i) => i.name === name);
  if (existing) existing.qty += 1;
  else cart.push({ name, price, category, qty: 1 });
  saveCart();
  renderCart();
  openCart();
}

document.body.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add-cart]");
  if (!btn) return;
  addToCart(btn.dataset.name, Number(btn.dataset.price), btn.dataset.category);
});

function changeQty(name, delta) {
  const item = cart.find((i) => i.name === name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((i) => i.name !== name);
  saveCart();
  renderCart();
}

function removeItem(name) {
  cart = cart.filter((i) => i.name !== name);
  saveCart();
  renderCart();
}

function showCheckoutForm() {
  if (cart.length === 0) {
    alert("Your cart is empty — add something hot from the menu first!");
    return;
  }
  if (checkoutForm && checkoutActionBox) {
    checkoutForm.style.display = "block";
    checkoutActionBox.style.display = "none";
  }
}

function hideCheckoutForm() {
  if (checkoutForm && checkoutActionBox) {
    checkoutForm.style.display = "none";
    checkoutActionBox.style.display = "block";
  }
}

if (checkoutBtn) checkoutBtn.addEventListener("click", showCheckoutForm);
if (cancelCheckoutBtn) cancelCheckoutBtn.addEventListener("click", hideCheckoutForm);

function renderCart() {
  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
  if (cartCountEl) cartCountEl.textContent = totalQty;

  if (!cartItemsEl) return;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<p class="cart-drawer__empty">Your cart is empty — add something hot from the menu.</p>`;
    hideCheckoutForm();
  } else {
    cartItemsEl.innerHTML = cart
      .map(
        (item) => `
      <div class="cart-item">
        <img class="cart-item__img" src="${getItemImg(item)}" alt="${item.name}">
        <div class="cart-item__body">
          <h5>${item.name}</h5>
          <div class="qty-control">
            <button data-qty="-1" data-name="${item.name}">&minus;</button>
            <span>${item.qty}</span>
            <button data-qty="1" data-name="${item.name}">+</button>
          </div>
        </div>
        <div>
          <div class="cart-item__price">&#8377;${item.price * item.qty}</div>
          <button class="cart-item__remove" data-remove="${item.name}">Remove</button>
        </div>
      </div>`
      )
      .join("");
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const delivery = subtotal > 0 && subtotal < 150 ? 20 : 0;
  const discountAmt = Math.round(subtotal * appliedDiscount);
  const total = subtotal + delivery - discountAmt;

  if (cartSubtotalEl) cartSubtotalEl.textContent = `₹${subtotal}`;
  if (cartDeliveryEl) cartDeliveryEl.textContent = delivery ? `₹${delivery}` : "Free";
  if (cartTotalEl) cartTotalEl.textContent = `₹${total}`;
  if (discountRow) discountRow.hidden = discountAmt === 0;
  if (cartDiscountEl) cartDiscountEl.textContent = `−₹${discountAmt}`;
}

if (cartItemsEl) {
  cartItemsEl.addEventListener("click", (e) => {
    const qtyBtn = e.target.closest("[data-qty]");
    if (qtyBtn) changeQty(qtyBtn.dataset.name, Number(qtyBtn.dataset.qty));
    const removeBtn = e.target.closest("[data-remove]");
    if (removeBtn) removeItem(removeBtn.dataset.remove);
  });
}

document.getElementById("applyCoupon")?.addEventListener("click", () => {
  const couponInput = document.getElementById("couponInput");
  const code = couponInput ? couponInput.value.trim().toUpperCase() : "";
  if (code === "BONDA10") {
    appliedDiscount = 0.1;
    alert("🎉 Coupon BONDA10 applied — 10% off your order!");
  } else {
    appliedDiscount = 0;
    alert("⚠️ That coupon code isn't valid. Try BONDA10.");
  }
  renderCart();
});

/* ---------------- MEDIUM-SIZED ORDER CONFIRMED MODAL ---------------- */
const orderModalOverlay = document.getElementById("orderModalOverlay");
const orderModalCloseBtn = document.getElementById("orderModalCloseBtn");
const modalCloseActionBtn = document.getElementById("modalCloseActionBtn");

/**
 * Displays the medium-sized Order Confirmed popup modal with order details.
 */
function openOrderModal(data) {
  const { name, phone, cartItems, total, whatsappMessage } = data;
  
  const nameEl = document.getElementById("modalCustomerName");
  const phoneEl = document.getElementById("modalCustomerPhone");
  const itemsEl = document.getElementById("modalOrderItems");
  const totalEl = document.getElementById("modalOrderTotal");
  const waBtn = document.getElementById("modalWhatsappBtn");

  if (nameEl) nameEl.textContent = name;
  if (phoneEl) phoneEl.textContent = phone;
  if (totalEl) totalEl.textContent = `₹${total}`;
  
  if (itemsEl && Array.isArray(cartItems)) {
    itemsEl.innerHTML = cartItems.map(i => `<div>${i.name} × ${i.qty} (₹${i.price * i.qty})</div>`).join("");
  }

  if (waBtn && whatsappMessage) {
    waBtn.href = `https://wa.me/918610713970?text=${encodeURIComponent(whatsappMessage)}`;
  }

  if (orderModalOverlay) {
    orderModalOverlay.classList.add("is-open");
  }
}

/**
 * Closes the Order Confirmed popup modal.
 */
function closeOrderModal() {
  if (orderModalOverlay) {
    orderModalOverlay.classList.remove("is-open");
  }
}

if (orderModalCloseBtn) orderModalCloseBtn.addEventListener("click", closeOrderModal);
if (modalCloseActionBtn) modalCloseActionBtn.addEventListener("click", closeOrderModal);
if (orderModalOverlay) {
  orderModalOverlay.addEventListener("click", (e) => {
    if (e.target === orderModalOverlay) closeOrderModal();
  });
}

if (checkoutForm) {
  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const name = document.getElementById("checkoutName")?.value.trim();
    const phone = document.getElementById("checkoutPhone")?.value.trim();
    const address = document.getElementById("checkoutAddress")?.value.trim() || "Pickup at shop";
    const payment = document.getElementById("checkoutPayment")?.value || "Cash";

    if (!name || !phone) {
      alert("Please fill in your name and 10-digit phone number.");
      return;
    }

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const delivery = subtotal > 0 && subtotal < 150 ? 20 : 0;
    const discountAmt = Math.round(subtotal * appliedDiscount);
    const total = subtotal + delivery - discountAmt;

    const lines = cart.map((i) => `- ${i.name} x${i.qty} = ₹${i.price * i.qty}`).join("\n");
    const message = `*New Order — Vijaykumar's Mutta Bonda Shop*\n\nName: ${name}\nPhone: ${phone}\n\n${lines}\n\nSubtotal: ₹${subtotal}\nDelivery: ₹${delivery}\nDiscount: ₹${discountAmt}\n*Total: ₹${total}*\n\nAddress: ${address}\nPayment: ${payment}`;

    const payload = {
      customer_name: name,
      customerName: name,
      phone,
      address,
      payment_method: payment,
      paymentMethod: payment,
      items: cart,
      subtotal,
      delivery,
      discount: discountAmt,
      total
    };

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.warn("Order API warning:", errJson.error || errJson.message);
      }
    } catch (err) {
      console.warn("Could not sync order to API server:", err);
    }

    // Trigger Medium Size Order Confirmed Popup Modal
    openOrderModal({
      name,
      phone,
      cartItems: [...cart],
      total,
      whatsappMessage: message
    });

    // Reset Cart & Close Drawer
    cart = [];
    appliedDiscount = 0;
    saveCart();
    renderCart();
    closeCart();
  });
}

renderCart();


/* ---------------- FEEDBACK FORM ---------------- */
document.getElementById("feedbackForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  data.ratings = {};
  form.querySelectorAll(".stars").forEach((s) => (data.ratings[s.dataset.field] = Number(s.dataset.value || 0)));

  try {
    await fetch(`${API_BASE}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.warn("Feedback API unreachable — recorded.", err);
  }

  const successEl = document.getElementById("feedbackSuccess");
  if (successEl) successEl.hidden = false;
  form.reset();
  form.querySelectorAll(".stars").forEach((s) => {
    s.dataset.value = 0;
    s.querySelectorAll(".star").forEach((star) => star.classList.remove("is-on"));
  });
});

/* ---------------- CONTACT FORM ---------------- */
document.getElementById("contactForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());

  try {
    await fetch(`${API_BASE}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.warn("Contact API unreachable.", err);
  }

  const successEl = document.getElementById("contactSuccess");
  if (successEl) successEl.hidden = false;
  form.reset();
});

/* ---------------- FOOTER YEAR ---------------- */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
