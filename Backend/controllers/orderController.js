import Order from "../model/order.js";
import Product from "../model/product.js";
import Shop from "../model/shop.js";

const hasGlobalStaffInventory = (req) => req.user.role === "staff" && !req.user.shopId;

// Staff: place a new order
export const createOrder = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { customerName, customerPhone, items, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order must have at least one item" });
    }
    if (!shopId && !hasGlobalStaffInventory(req)) {
      return res.status(404).json({ success: false, message: "No shop assigned to this user" });
    }

    const enrichedItems = [];

    if (shopId) {
      // Load shop to verify assigned products.
      const shop = await Shop.findById(shopId).populate("products.product");
      if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });

      // Validate each item against products assigned by the super admin.
      for (const item of items) {
        const quantity = Number(item.quantity);
        if (!quantity || quantity < 1) {
          return res.status(400).json({
            success: false,
            message: "Each order item must have a valid quantity",
          });
        }

        const shopProduct = shop.products.find(
          (sp) => sp.product?._id?.toString() === item.product
        );
        if (!shopProduct) {
          return res.status(400).json({
            success: false,
            message: `Product not found in your shop inventory`,
          });
        }
        if (shopProduct.product.status !== "active") {
          return res.status(400).json({
            success: false,
            message: `"${shopProduct.product.name}" is not active for sale`,
          });
        }
        if (shopProduct.product.quantity < quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for "${shopProduct.product.name}". Available: ${shopProduct.product.quantity}`,
          });
        }
        enrichedItems.push({
          product: shopProduct.product._id,
          name: shopProduct.product.name,
          sku: shopProduct.product.sku || "",
          quantity,
          unitPrice: shopProduct.product.price,
          total: quantity * shopProduct.product.price,
        });
      }
    } else {
      for (const item of items) {
        const quantity = Number(item.quantity);
        if (!quantity || quantity < 1) {
          return res.status(400).json({
            success: false,
            message: "Each order item must have a valid quantity",
          });
        }

        const product = await Product.findById(item.product).lean();
        if (!product || product.status !== "active") {
          return res.status(400).json({
            success: false,
            message: "Product not found in super admin inventory",
          });
        }
        if (product.quantity < quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for "${product.name}". Available: ${product.quantity}`,
          });
        }

        enrichedItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku || "",
          quantity,
          unitPrice: product.price,
          total: quantity * product.price,
        });
      }
    }

    const subtotal = enrichedItems.reduce((s, i) => s + i.total, 0);
    const total = subtotal;
    const deductedItems = [];

    for (const item of enrichedItems) {
      const result = await Product.updateOne(
        { _id: item.product, status: "active", quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
      );

      if (result.modifiedCount !== 1) {
        await Promise.all(
          deductedItems.map((deducted) =>
            Product.updateOne(
              { _id: deducted.product },
              { $inc: { quantity: deducted.quantity } },
            ),
          ),
        );
        return res.status(400).json({
          success: false,
          message: "Product stock changed. Please refresh and try again.",
        });
      }

      deductedItems.push(item);
    }

    let order;
    try {
      order = await Order.create({
        shopId,
        takenBy: req.user._id,
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone || "",
        items: enrichedItems,
        subtotal,
        total,
        notes: notes || "",
        status: "pending",
      });
    } catch (err) {
      await Promise.all(
        deductedItems.map((deducted) =>
          Product.updateOne(
            { _id: deducted.product },
            { $inc: { quantity: deducted.quantity } },
          ),
        ),
      );
      throw err;
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
    if (!shopId && !hasGlobalStaffInventory(req)) {
      return res.status(404).json({ success: false, message: "No shop assigned to this user" });
    }
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
    if (!shopId && !hasGlobalStaffInventory(req)) {
      return res.status(404).json({ success: false, message: "No shop assigned to this user" });
    }
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
    if (!shopId && !hasGlobalStaffInventory(req)) {
      return res.status(404).json({ success: false, message: "No shop assigned to this user" });
    }
    const { reason = "" } = req.body;
    const order = await Order.findOne({ _id: req.params.id, shopId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.status !== "pending") {
      return res.status(400).json({ success: false, message: `Order is already ${order.status}` });
    }

    // Restore master product stock.
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { quantity: item.quantity } },
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
    if (!shopId && !hasGlobalStaffInventory(req)) {
      return res.status(404).json({ success: false, message: "No shop assigned to this user" });
    }
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
