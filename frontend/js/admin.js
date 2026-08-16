let API_BASE =
  localStorage.getItem("vb_api_base") ||
  window.API_BASE ||
  (window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.protocol === "file:"
    ? "http://localhost:5000/api"
    : "https://mutta-bonda.onrender.com/api");

const TOKEN_KEY = "vb_admin_token";

const loginView = document.getElementById("loginView");
const dashView = document.getElementById("dashView");

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function authHeaders() {
  return { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" };
}

function promptForApiBase() {
  const current = localStorage.getItem("vb_api_base") || window.API_BASE || "";
  const input = prompt("Enter your Render Backend API URL (e.g., https://mutta-bonda-shop-api.onrender.com/api):", current);
  if (input && input.trim()) {
    let url = input.trim().replace(/\/$/, "");
    if (!url.endsWith("/api")) url += "/api";
    localStorage.setItem("vb_api_base", url);
    window.location.reload();
  }
}

async function init() {
  if (getToken()) {
    loginView.style.display = "none";
    dashView.style.display = "block";
    await loadDashboard();
  }
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const errorEl = document.getElementById("loginError");
  errorEl.hidden = true;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || "Login failed.");

    localStorage.setItem(TOKEN_KEY, body.token);
    loginView.style.display = "none";
    dashView.style.display = "block";
    await loadDashboard();
  } catch (err) {
    if (err.message.includes("Failed to fetch") || err.name === "TypeError") {
      errorEl.innerHTML = `Cannot connect to API at <code style="word-break:break-all">${API_BASE}</code>.<br><br><button type="button" id="changeApiBtn" class="btn btn--secondary btn--sm" style="margin-top:0.4rem;">Set Deployed Render API URL</button>`;
      errorEl.hidden = false;
      document.getElementById("changeApiBtn")?.addEventListener("click", () => {
        promptForApiBase();
      });
    } else {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  location.reload();
});

async function loadDashboard() {
  await Promise.all([loadStats(), loadOrders(), loadMenu(), loadFeedback()]);
}


async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/orders/stats`, { headers: authHeaders() });
    if (!res.ok) return;
    const stats = await res.json();
    document.getElementById("statsGrid").innerHTML = `
      <div class="stat"><span>Today's Sales</span><strong>₹${stats.dailySales || 0}</strong></div>
      <div class="stat"><span>Today's Orders</span><strong>${stats.dailyOrderCount || 0}</strong></div>
      <div class="stat"><span>Monthly Sales</span><strong>₹${stats.monthlySales || 0}</strong></div>
      <div class="stat"><span>Total Revenue</span><strong>₹${stats.totalRevenue || 0}</strong></div>
      <div class="stat"><span>Top Seller</span><strong>${stats.topSellingItem ? stats.topSellingItem.name : "—"}</strong></div>
    `;
  } catch (err) {
    console.error("Stats error:", err);
  }
}

async function loadOrders() {
  const bodyEl = document.getElementById("ordersBody");
  try {
    const res = await fetch(`${API_BASE}/orders`, { headers: authHeaders() });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn("Load orders non-OK:", res.status, errData);
      if (res.status === 401) {
        bodyEl.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger);padding:1.5rem;">Session expired or invalid token.<br><br><button type="button" class="btn btn--primary btn--sm" onclick="localStorage.removeItem('vb_admin_token');location.reload();">Log In Again</button></td></tr>`;
      } else {
        bodyEl.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger);padding:1.5rem;">Could not load orders: ${errData.error || errData.message || res.statusText}</td></tr>`;
      }
      return;
    }
    const orders = await res.json();
    const statuses = ["Pending", "Accepted", "Preparing", "Delivered", "Rejected"];

    if (!Array.isArray(orders) || orders.length === 0) {
      bodyEl.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--cream-dim);padding:1.5rem;">No orders placed yet. Place an order on the site to test!</td></tr>`;
      return;
    }

    bodyEl.innerHTML = orders
      .slice(0, 50)
      .map((o) => {
        let itemsArr = [];
        try {
          itemsArr = Array.isArray(o.items)
            ? o.items
            : (typeof o.items === "string" ? JSON.parse(o.items) : []);
        } catch (e) {
          itemsArr = [];
        }
        const itemsStr = itemsArr.map((i) => `${i.name || "Item"} x${i.qty || i.quantity || 1}`).join(", ") || "Order Items";
        const orderId = o.id || o._id || "";
        const custName = o.customer_name || o.customerName || "Customer";
        const custPhone = o.phone || "";
        const orderTotal = o.total || 0;
        const dateStr = new Date(o.created_at || o.createdAt || Date.now()).toLocaleString();

        return `
      <tr>
        <td>${custName}<br><small style="color:var(--cream-dim)">${custPhone}</small></td>
        <td>${itemsStr}</td>
        <td>₹${orderTotal}</td>
        <td>
          <select data-order="${orderId}">
            ${statuses.map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </td>
        <td>${dateStr}</td>
        <td>
          <button class="btn btn--text btn--sm" data-delete-order="${orderId}" style="color:var(--danger)">Delete</button>
        </td>
      </tr>`;
      })
      .join("");

    document.querySelectorAll("[data-order]").forEach((sel) => {
      sel.addEventListener("change", async () => {
        await fetch(`${API_BASE}/orders/${sel.dataset.order}/status`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ status: sel.value }),
        });
        loadStats();
      });
    });

    document.querySelectorAll("[data-delete-order]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this order?")) return;
        await fetch(`${API_BASE}/orders/${btn.dataset.deleteOrder}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        loadOrders();
        loadStats();
      });
    });
  } catch (err) {
    console.error("Load orders error:", err);
    bodyEl.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--danger);padding:1.5rem;">Connection error: ${err.message}</td></tr>`;
  }
}

