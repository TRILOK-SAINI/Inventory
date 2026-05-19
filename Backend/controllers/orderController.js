import Order from "../model/order.js";
import Shop from "../model/shop.js";

// Staff: place a new order
export const createOrder = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { customerName, customerPhone, items, discount = 0, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order must have at least one item" });
    }

    // Load shop to verify stock
    const shop = await Shop.findById(shopId).populate("products.product");
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });

    // Validate each item against shop inventory
    const enrichedItems = [];
    for (const item of items) {
      const shopProduct = shop.products.find(
        (sp) => sp.product._id.toString() === item.product
      );
      if (!shopProduct) {
        return res.status(400).json({
          success: false,
          message: `Product not found in your shop inventory`,
        });
      }
      if (shopProduct.allocatedQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${shopProduct.product.name}". Available: ${shopProduct.allocatedQuantity}`,
        });
      }
      enrichedItems.push({
        product: item.product,
        name: shopProduct.product.name,
        sku: shopProduct.product.sku || "",
        quantity: item.quantity,
        unitPrice: shopProduct.sellingPrice || shopProduct.product.price,
        total: item.quantity * (shopProduct.sellingPrice || shopProduct.product.price),
      });
    }

    const subtotal = enrichedItems.reduce((s, i) => s + i.total, 0);
    const total = Math.max(0, subtotal - discount);

    const order = await Order.create({
      shopId,
      takenBy: req.user._id,
      customerName: customerName || "Walk-in Customer",
      customerPhone: customerPhone || "",
      items: enrichedItems,
      subtotal,
      discount,
      total,
      notes: notes || "",
      status: "pending",
    });

    // Deduct stock from shop immediately on order creation
    for (const item of enrichedItems) {
      await Shop.updateOne(
        { _id: shopId, "products.product": item.product },
        { $inc: { "products.$.allocatedQuantity": -item.quantity } }
      );
    }

    const populated = await Order.findById(order._id).populate("takenBy", "name email");

    res.status(201).json({ success: true, data: populated, message: "Order placed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get orders for a shop (staff sees their own shop's orders)
export const getShopOrders = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { page = 1, limit = 20, status } = req.query;
    const filter = { shopId };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .populate("takenBy", "name email")
      .lean();

    res.json({
      success: true,
      data: orders,
      pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Deliver an order
export const deliverOrder = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const order = await Order.findOne({ _id: req.params.id, shopId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.status !== "pending") {
      return res.status(400).json({ success: false, message: `Order is already ${order.status}` });
    }

    order.status = "delivered";
    order.deliveredAt = new Date();
    await order.save();

    res.json({ success: true, data: order, message: "Order marked as delivered" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cancel an order — restores stock
export const cancelOrder = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { reason = "" } = req.body;
    const order = await Order.findOne({ _id: req.params.id, shopId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.status !== "pending") {
      return res.status(400).json({ success: false, message: `Order is already ${order.status}` });
    }

    // Restore stock
    for (const item of order.items) {
      await Shop.updateOne(
        { _id: shopId, "products.product": item.product },
        { $inc: { "products.$.allocatedQuantity": item.quantity } }
      );
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    await order.save();

    res.json({ success: true, data: order, message: "Order cancelled and stock restored" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Stats for staff dashboard
export const getOrderStats = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const [total, pending, delivered, cancelled] = await Promise.all([
      Order.countDocuments({ shopId }),
      Order.countDocuments({ shopId, status: "pending" }),
      Order.countDocuments({ shopId, status: "delivered" }),
      Order.countDocuments({ shopId, status: "cancelled" }),
    ]);

    const revenue = await Order.aggregate([
      { $match: { shopId: shopId, status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    res.json({
      success: true,
      data: {
        total,
        pending,
        delivered,
        cancelled,
        revenue: revenue[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};