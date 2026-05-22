import Product from "../model/product.js";
import Shop from "../model/shop.js";
import { uploadToCloud, deleteFromCloud } from "../utils/CloudUpload.js";
import { createStockEntry } from "./stockEntryController.js";

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
const parseStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const p = JSON.parse(value);
    return Array.isArray(p) ? p : [p].filter(Boolean);
  } catch {
    return value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
};

const normalizeOptionalNumbers = (body) => {
  ["comparePrice", "weight"].forEach((k) => {
    if (body[k] === "") body[k] = null;
  });
  if (body.dimensions) {
    ["length", "width", "height"].forEach((k) => {
      if (body.dimensions[k] === "") body.dimensions[k] = null;
    });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/products
   super_admin  → all products, quantity = Product.quantity (master stock)
   shop_admin / staff → only assigned products, quantity = allocatedQuantity
───────────────────────────────────────────────────────────── */
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status,
      sort = "-createdAt",
      minPrice,
      maxPrice,
    } = req.query;

    /* ── super_admin: query Product collection directly ── */
    if (req.user.role === "super_admin") {
      const filter = {};
      if (search) filter.$text = { $search: search };
      if (category) filter.category = category;
      if (status) filter.status = status;
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }
      const total = await Product.countDocuments(filter);
      const products = await Product.find(filter)
        .sort(sort)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean({ virtuals: true });
      return res.json({
        success: true,
        data: products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    }

    /* ── shop_admin / staff: serve from shop assignment ── */
    if (!req.user.shopId) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: Number(limit), totalPages: 0 },
      });
    }

    const shop = await Shop.findById(req.user.shopId)
      .populate({ path: "products.product", model: "Product" })
      .lean();

    if (!shop) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: Number(limit), totalPages: 0 },
      });
    }

    // Build enriched product list — quantity = allocatedQuantity (the shop's live stock)
    let items = (shop.products || [])
      .filter((sp) => sp.product)
      .map((sp) => ({
        ...sp.product,
        quantity: Number(sp.allocatedQuantity ?? 0),
        price: sp.sellingPrice ?? sp.product.price,
        masterPrice: sp.product.price,
        sellingPrice: sp.sellingPrice,
        allocatedQuantity: Number(sp.allocatedQuantity ?? 0),
        inStock: Number(sp.allocatedQuantity ?? 0) > 0,
      }));

    // In-memory filters
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q),
      );
    }
    if (category) items = items.filter((p) => p.category === category);
    if (status) items = items.filter((p) => p.status === status);
    if (minPrice) items = items.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) items = items.filter((p) => p.price <= Number(maxPrice));

    const total = items.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paged = items.slice(skip, skip + Number(limit));

    return res.json({
      success: true,
      data: paged,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/products/:id
───────────────────────────────────────────────────────────── */
export const getProductById = async (req, res) => {
  try {
    if (req.user.role === "super_admin") {
      const product = await Product.findById(req.params.id).lean({
        virtuals: true,
      });
      if (!product)
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      return res.json({ success: true, data: product });
    }

    if (!req.user.shopId)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const shop = await Shop.findOne({
      _id: req.user.shopId,
      "products.product": req.params.id,
    })
      .populate("products.product")
      .lean();

    const sp = shop?.products?.find(
      (item) => item.product?._id?.toString() === req.params.id,
    );
    if (!sp?.product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    return res.json({
      success: true,
      data: {
        ...sp.product,
        quantity: Number(sp.allocatedQuantity ?? 0),
        price: sp.sellingPrice ?? sp.product.price,
        masterPrice: sp.product.price,
        sellingPrice: sp.sellingPrice,
        allocatedQuantity: Number(sp.allocatedQuantity ?? 0),
        inStock: Number(sp.allocatedQuantity ?? 0) > 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /api/products  (super_admin only)
───────────────────────────────────────────────────────────── */
export const createProduct = async (req, res) => {
  try {
    const body = { ...req.body };
    delete body.shopId;
    body.shopId = null;

    if (body.tags) body.tags = parseStringArray(body.tags);
    if (body.dimensions && typeof body.dimensions === "string") {
      body.dimensions = JSON.parse(body.dimensions);
    }
    normalizeOptionalNumbers(body);

    let images = [];
    if (req.files?.length > 0) {
      images = await Promise.all(
        req.files.map(async (file, idx) => {
          const result = await uploadToCloud(file);
          return {
            url: result.secure_url,
            public_id: result.public_id,
            isPrimary: idx === 0,
          };
        }),
      );
    }

    const product = await Product.create({ ...body, images });

    // Log the initial stock entry if quantity > 0
    if (Number(product.quantity) > 0) {
      await createStockEntry({
        product,
        previousQty: 0,
        newQty: Number(product.quantity),
        notes: "Initial stock on product creation",
        enteredBy: req.user._id,
      });
    }

    res
      .status(201)
      .json({
        success: true,
        data: product,
        message: "Product created successfully",
      });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res
        .status(400)
        .json({ success: false, message: `${field} already exists` });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   PUT /api/products/:id  (super_admin only)
───────────────────────────────────────────────────────────── */
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const body = { ...req.body };
    delete body.shopId;

    if (body.tags) body.tags = parseStringArray(body.tags);
    if (body.dimensions && typeof body.dimensions === "string") {
      body.dimensions = JSON.parse(body.dimensions);
    }
    normalizeOptionalNumbers(body);

    if (req.files?.length > 0) {
      const newImages = await Promise.all(
        req.files.map(async (file, idx) => {
          const result = await uploadToCloud(file);
          return {
            url: result.secure_url,
            public_id: result.public_id,
            isPrimary: product.images.length === 0 && idx === 0,
          };
        }),
      );
      body.images = [...product.images, ...newImages];
    }

    if (body.deleteImages) {
      const toDelete = parseStringArray(body.deleteImages);
      await Promise.all(toDelete.map((id) => deleteFromCloud(id)));
      body.images = (body.images || product.images).filter(
        (img) => !toDelete.includes(img.public_id),
      );
      delete body.deleteImages;
    }

    // Track quantity change if it was updated via the edit form
    const prevQty = product.quantity;
    Object.assign(product, body);
    await product.save();

    if (body.quantity !== undefined && Number(body.quantity) !== prevQty) {
      await createStockEntry({
        product,
        previousQty: prevQty,
        newQty: Number(product.quantity),
        notes: "Updated via product edit",
        enteredBy: req.user._id,
      });
    }

    res.json({
      success: true,
      data: product,
      message: "Product updated successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   DELETE /api/products/:id  (super_admin only)
───────────────────────────────────────────────────────────── */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    if (product.images?.length > 0) {
      await Promise.all(
        product.images.map(
          (img) => img.public_id && deleteFromCloud(img.public_id),
        ),
      );
    }

    await product.deleteOne();
    await Shop.updateMany(
      {},
      { $pull: { products: { product: product._id } } },
    );
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   PATCH /api/products/:id/status  (super_admin only)
───────────────────────────────────────────────────────────── */
export const toggleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive", "draft"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({
      success: true,
      data: product,
      message: `Product marked as ${status}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   PATCH /api/products/:id/stock  (super_admin only)
   ▸ Updates master Product.quantity
   ▸ Logs the entry to StockEntry collection
───────────────────────────────────────────────────────────── */
export const updateStock = async (req, res) => {
  try {
    const { quantity, notes = "" } = req.body;
    if (
      quantity === undefined ||
      quantity === null ||
      isNaN(Number(quantity))
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Valid quantity is required" });
    }

    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const prevQty = product.quantity;
    const newQty = Math.max(0, Number(quantity));
    product.quantity = newQty;
    await product.save();

    // Log every stock entry — this powers the report
    await createStockEntry({
      product,
      previousQty: prevQty,
      newQty,
      notes,
      enteredBy: req.user._id,
    });

    res.json({
      success: true,
      data: product,
      message: `Stock updated from ${prevQty} to ${newQty}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   DELETE /api/products/bulk-delete  (super_admin only)
───────────────────────────────────────────────────────────── */
export const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids?.length)
      return res
        .status(400)
        .json({ success: false, message: "No product IDs provided" });

    const products = await Product.find({ _id: { $in: ids } });
    await Promise.all(
      products.flatMap((p) =>
        (p.images || []).map(
          (img) => img.public_id && deleteFromCloud(img.public_id),
        ),
      ),
    );
    await Product.deleteMany({ _id: { $in: ids } });
    await Shop.updateMany(
      {},
      { $pull: { products: { product: { $in: ids } } } },
    );
    res.json({
      success: true,
      message: `${products.length} product(s) deleted`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/products/stats
───────────────────────────────────────────────────────────── */
export const getProductStats = async (req, res) => {
  try {
    /* ── super_admin: aggregate on master Product collection ── */
    if (req.user.role === "super_admin") {
      const [stats] = await Product.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
            inactive: {
              $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] },
            },
            draft: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
            totalQty: { $sum: "$quantity" },
            avgPrice: { $avg: "$price" },
            outOfStock: { $sum: { $cond: [{ $lte: ["$quantity", 0] }, 1, 0] } },
          },
        },
      ]);
      return res.json({ success: true, data: stats || {} });
    }

    /* ── shop_admin / staff: stats from shop's allocatedQuantity ── */
    if (!req.user.shopId) {
      return res.json({
        success: true,
        data: {
          total: 0,
          active: 0,
          inactive: 0,
          draft: 0,
          totalQty: 0,
          outOfStock: 0,
        },
      });
    }

    const shop = await Shop.findById(req.user.shopId).select("products").lean();
    const assigned = shop?.products || [];
    const totalQty = assigned.reduce(
      (s, sp) => s + Number(sp.allocatedQuantity || 0),
      0,
    );
    const outOfStock = assigned.filter(
      (sp) => Number(sp.allocatedQuantity || 0) <= 0,
    ).length;

    return res.json({
      success: true,
      data: {
        total: assigned.length,
        active: assigned.length,
        inactive: 0,
        draft: 0,
        totalQty,
        outOfStock,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
