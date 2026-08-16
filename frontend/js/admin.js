let API_BASE = localStorage.getItem("vb_api_base") || window.API_BASE || "http://localhost:5000/api";
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
  await Promise.all([loadStats(), loadOrders(), loadMenu()]);
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
  try {
    const res = await fetch(`${API_BASE}/orders`, { headers: authHeaders() });
    if (!res.ok) return;
    const orders = await res.json();
    const statuses = ["Pending", "Accepted", "Preparing", "Delivered", "Rejected"];

    document.getElementById("ordersBody").innerHTML = orders
      .slice(0, 30)
      .map(
        (o) => `
      <tr>
        <td>${o.customer_name || o.customerName || "Customer"}<br><small style="color:var(--cream-dim)">${o.phone || ""}</small></td>
        <td>${(o.items || []).map((i) => `${i.name} x${i.qty || i.quantity || 1}`).join(", ")}</td>
        <td>₹${o.total}</td>
        <td>
          <select data-order="${o.id || o._id}">
            ${statuses.map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </td>
        <td>${new Date(o.created_at || o.createdAt || Date.now()).toLocaleString()}</td>
      </tr>`
      )
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
  } catch (err) {
    console.error("Load orders error:", err);
  }
}

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

init();

