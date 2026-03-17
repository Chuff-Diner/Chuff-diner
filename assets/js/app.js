const statusAlert = document.getElementById("status-alert");
const orderButtons = document.querySelectorAll("[data-order-item]");
const viewDinersButton = document.getElementById("view-diners-btn");
const dinersList = document.getElementById("diners-list");
const totalOrdersCount = document.getElementById("total-orders-count");
const menuItemSelect = document.getElementById("menu-item-select");
const checkoutForm = document.getElementById("checkout-form");
const customerNameInput = document.getElementById("customer-name");
const quantityInput = document.getElementById("order-quantity");

const checkoutModal = new bootstrap.Modal(document.getElementById("checkoutModal"));

let cachedMenu = [];

function showStatus(message, type = "success") {
  statusAlert.className = `alert alert-${type}`;
  statusAlert.textContent = message;
  statusAlert.classList.remove("d-none");
}

function formatCurrency(value) {
  return `R${Number(value).toFixed(2)}`;
}

async function loadMenuPricing() {
  try {
    const response = await fetch("/api/menu");
    if (!response.ok) {
      throw new Error("Failed to load menu");
    }

    const menu = await response.json();
    cachedMenu = menu;

    menuItemSelect.innerHTML = "";

    menu.forEach((item) => {
      const priceElement = document.getElementById(`price-${item.id}`);
      if (priceElement) {
        priceElement.textContent = formatCurrency(item.price);
      }

      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = `${item.name} (${formatCurrency(item.price)})`;
      menuItemSelect.appendChild(option);
    });
  } catch (error) {
    showStatus("Could not load latest menu prices.", "warning");
  }
}

async function refreshOrderCount() {
  try {
    const response = await fetch("/api/orders");
    if (!response.ok) {
      throw new Error("Failed to load order count");
    }

    const orders = await response.json();
    totalOrdersCount.textContent = String(orders.length);
  } catch (_error) {
    totalOrdersCount.textContent = "-";
  }
}

function openCheckoutModal(defaultItemId) {
  if (!cachedMenu.some((item) => item.id === defaultItemId) && cachedMenu.length > 0) {
    menuItemSelect.value = cachedMenu[0].id;
  } else {
    menuItemSelect.value = defaultItemId;
  }

  if (!customerNameInput.value.trim()) {
    customerNameInput.value = "Web Customer";
  }
  quantityInput.value = "1";

  checkoutModal.show();
}

async function submitOrder({ itemId, quantity, customerName }) {
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        itemId,
        quantity,
        customerName
      })
    });

    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Order failed");
    }

    const order = await response.json();
    showStatus(
      `Order #${order.id} placed: ${order.quantity}x ${order.itemName} (${formatCurrency(order.total)})`
    );
    checkoutModal.hide();
    await refreshOrderCount();
  } catch (error) {
    showStatus(error.message, "danger");
  }
}

async function loadDiners() {
  try {
    const response = await fetch("/api/diners");
    if (!response.ok) {
      throw new Error("Failed to load diner branches");
    }

    const diners = await response.json();
    dinersList.innerHTML = "";

    diners.forEach((diner) => {
      const item = document.createElement("li");
      item.className = "list-group-item";
      item.textContent = `${diner.branch}: ${diner.address} (${diner.openHours})`;
      dinersList.appendChild(item);
    });

    const modal = new bootstrap.Modal(document.getElementById("dinersModal"));
    modal.show();
  } catch (error) {
    showStatus(error.message, "danger");
  }
}

orderButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const itemId = button.getAttribute("data-order-item");
    openCheckoutModal(itemId);
  });
});

viewDinersButton.addEventListener("click", () => {
  loadDiners();
});

checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    itemId: menuItemSelect.value,
    quantity: Number(quantityInput.value),
    customerName: customerNameInput.value.trim()
  };

  await submitOrder(payload);
});

loadMenuPricing();
refreshOrderCount();
