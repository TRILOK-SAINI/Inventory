import Product from "../model/product.js";
import Shop from "../model/shop.js";
import { uploadToCloud, deleteFromCloud } from "../utils/CloudUpload.js";

/* ── helpers ──────────────────────────────────────────────────── */
const paginate = (query, page = 1, limit = 10) => {
  const skip = (Number(page) - 1) * Number(limit);
  return query.skip(skip).limit(Number(limit));
};

/**
 * For super_admin → null (no restriction, query Products directly)
 * For shop_admin / staff → array of ObjectIds assigned to their shop
 *   (may be empty array if nothing assigned yet)
 */
const getAssignedProductIds = async (user) => {
  if (user.role === "super_admin") return null;
  if (!user.shopId) return [];
  const shop = await Shop.findById(user.shopId)
    .select("products.product")
    .lean();
  return (shop?.products || []).map((item) => item.product).filter(Boolean);
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
      .map((t) => t.trim())
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

    const assignedProductIds = await getAssignedProductIds(req.user);

    // ── super_admin: query products directly ──────────────────
    if (assignedProductIds === null) {
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
      const products = await paginate(
        Product.find(filter).sort(sort).lean({ virtuals: true }),
        page,
        limit,
      );

      return res.json({
        success: true,
        data: products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // ── shop_admin / staff: return only assigned products ─────
    // Empty assignment → return empty immediately (avoids Mongoose crash)
    if (assignedProductIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: Number(page),
          limit: Number(limit),
          totalPages: 0,
        },
      });
    }

    // Build a filter on the product documents themselves
    const filter = { _id: { $in: assignedProductIds } };
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
      Product.find(filter).sort(sort).lean({ virtuals: true }),
      page,
      limit,
    );

    return res.json({
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
    const assignedProductIds = await getAssignedProductIds(req.user);

    // super_admin
    if (assignedProductIds === null) {
      const product = await Product.findById(req.params.id).lean({
        virtuals: true,
      });
      if (!product)
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      return res.json({ success: true, data: product });
    }

    // shop_admin / staff — check assignment
    const isAssigned = assignedProductIds.some(
      (id) => id.toString() === req.params.id,
    );
    if (!isAssigned) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const product = await Product.findById(req.params.id).lean({
      virtuals: true,
    });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    return res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════════════
   POST /api/products  (super_admin only)
════════════════════════════════════════════════════════════════ */
export const createProduct = async (req, res) => {
  try {
    const body = { ...req.body };
    delete body.shopId;
    body.shopId = null; // products are global; shops get assigned via Shop.products[]

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
   PUT /api/products/:id  (super_admin only)
════════════════════════════════════════════════════════════════ */
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
   DELETE /api/products/:id  (super_admin only)
════════════════════════════════════════════════════════════════ */
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
    // Remove from any shop assignments
    await Shop.updateMany(
      {},
      { $pull: { products: { product: product._id } } },
    );
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════════════
   PATCH /api/products/:id/status  (super_admin only)
════════════════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════════════════
   PATCH /api/products/:id/stock  (super_admin only)
   Updates the global product quantity (master stock record)
════════════════════════════════════════════════════════════════ */
export const updateStock = async (req, res) => {
  try {
    const { quantity } = req.body;
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
   DELETE /api/products/bulk-delete  (super_admin only)
════════════════════════════════════════════════════════════════ */
export const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) {
      return res
        .status(400)
        .json({ success: false, message: "No product IDs provided" });
    }

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

/* ════════════════════════════════════════════════════════════════
   GET /api/products/stats
════════════════════════════════════════════════════════════════ */
export const getProductStats = async (req, res) => {
  try {
    const assignedProductIds = await getAssignedProductIds(req.user);

    // shop_admin / staff — derive stats from shop assignment
    if (assignedProductIds !== null) {
      if (assignedProductIds.length === 0) {
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

      const [stats] = await Product.aggregate([
        { $match: { _id: { $in: assignedProductIds } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } },
            draft: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
            totalQty: { $sum: "$quantity" },
            outOfStock: { $sum: { $cond: [{ $lte: ["$quantity", 0] }, 1, 0] } },
          },
        },
      ]);

      return res.json({
        success: true,
        data: stats || {},
      });
    }

    // super_admin — aggregate directly on Product collection
    const [stats] = await Product.aggregate([
      { $match: {} },
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
