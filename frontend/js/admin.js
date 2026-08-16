let API_BASE = localStorage.getItem("vb_api_base") || window.API_BASE || "https://mutta-bonda.onrender.com/api";

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




async function loadMenu() {
  try {
    const res = await fetch(`${API_BASE}/menu`);
    if (!res.ok) return;
    const items = await res.json();

    document.getElementById("menuBody").innerHTML = items
      .map(
        (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>₹${item.price}</td>
        <td><span class="status-pill">${item.is_available !== false && item.isAvailable !== false ? "Available" : "Disabled"}</span></td>
        <td>
          <button class="btn btn--text btn--sm" data-toggle="${item.id || item._id}" data-state="${item.is_available !== false && item.isAvailable !== false}">Toggle</button>
          <button class="btn btn--text btn--sm" data-delete="${item.id || item._id}" style="color:var(--danger)">Delete</button>
        </td>
      </tr>`
      )
      .join("");

    document.querySelectorAll("[data-toggle]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const newState = btn.dataset.state !== "true";
        await fetch(`${API_BASE}/menu/${btn.dataset.toggle}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ is_available: newState, isAvailable: newState }),
        });
        loadMenu();
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

document.getElementById("menuForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.price = Number(data.price);
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


