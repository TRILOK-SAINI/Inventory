import Product from "../model/product.js";
import { uploadToCloud, deleteFromCloud } from "../utils/CloudUpload.js"; // your upload helper

/* ── helpers ──────────────────────────────────────────────────── */
const paginate = (query, page = 1, limit = 10) => {
  const skip = (Number(page) - 1) * Number(limit);
  return query.skip(skip).limit(Number(limit));
};

/* ════════════════════════════════════════════════════════════════
   GET /api/products
   Query: page, limit, search, category, status, sort, minPrice, maxPrice
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

    const filter = {};

    if (search) {
      filter.$text = { $search: search };
    }
    if (category) filter.category = category;
    if (status)   filter.status   = status;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const total    = await Product.countDocuments(filter);
    const products = await paginate(
      Product.find(filter).sort(sort).lean(),
      page,
      limit
    );

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
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
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════════════
   POST /api/products
   Body: multipart/form-data (images[] + JSON fields)
════════════════════════════════════════════════════════════════ */
export const createProduct = async (req, res) => {
  try {
    const body = { ...req.body };
console.log("BODY:", body);
console.log("FILES:", req.files);
    // Parse JSON fields sent as strings from FormData
    if (body.tags && typeof body.tags === "string") {
  body.tags = JSON.parse(body.tags);
}
    if (body.dimensions && typeof body.dimensions === "string") {
      body.dimensions = JSON.parse(body.dimensions);
    }

    // Upload images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = await Promise.all(
        req.files.map(async (file, idx) => {
          const result = await uploadToCloud(file);
          return {
            url:       result.secure_url,
            public_id: result.public_id,
            isPrimary: idx === 0,
          };
        })
      );
    }

    const product = await Product.create({ ...body, images });

    res.status(201).json({ success: true, data: product, message: "Product created successfully" });
  } catch (err) {
  console.error("CREATE PRODUCT ERROR:", err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  res.status(500).json({
    success: false,
    message: err.message
  });
}
};

/* ════════════════════════════════════════════════════════════════
   PUT /api/products/:id
════════════════════════════════════════════════════════════════ */
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    const body = { ...req.body };

    if (body.tags && typeof body.tags === "string") {
      body.tags = body.tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
    if (body.dimensions && typeof body.dimensions === "string") {
      body.dimensions = JSON.parse(body.dimensions);
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = await Promise.all(
        req.files.map(async (file, idx) => {
          const result = await uploadToCloud(file);
          return {
            url:       result.secure_url,
            public_id: result.public_id,
            isPrimary: product.images.length === 0 && idx === 0,
          };
        })
      );
      body.images = [...product.images, ...newImages];
    }

    // Handle image deletions (pass array of public_ids to delete)
    if (body.deleteImages) {
      const toDelete = Array.isArray(body.deleteImages) ? body.deleteImages : [body.deleteImages];
      await Promise.all(toDelete.map((id) => deleteFromCloud(id)));
      body.images = (body.images || product.images).filter(
        (img) => !toDelete.includes(img.public_id)
      );
      delete body.deleteImages;
    }

    Object.assign(product, body);
    await product.save();

    res.json({ success: true, data: product, message: "Product updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════════════
   DELETE /api/products/:id
════════════════════════════════════════════════════════════════ */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    // Remove cloud images
    if (product.images?.length > 0) {
      await Promise.all(
        product.images.map((img) => img.public_id && deleteFromCloud(img.public_id))
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
   Body: { status: "active" | "inactive" | "draft" }
════════════════════════════════════════════════════════════════ */
export const toggleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive", "draft"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, data: product, message: `Product marked as ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════════════
   DELETE /api/products/bulk-delete
   Body: { ids: [...] }
════════════════════════════════════════════════════════════════ */
export const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length)
      return res.status(400).json({ success: false, message: "No product IDs provided" });

    const products = await Product.find({ _id: { $in: ids } });

    // Delete cloud images for all
    await Promise.all(
      products.flatMap((p) =>
        (p.images || []).map((img) => img.public_id && deleteFromCloud(img.public_id))
      )
    );

    await Product.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${products.length} product(s) deleted` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════════════
   GET /api/products/stats
════════════════════════════════════════════════════════════════ */
export const getProductStats = async (_req, res) => {
  try {
    const [stats] = await Product.aggregate([
      {
        $group: {
          _id:           null,
          total:         { $sum: 1 },
          active:        { $sum: { $cond: [{ $eq: ["$status", "active"] },   1, 0] } },
          inactive:      { $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } },
          draft:         { $sum: { $cond: [{ $eq: ["$status", "draft"] },    1, 0] } },
          totalQty:      { $sum: "$quantity" },
          avgPrice:      { $avg: "$price" },
          outOfStock:    { $sum: { $cond: [{ $lte: ["$quantity", 0] }, 1, 0] } },
        },
      },
    ]);

    res.json({ success: true, data: stats || {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};