document.getElementById("clearOrdersBtn")?.addEventListener("click", async () => {
  if (!confirm("Are you sure you want to CLEAR ALL orders from the database? This cannot be undone.")) return;
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) {
      alert("All orders have been cleared successfully.");
      loadDashboard();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(`Could not clear orders: ${err.message || res.statusText}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
});




let loadedMenuItems = [];

function getItemImg(item) {
  if (item.image_url) return item.image_url;
  if (item.image) return item.image;
  return "assets/images/chicken_mutta_bonda.jpg";
}

async function loadMenu() {
  try {
    const res = await fetch(`${API_BASE}/menu`);
    if (!res.ok) return;
    loadedMenuItems = await res.json();

    document.getElementById("menuBody").innerHTML = loadedMenuItems
      .map(
        (item) => {
          const isAvail = item.is_available !== false && item.is_available !== "false" && item.isAvailable !== false && item.isAvailable !== "false";
          const itemId = item.id || item._id;
          return `
      <tr>
        <td><img src="${getItemImg(item)}" alt="${item.name}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;background:var(--charcoal-3);" onerror="this.src='assets/images/chicken_mutta_bonda.jpg'"></td>
        <td><strong>${item.name}</strong></td>
        <td>${item.category}</td>
        <td>₹${item.price}</td>
        <td>
          <input type="number" class="order-input" data-order-id="${itemId}" value="${item.display_order ?? item.sort_order ?? 0}" style="width:54px;padding:0.25rem 0.4rem;font-size:0.8rem;background:var(--charcoal-3);border:1px solid rgba(200,151,63,.25);color:var(--cream);border-radius:4px;" title="Change display order">
        </td>
        <td>
          <span class="status-pill ${isAvail ? 'status-pill--active' : 'status-pill--disabled'}">
            ${isAvail ? '🟢 Available' : '🔴 Disabled'}
          </span>
        </td>
        <td style="white-space:nowrap;">
          <button class="btn btn--text btn--sm" data-edit="${itemId}">Edit</button>
          <button class="btn btn--text btn--sm" data-toggle="${itemId}">Toggle Status</button>
          <button class="btn btn--text btn--sm" data-delete="${itemId}" style="color:var(--danger)">Delete</button>
        </td>
      </tr>`;
        }
      )
      .join("");

    document.querySelectorAll(".order-input").forEach((input) => {
      input.addEventListener("change", async () => {
        const id = input.dataset.orderId;
        const newOrder = Number(input.value);
        await fetch(`${API_BASE}/menu/${id}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ display_order: newOrder, sort_order: newOrder }),
        });
      });
    });

    document.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.edit;
        const item = loadedMenuItems.find((i) => (i.id || i._id) == id);
        if (!item) return;

        document.getElementById("editId").value = id;
        document.getElementById("editName").value = item.name || "";
        document.getElementById("editPrice").value = item.price || 0;
        document.getElementById("editCategory").value = item.category || "Special Bonda";
        const imgVal = item.image_url || item.image || "assets/images/chicken_mutta_bonda.jpg";
        document.getElementById("editImageUrl").value = imgVal;
        document.getElementById("editImgPreview").src = imgVal;
        document.getElementById("editDisplayOrder").value = item.display_order ?? item.sort_order ?? 0;
        
        const modal = document.getElementById("editModal");
        if (modal) modal.style.display = "flex";
      });
    });

    document.querySelectorAll("[data-toggle]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.toggle;
        const item = loadedMenuItems.find((i) => (i.id || i._id) == id);
        const currentAvail = item ? (item.is_available !== false && item.is_available !== "false" && item.isAvailable !== false && item.isAvailable !== "false") : true;
        const nextAvail = !currentAvail;

        btn.disabled = true;
        btn.textContent = "Updating...";

        try {
          const res = await fetch(`${API_BASE}/menu/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ is_available: nextAvail, isAvailable: nextAvail }),
          });
          if (res.ok) {
            await loadMenu();
          } else {
            alert("Could not update item status.");
            btn.disabled = false;
            btn.textContent = "Toggle Status";
          }
        } catch (e) {
          alert(`Toggle error: ${e.message}`);
          btn.disabled = false;
          btn.textContent = "Toggle Status";
        }
      });
    });

    document.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this menu item?")) return;
        await fetch(`${API_BASE}/menu/${btn.dataset.delete}`, { method: "DELETE", headers: authHeaders() });
        loadMenu();
      });
    });
  } catch (err) {
    console.error("Load menu error:", err);
  }
}

function compressImage(file, maxDimension = 600, quality = 0.75) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function bindImagePickers(gallerySelectId, fileInputId, textInputId, previewImgId) {
  const gallerySel = document.getElementById(gallerySelectId);
  const fileInp = document.getElementById(fileInputId);
  const textInp = document.getElementById(textInputId);
  const prevImg = document.getElementById(previewImgId);

  if (gallerySel && textInp && prevImg) {
    gallerySel.addEventListener("change", () => {
      if (gallerySel.value) {
        textInp.value = gallerySel.value;
        prevImg.src = gallerySel.value;
      }
    });
  }

  if (fileInp && textInp && prevImg) {
    fileInp.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const compressedDataUrl = await compressImage(file);
        textInp.value = compressedDataUrl;
        prevImg.src = compressedDataUrl;
      } catch (err) {
        console.warn("Image compression fallback:", err);
      }
    });
  }

  if (textInp && prevImg) {
    textInp.addEventListener("input", () => {
      if (textInp.value.trim()) {
        prevImg.src = textInp.value.trim();
      }
    });
  }
}

bindImagePickers("addGallerySelect", "addFileInput", "addImageUrlInput", "addImgPreview");
bindImagePickers("editGallerySelect", "editFileInput", "editImageUrl", "editImgPreview");

document.getElementById("closeEditModalBtn")?.addEventListener("click", () => {
  const modal = document.getElementById("editModal");
  if (modal) modal.style.display = "none";
});

document.getElementById("editForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("editId").value;
  const payload = {
    name: document.getElementById("editName").value.trim(),
    price: Number(document.getElementById("editPrice").value),
    category: document.getElementById("editCategory").value,
    image_url: document.getElementById("editImageUrl").value.trim(),
    display_order: Number(document.getElementById("editDisplayOrder").value),
    sort_order: Number(document.getElementById("editDisplayOrder").value),
  };

  try {
    const res = await fetch(`${API_BASE}/menu/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      document.getElementById("editModal").style.display = "none";
      loadMenu();
    } else {
      const errData = await res.json().catch(() => ({}));
      alert(`Could not update menu item: ${errData.message || res.statusText}`);
    }
  } catch (err) {
    alert(`Error updating item: ${err.message}`);
  }
});

