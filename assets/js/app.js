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

const LOCAL_ORDER_STORAGE_KEY = "chuff-diner-demo-orders";
const demoMenu = [
  {
    id: "drink",
    name: "Drinks",
    price: 10,
    description: "Freshly brewed coffee, teas, juices, and soft drinks."
  },
  {
    id: "burger",
    name: "Burgers",
    price: 40,
    description: "Juicy beef or chicken burgers served with crispy fries."
  },
  {
    id: "pizza",
    name: "Pizzas",
    price: 70,
    description: "Hand-tossed pizzas with rich sauce and premium toppings."
  }
];
const demoDiners = [
  {
    id: 1,
    branch: "Central",
    address: "12 Market Street, Johannesburg",
    openHours: "06:00 - 23:00"
  },
  {
    id: 2,
    branch: "Riverside",
    address: "44 Riverside Drive, Pretoria",
    openHours: "07:00 - 22:00"
  },
  {
    id: 3,
    branch: "Sunset",
    address: "8 Sunset Avenue, Cape Town",
    openHours: "08:00 - 00:00"
  }
];

let cachedMenu = [];
let apiAvailable = null;

function showStatus(message, type = "success") {
  statusAlert.className = `alert alert-${type}`;
  statusAlert.textContent = message;
  statusAlert.classList.remove("d-none");
}

function formatCurrency(value) {
  return `R${Number(value).toFixed(2)}`;
}

function getStoredOrders() {
  try {
    const rawOrders = window.localStorage.getItem(LOCAL_ORDER_STORAGE_KEY);
    return rawOrders ? JSON.parse(rawOrders) : [];
  } catch (_error) {
    return [];
  }
}

function saveStoredOrders(orders) {
  window.localStorage.setItem(LOCAL_ORDER_STORAGE_KEY, JSON.stringify(orders));
}

async function requestJson(path, options) {
  if (apiAvailable === false) {
    throw new Error("API unavailable");
  }

  const response = await fetch(path, options);
  if (!response.ok) {
    throw new Error(`Request failed for ${path}`);
  }

  apiAvailable = true;
  return response.json();
}

function renderMenu(menu) {
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
}

function showDemoModeMessage() {
  showStatus(
    "Running in static demo mode. Orders are stored in this browser because the backend API is not available here.",
    "info"
  );
}

async function loadMenuPricing() {
  try {
    const menu = await requestJson("/api/menu");
    renderMenu(menu);
  } catch (_error) {
    apiAvailable = false;
    renderMenu(demoMenu);
    showDemoModeMessage();
  }
}

async function refreshOrderCount() {
  try {
    const orders = apiAvailable === false ? getStoredOrders() : await requestJson("/api/orders");
    totalOrdersCount.textContent = String(orders.length);
  } catch (_error) {
    apiAvailable = false;
    totalOrdersCount.textContent = String(getStoredOrders().length);
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
    let order;

    if (apiAvailable === false) {
      const selectedItem = cachedMenu.find((item) => item.id === itemId);
      const storedOrders = getStoredOrders();
      order = {
        id: storedOrders.length + 1,
        customerName,
        itemId,
        itemName: selectedItem ? selectedItem.name : itemId,
        quantity,
        total: selectedItem ? Number((selectedItem.price * quantity).toFixed(2)) : 0,
        createdAt: new Date().toISOString()
      };
      storedOrders.unshift(order);
      saveStoredOrders(storedOrders);
    } else {
      order = await requestJson("/api/orders", {
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
    }

    showStatus(
      `Order #${order.id} placed: ${order.quantity}x ${order.itemName} (${formatCurrency(order.total)})`
    );
    checkoutModal.hide();
    await refreshOrderCount();
  } catch (error) {
    apiAvailable = false;
    showDemoModeMessage();
    showStatus(error.message, "danger");
  }
}

async function loadDiners() {
  try {
    const diners = apiAvailable === false ? demoDiners : await requestJson("/api/diners");
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
    apiAvailable = false;
    dinersList.innerHTML = "";
    demoDiners.forEach((diner) => {
      const item = document.createElement("li");
      item.className = "list-group-item";
      item.textContent = `${diner.branch}: ${diner.address} (${diner.openHours})`;
      dinersList.appendChild(item);
    });
    const modal = new bootstrap.Modal(document.getElementById("dinersModal"));
    modal.show();
    showDemoModeMessage();
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
