import Product from "../model/product.js";
import { uploadToCloud, deleteFromCloud } from "../utils/CloudUpload.js";

/* ── helpers ──────────────────────────────────────────────────── */
const paginate = (query, page = 1, limit = 10) => {
  const skip = (Number(page) - 1) * Number(limit);
  return query.skip(skip).limit(Number(limit));
};

// Build shopId filter based on user role
const shopFilter = (user) => {
  if (user.role === "shop_admin") return { shopId: user.shopId };
  if (user.role === "staff") return { shopId: user.shopId };
  return {}; // super_admin sees all
};

const parseStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed].filter(Boolean);
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const normalizeOptionalNumbers = (body) => {
  ["comparePrice", "weight"].forEach((key) => {
    if (body[key] === "") body[key] = null;
  });

  if (body.dimensions) {
    ["length", "width", "height"].forEach((key) => {
      if (body.dimensions[key] === "") body.dimensions[key] = null;
    });
  }
};

/* ════════════════════════════════════════════════════════════════
   GET /api/products
════════════════════════════════════════════════════════════════ */
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

    const filter = { ...shopFilter(req.user) };

    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const total = await Product.countDocuments(filter);
    const products = await paginate(
      Product.find(filter).sort(sort).lean(),
      page,
      limit,
    );

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════════════
   GET /api/products/:id
════════════════════════════════════════════════════════════════ */
export const getProductById = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...shopFilter(req.user) };
    const product = await Product.findOne(filter);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════════════
   POST /api/products   (shop_admin or super_admin)
════════════════════════════════════════════════════════════════ */
export const createProduct = async (req, res) => {
  try {
    const body = { ...req.body };

    // Attach shopId for shop_admin
    if (req.user.role === "shop_admin") {
      body.shopId = req.user.shopId;
    }

    if (body.tags) body.tags = parseStringArray(body.tags);
    if (body.dimensions && typeof body.dimensions === "string") {
      body.dimensions = JSON.parse(body.dimensions);
    }
    normalizeOptionalNumbers(body);

    let images = [];
    if (req.files && req.files.length > 0) {
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

/* ════════════════════════════════════════════════════════════════
   PUT /api/products/:id
════════════════════════════════════════════════════════════════ */
export const updateProduct = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...shopFilter(req.user) };
    const product = await Product.findOne(filter);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const body = { ...req.body };

    if (body.tags) body.tags = parseStringArray(body.tags);
    if (body.dimensions && typeof body.dimensions === "string") {
      body.dimensions = JSON.parse(body.dimensions);
    }
    normalizeOptionalNumbers(body);

    if (req.files && req.files.length > 0) {
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

    Object.assign(product, body);
    await product.save();

    res.json({
      success: true,
      data: product,
      message: "Product updated successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════════════
   DELETE /api/products/:id
════════════════════════════════════════════════════════════════ */
export const deleteProduct = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...shopFilter(req.user) };
    const product = await Product.findOne(filter);
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
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════════════
   PATCH /api/products/:id/status
════════════════════════════════════════════════════════════════ */
export const toggleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive", "draft"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    const filter = { _id: req.params.id, ...shopFilter(req.user) };
    const product = await Product.findOneAndUpdate(
      filter,
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

/* ════════════════════════════════════════════════════════════════
   PATCH /api/products/:id/stock
   Staff: update product quantity (daily inventory entry)
   Body: { quantity, notes }
════════════════════════════════════════════════════════════════ */
export const updateStock = async (req, res) => {
  try {
    const { quantity, notes } = req.body;

    if (
      quantity === undefined ||
      quantity === null ||
      isNaN(Number(quantity))
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Valid quantity is required" });
    }

    const filter = { _id: req.params.id, ...shopFilter(req.user) };
    const product = await Product.findOne(filter);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const prevQty = product.quantity;
    product.quantity = Math.max(0, Number(quantity));
    await product.save();

    res.json({
      success: true,
      data: product,
      message: `Stock updated from ${prevQty} to ${product.quantity}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════════════
   DELETE /api/products/bulk-delete
════════════════════════════════════════════════════════════════ */
export const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length)
      return res
        .status(400)
        .json({ success: false, message: "No product IDs provided" });

    const filter = { _id: { $in: ids }, ...shopFilter(req.user) };
    const products = await Product.find(filter);

    await Promise.all(
      products.flatMap((p) =>
        (p.images || []).map(
          (img) => img.public_id && deleteFromCloud(img.public_id),
        ),
      ),
    );

    await Product.deleteMany(filter);
    res.json({
      success: true,
      message: `${products.length} product(s) deleted`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════════════
   GET /api/products/stats
════════════════════════════════════════════════════════════════ */
export const getProductStats = async (req, res) => {
  try {
    const matchFilter = shopFilter(req.user);

    const [stats] = await Product.aggregate([
      { $match: matchFilter },
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

    res.json({ success: true, data: stats || {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
