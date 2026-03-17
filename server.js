const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "chuff-diner-api" });
});

app.get("/api/menu", async (_req, res) => {
  try {
    const rows = await db.all("SELECT id, name, price, description FROM menu ORDER BY name ASC");
    res.json(rows);
  } catch (_error) {
    res.status(500).json({ error: "Failed to load menu" });
  }
});

app.get("/api/diners", async (_req, res) => {
  try {
    const rows = await db.all(
      "SELECT id, branch, address, open_hours AS openHours FROM diners ORDER BY id ASC"
    );
    res.json(rows);
  } catch (_error) {
    res.status(500).json({ error: "Failed to load diners" });
  }
});

app.get("/api/orders", async (_req, res) => {
  try {
    const rows = await db.all(
      "SELECT id, customer_name AS customerName, item_id AS itemId, item_name AS itemName, quantity, total, created_at AS createdAt FROM orders ORDER BY id DESC"
    );
    res.json(rows);
  } catch (_error) {
    res.status(500).json({ error: "Failed to load orders" });
  }
});

app.post("/api/orders", async (req, res) => {
  const { itemId, quantity = 1, customerName = "Guest" } = req.body;

  if (!itemId) {
    return res.status(400).json({ error: "itemId is required" });
  }

  let selectedItem;

  try {
    selectedItem = await db.get("SELECT id, name, price FROM menu WHERE id = ?", [itemId]);
  } catch (_error) {
    return res.status(500).json({ error: "Failed to access menu" });
  }

  if (!selectedItem) {
    return res.status(404).json({ error: "Menu item not found" });
  }

  const parsedQuantity = Number(quantity);

  if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
    return res.status(400).json({ error: "quantity must be a positive integer" });
  }

  const cleanedCustomerName = String(customerName).trim() || "Guest";
  const total = Number((selectedItem.price * parsedQuantity).toFixed(2));
  const createdAt = new Date().toISOString();

  try {
    const insertResult = await db.run(
      "INSERT INTO orders (customer_name, item_id, item_name, quantity, total, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [cleanedCustomerName, selectedItem.id, selectedItem.name, parsedQuantity, total, createdAt]
    );

    const order = {
      id: insertResult.lastID,
      customerName: cleanedCustomerName,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      quantity: parsedQuantity,
      total,
      createdAt
    };

    return res.status(201).json(order);
  } catch (_error) {
    return res.status(500).json({ error: "Failed to create order" });
  }
});

app.use(express.static(path.join(__dirname)));

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

async function startServer() {
  try {
    await db.initDatabase();
    app.listen(PORT, () => {
      console.log(`Chuff Diner server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize database", error);
    process.exit(1);
  }
}

startServer();