document.getElementById("menuForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.price = Number(data.price);
  data.display_order = Number(data.display_order || 0);
  data.sort_order = data.display_order;
  await fetch(`${API_BASE}/menu`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  e.target.reset();
  loadMenu();
});

async function loadFeedback() {
  const bodyEl = document.getElementById("feedbackBody");
  if (!bodyEl) return;
  try {
    const res = await fetch(`${API_BASE}/feedback`, { headers: authHeaders() });
    if (!res.ok) {
      bodyEl.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger);padding:1.5rem;">Could not load customer feedback.</td></tr>`;
      return;
    }
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) {
      bodyEl.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--cream-dim);padding:1.5rem;">No customer feedback submitted yet.</td></tr>`;
      return;
    }

    bodyEl.innerHTML = items
      .map((f) => {
        let ratingsStr = "—";
        if (f.ratings && typeof f.ratings === "object") {
          ratingsStr = Object.entries(f.ratings).map(([k, v]) => `${k}: ${v}★`).join(", ");
        }
        return `
      <tr>
        <td><strong>${f.name || "Anonymous"}</strong><br><small style="color:var(--cream-dim)">${f.phone || ""}</small></td>
        <td>${f.visit_date || f.visitDate || "—"}</td>
        <td><span class="status-pill">${f.food_quality || f.foodQuality || "Good"}</span></td>
        <td>${ratingsStr}</td>
        <td>${f.suggestions || f.favourite_item || "No suggestions"}</td>
      </tr>`;
      })
      .join("");
  } catch (err) {
    console.error("Load feedback error:", err);
  }
}

init();


