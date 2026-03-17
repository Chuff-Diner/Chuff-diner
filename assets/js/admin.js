const adminStatus = document.getElementById("admin-status");
const refreshButton = document.getElementById("refresh-orders-btn");
const tableBody = document.getElementById("orders-table-body");

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
    const response = await fetch("/api/orders");
    if (!response.ok) {
      throw new Error("Failed to load orders");
    }

    const orders = await response.json();
    renderOrders(orders);
    updateStatus(`Loaded ${orders.length} order(s).`, "success");
  } catch (error) {
    updateStatus(error.message, "danger");
  }
}

refreshButton.addEventListener("click", loadOrders);

loadOrders();
