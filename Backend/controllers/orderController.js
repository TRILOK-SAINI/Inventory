import Order from "../model/order.js";
import Product from "../model/product.js";
import Shop from "../model/shop.js";
import User from "../model/user.js";
import ExcelJS from "exceljs";
import mongoose from "mongoose";

const hasGlobalStaffInventory = (req) =>
  req.user.role === "staff" && !req.user.shopId;

const toObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

/* ═══════════════════════════════════════════════════════════════
   CREATE ORDER
═══════════════════════════════════════════════════════════════ */
export const createOrder = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { customerName, customerPhone, items, notes } = req.body;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Order must have at least one item" });
    }
    if (!shopId && !hasGlobalStaffInventory(req)) {
      return res
        .status(404)
        .json({ success: false, message: "No shop assigned to this user" });
    }

    const enrichedItems = [];

    if (shopId) {
      const shop = await Shop.findById(shopId).populate("products.product");
      if (!shop)
        return res
          .status(404)
          .json({ success: false, message: "Shop not found" });

      for (const item of items) {
        const quantity = Number(item.quantity);
        if (!quantity || quantity < 1) {
          return res
            .status(400)
            .json({
              success: false,
              message: "Each order item must have a valid quantity",
            });
        }
        const shopProduct = shop.products.find(
          (sp) => sp.product?._id?.toString() === item.product,
        );
        if (!shopProduct) {
          return res
            .status(400)
            .json({
              success: false,
              message: `Product not found in your shop inventory`,
            });
        }
        if (shopProduct.product.status !== "active") {
          return res
            .status(400)
            .json({
              success: false,
              message: `"${shopProduct.product.name}" is not active for sale`,
            });
        }
        if (shopProduct.product.quantity < quantity) {
          return res
            .status(400)
            .json({
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
          return res
            .status(400)
            .json({
              success: false,
              message: "Each order item must have a valid quantity",
            });
        }
        const product = await Product.findById(item.product).lean();
        if (!product || product.status !== "active") {
          return res
            .status(400)
            .json({
              success: false,
              message: "Product not found in super admin inventory",
            });
        }
        if (product.quantity < quantity) {
          return res
            .status(400)
            .json({
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
        {
          _id: item.product,
          status: "active",
          quantity: { $gte: item.quantity },
        },
        { $inc: { quantity: -item.quantity } },
      );
      if (result.modifiedCount !== 1) {
        await Promise.all(
          deductedItems.map((d) =>
            Product.updateOne(
              { _id: d.product },
              { $inc: { quantity: d.quantity } },
            ),
          ),
        );
        return res
          .status(400)
          .json({
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
        deductedItems.map((d) =>
          Product.updateOne(
            { _id: d.product },
            { $inc: { quantity: d.quantity } },
          ),
        ),
      );
      throw err;
    }

    const populated = await Order.findById(order._id).populate(
      "takenBy",
      "name email",
    );
    res
      .status(201)
      .json({
        success: true,
        data: populated,
        message: "Order placed successfully",
      });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   GET SHOP ORDERS  (staff / shop_admin)
═══════════════════════════════════════════════════════════════ */
export const getShopOrders = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    if (!shopId && !hasGlobalStaffInventory(req)) {
      return res
        .status(404)
        .json({ success: false, message: "No shop assigned to this user" });
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
      pagination: {
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   DELIVER ORDER
═══════════════════════════════════════════════════════════════ */
export const deliverOrder = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    if (!shopId && !hasGlobalStaffInventory(req)) {
      return res
        .status(404)
        .json({ success: false, message: "No shop assigned to this user" });
    }
    const order = await Order.findOne({ _id: req.params.id, shopId });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: `Order is already ${order.status}` });
    }
    order.status = "delivered";
    order.deliveredAt = new Date();
    await order.save();
    res.json({
      success: true,
      data: order,
      message: "Order marked as delivered",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   CANCEL ORDER  — restores master stock
═══════════════════════════════════════════════════════════════ */
export const cancelOrder = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    if (!shopId && !hasGlobalStaffInventory(req)) {
      return res
        .status(404)
        .json({ success: false, message: "No shop assigned to this user" });
    }
    const { reason = "" } = req.body;
    const order = await Order.findOne({ _id: req.params.id, shopId });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: `Order is already ${order.status}` });
    }
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
    res.json({
      success: true,
      data: order,
      message: "Order cancelled and stock restored",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   ORDER STATS  (staff dashboard)
═══════════════════════════════════════════════════════════════ */
export const getOrderStats = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    if (!shopId && !hasGlobalStaffInventory(req)) {
      return res
        .status(404)
        .json({ success: false, message: "No shop assigned to this user" });
    }
    const [total, pending, delivered, cancelled] = await Promise.all([
      Order.countDocuments({ shopId }),
      Order.countDocuments({ shopId, status: "pending" }),
      Order.countDocuments({ shopId, status: "delivered" }),
      Order.countDocuments({ shopId, status: "cancelled" }),
    ]);
    const revenue = await Order.aggregate([
      { $match: { shopId, status: "delivered" } },
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

/* ═══════════════════════════════════════════════════════════════
   HELPER — build filter from query params (super_admin report)
   Params: shopId, staffId, status, dateFrom, dateTo
═══════════════════════════════════════════════════════════════ */
function buildReportFilter(query) {
  const { shopId, staffId, status, dateFrom, dateTo } = query;
  const filter = {};

  // shopId: null means super_admin's own (no shop) orders
  if (shopId === "null" || shopId === "") {
    filter.shopId = null;
  } else if (shopId) {
    filter.shopId = toObjectId(shopId);
  }
  // if no shopId param at all → return all orders (no filter)

  if (staffId) filter.takenBy = toObjectId(staffId);
  if (status) filter.status = status;

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  return filter;
}

/* ═══════════════════════════════════════════════════════════════
   GET ORDER REPORT  (super_admin)
   GET /api/orders/report
   Query: shopId, staffId, status, dateFrom, dateTo, page, limit
═══════════════════════════════════════════════════════════════ */
export const getOrderReportStaff = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["staff", "shop_admin"] },
    })
      .select("name email role shopId isActive")
      .populate("shopId", "name code city")
      .sort({ name: 1 })
      .lean();

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrderReport = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = buildReportFilter(req.query);

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .populate("takenBy", "name email role")
      .populate("shopId", "name code city")
      .lean();

    // Aggregate summary for the current filter
    const [agg] = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, "$total", 0] },
          },
          totalPending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          totalDelivered: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          totalCancelled: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: orders,
      summary: agg
        ? {
            totalOrders: agg.totalOrders,
            totalRevenue: agg.totalRevenue,
            totalPending: agg.totalPending,
            totalDelivered: agg.totalDelivered,
            totalCancelled: agg.totalCancelled,
          }
        : {
            totalOrders: 0,
            totalRevenue: 0,
            totalPending: 0,
            totalDelivered: 0,
            totalCancelled: 0,
          },
      pagination: {
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   DOWNLOAD ORDER REPORT AS EXCEL  (super_admin)
   GET /api/orders/report/download
   Same query params as getOrderReport (no pagination — full export)
═══════════════════════════════════════════════════════════════ */
export const downloadOrderReport = async (req, res) => {
  try {
    const filter = buildReportFilter(req.query);

    const orders = await Order.find(filter)
      .sort("-createdAt")
      .populate("takenBy", "name email role")
      .populate("shopId", "name code city")
      .lean();

    const wb = new ExcelJS.Workbook();
    wb.creator = "Inventory System";
    wb.created = new Date();

    /* ── Sheet 1: Orders summary ─────────────────────────── */
    const wsSummary = wb.addWorksheet("Orders");
    wsSummary.columns = [
      { header: "Order #", key: "orderNumber", width: 14 },
      { header: "Shop", key: "shop", width: 22 },
      { header: "Shop Code", key: "shopCode", width: 14 },
      { header: "City", key: "city", width: 16 },
      { header: "Customer", key: "customerName", width: 22 },
      { header: "Phone", key: "customerPhone", width: 16 },
      { header: "Items", key: "itemCount", width: 8 },
      { header: "Subtotal", key: "subtotal", width: 12 },
      { header: "Total (Rs)", key: "total", width: 14 },
      { header: "Status", key: "status", width: 12 },
      { header: "Taken By", key: "takenBy", width: 22 },
      { header: "Staff Role", key: "takenByRole", width: 14 },
      { header: "Notes", key: "notes", width: 30 },
      { header: "Date", key: "createdAt", width: 22 },
      { header: "Delivered At", key: "deliveredAt", width: 22 },
      { header: "Cancelled At", key: "cancelledAt", width: 22 },
      { header: "Cancel Reason", key: "cancelReason", width: 28 },
    ];

    // Style header row
    wsSummary.getRow(1).font = { bold: true };
    wsSummary.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0EA5E9" },
    };
    wsSummary.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN") : "-");

    orders.forEach((o) => {
      const row = wsSummary.addRow({
        orderNumber: o.orderNumber,
        shop: o.shopId?.name || "Super Admin",
        shopCode: o.shopId?.code || "-",
        city: o.shopId?.city || "-",
        customerName: o.customerName,
        customerPhone: o.customerPhone || "-",
        itemCount: o.items.length,
        subtotal: o.subtotal,
        total: o.total,
        status: o.status,
        takenBy: o.takenBy?.name || "-",
        takenByRole: o.takenBy?.role?.replace("_", " ") || "-",
        notes: o.notes || "-",
        createdAt: fmt(o.createdAt),
        deliveredAt: fmt(o.deliveredAt),
        cancelledAt: fmt(o.cancelledAt),
        cancelReason: o.cancelReason || "-",
      });

      // Color-code status cell
      const statusCell = row.getCell("status");
      if (o.status === "delivered") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF16A34A" },
        };
        statusCell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      } else if (o.status === "cancelled") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFDC2626" },
        };
        statusCell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      } else {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFCA8A04" },
        };
        statusCell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      }
    });

    /* ── Sheet 2: Order line items ───────────────────────── */
    const wsItems = wb.addWorksheet("Order Items");
    wsItems.columns = [
      { header: "Order #", key: "orderNumber", width: 14 },
      { header: "Shop", key: "shop", width: 22 },
      { header: "Product", key: "product", width: 28 },
      { header: "SKU", key: "sku", width: 16 },
      { header: "Qty", key: "quantity", width: 8 },
      { header: "Unit Price", key: "unitPrice", width: 14 },
      { header: "Line Total", key: "lineTotal", width: 14 },
      { header: "Order Status", key: "status", width: 14 },
      { header: "Date", key: "createdAt", width: 22 },
    ];
    wsItems.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    wsItems.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0EA5E9" },
    };

    orders.forEach((o) => {
      o.items.forEach((item) => {
        wsItems.addRow({
          orderNumber: o.orderNumber,
          shop: o.shopId?.name || "Super Admin",
          product: item.name,
          sku: item.sku || "-",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.total,
          status: o.status,
          createdAt: fmt(o.createdAt),
        });
      });
    });

    /* ── Sheet 3: Per-shop summary ───────────────────────── */
    const wsShops = wb.addWorksheet("Shop Summary");
    wsShops.columns = [
      { header: "Shop", key: "shop", width: 24 },
      { header: "Code", key: "code", width: 12 },
      { header: "City", key: "city", width: 16 },
      { header: "Orders", key: "orders", width: 10 },
      { header: "Delivered", key: "delivered", width: 12 },
      { header: "Cancelled", key: "cancelled", width: 12 },
      { header: "Pending", key: "pending", width: 10 },
      { header: "Revenue (Rs)", key: "revenue", width: 16 },
    ];
    wsShops.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    wsShops.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0EA5E9" },
    };

    const shopMap = {};
    orders.forEach((o) => {
      const key = o.shopId?._id?.toString() || "super_admin";
      if (!shopMap[key]) {
        shopMap[key] = {
          shop: o.shopId?.name || "Super Admin",
          code: o.shopId?.code || "-",
          city: o.shopId?.city || "-",
          orders: 0,
          delivered: 0,
          cancelled: 0,
          pending: 0,
          revenue: 0,
        };
      }
      shopMap[key].orders++;
      shopMap[key][o.status]++;
      if (o.status === "delivered") shopMap[key].revenue += o.total;
    });
    Object.values(shopMap).forEach((row) => wsShops.addRow(row));

    /* ── Sheet 4: Per-staff summary ──────────────────────── */
    const wsStaff = wb.addWorksheet("Staff Summary");
    wsStaff.columns = [
      { header: "Staff Name", key: "name", width: 24 },
      { header: "Email", key: "email", width: 28 },
      { header: "Role", key: "role", width: 14 },
      { header: "Shop", key: "shop", width: 22 },
      { header: "Orders", key: "orders", width: 10 },
      { header: "Delivered", key: "delivered", width: 12 },
      { header: "Cancelled", key: "cancelled", width: 12 },
      { header: "Pending", key: "pending", width: 10 },
      { header: "Revenue (Rs)", key: "revenue", width: 16 },
    ];
    wsStaff.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    wsStaff.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0EA5E9" },
    };

    const staffMap = {};
    orders.forEach((o) => {
      const key = o.takenBy?._id?.toString() || "unknown";
      if (!staffMap[key]) {
        staffMap[key] = {
          name: o.takenBy?.name || "Unknown",
          email: o.takenBy?.email || "-",
          role: o.takenBy?.role?.replace("_", " ") || "-",
          shop: o.shopId?.name || "Super Admin",
          orders: 0,
          delivered: 0,
          cancelled: 0,
          pending: 0,
          revenue: 0,
        };
      }
      staffMap[key].orders++;
      staffMap[key][o.status]++;
      if (o.status === "delivered") staffMap[key].revenue += o.total;
    });
    Object.values(staffMap).forEach((row) => wsStaff.addRow(row));

    /* ── Send file ───────────────────────────────────────── */
    const fileName = `order-report-${Date.now()}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
