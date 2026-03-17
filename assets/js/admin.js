const adminStatus = document.getElementById("admin-status");
const refreshButton = document.getElementById("refresh-orders-btn");
const tableBody = document.getElementById("orders-table-body");

const LOCAL_ORDER_STORAGE_KEY = "chuff-diner-demo-orders";

let apiAvailable = null;

function formatCurrency(amount) {
  return `R${Number(amount).toFixed(2)}`;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function updateStatus(message, type = "info") {
  adminStatus.className = `alert alert-${type}`;
  adminStatus.textContent = message;
}

function getStoredOrders() {
  try {
    const rawOrders = window.localStorage.getItem(LOCAL_ORDER_STORAGE_KEY);
    return rawOrders ? JSON.parse(rawOrders) : [];
  } catch (_error) {
    return [];
  }
}

async function requestJson(path) {
  if (apiAvailable === false) {
    throw new Error("API unavailable");
  }

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request failed for ${path}`);
  }

  apiAvailable = true;
  return response.json();
}

function renderOrders(orders) {
  tableBody.innerHTML = "";

  if (orders.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="6" class="text-center">No orders yet.</td>';
    tableBody.appendChild(row);
    return;
  }

  orders.forEach((order) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${order.id}</td>
      <td>${order.customerName}</td>
      <td>${order.itemName}</td>
      <td>${order.quantity}</td>
      <td>${formatCurrency(order.total)}</td>
      <td>${formatDate(order.createdAt)}</td>
    `;
    tableBody.appendChild(row);
  });
}

async function loadOrders() {
  updateStatus("Loading orders...", "info");

  try {
    const orders = apiAvailable === false ? getStoredOrders() : await requestJson("/api/orders");
    renderOrders(orders);
    if (apiAvailable === false) {
      updateStatus(`Loaded ${orders.length} demo order(s) from this browser.`, "warning");
      return;
    }
    updateStatus(`Loaded ${orders.length} order(s).`, "success");
  } catch (_error) {
    apiAvailable = false;
    const orders = getStoredOrders();
    renderOrders(orders);
    updateStatus(
      `Backend API is unavailable here. Loaded ${orders.length} demo order(s) from this browser instead.`,
      "warning"
    );
  }
}

refreshButton.addEventListener("click", loadOrders);

loadOrders();
