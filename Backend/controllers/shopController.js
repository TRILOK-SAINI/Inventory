import Shop from "../model/shop.js";
import User from "../model/user.js";

const DEFAULT_SHOP_PASSWORD = "123456";

const populateShop = (query) =>
  query
    .populate("adminUser", "name email role isActive")
    .populate("products.product", "name sku price quantity category images status");

const normalizeProducts = (products = []) =>
  products
    .filter((item) => item.product)
    .map((item) => ({
      product: item.product,
      allocatedQuantity: Number(item.allocatedQuantity || 0),
      sellingPrice: item.sellingPrice === "" || item.sellingPrice == null ? null : Number(item.sellingPrice),
      notes: item.notes || "",
    }));

export const getAllShops = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, sort = "-createdAt" } = req.query;
    const filter = {};

    if (search) filter.$text = { $search: search };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Shop.countDocuments(filter);
    const shops = await populateShop(
      Shop.find(filter).sort(sort).skip(skip).limit(Number(limit))
    ).lean();

    res.json({
      success: true,
      data: shops,
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

export const getShopById = async (req, res) => {
  try {
    const shop = await populateShop(Shop.findById(req.params.id));
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });
    res.json({ success: true, data: shop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createShop = async (req, res) => {
  try {
    const body = { ...req.body, products: normalizeProducts(req.body.products) };

    const existingEmail = await User.findOne({ email: body.email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "A user with this email already exists" });
    }

    const shop = await Shop.create(body);
    const admin = await User.create({
      name: body.ownerName,
      email: body.email,
      password: DEFAULT_SHOP_PASSWORD,
      role: "shop_admin",
      shopId: shop._id,
      isActive: body.status !== "inactive",
    });

    shop.adminUser = admin._id;
    await shop.save();

    const savedShop = await populateShop(Shop.findById(shop._id));

    res.status(201).json({
      success: true,
      data: savedShop,
      credentials: {
        username: admin.email,
        password: DEFAULT_SHOP_PASSWORD,
      },
      message: "Shop and shop admin created successfully",
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ success: false, message: `${field} already exists` });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });

    const nextEmail = req.body.email?.toLowerCase();
    if (nextEmail && nextEmail !== shop.email) {
      const existingEmail = await User.findOne({ email: nextEmail, _id: { $ne: shop.adminUser } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: "A user with this email already exists" });
      }
    }

    Object.assign(shop, {
      ...req.body,
      products: normalizeProducts(req.body.products),
    });
    await shop.save();

    if (shop.adminUser) {
      await User.findByIdAndUpdate(shop.adminUser, {
        name: shop.ownerName,
        email: shop.email,
        isActive: shop.status !== "inactive",
        shopId: shop._id,
      });
    }

    const savedShop = await populateShop(Shop.findById(shop._id));
    res.json({ success: true, data: savedShop, message: "Shop updated successfully" });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ success: false, message: `${field} already exists` });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });

    if (shop.adminUser) await User.findByIdAndDelete(shop.adminUser);
    await shop.deleteOne();

    res.json({ success: true, message: "Shop deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleShopStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });
    if (shop.adminUser) {
      await User.findByIdAndUpdate(shop.adminUser, { isActive: status === "active" });
    }

    const savedShop = await populateShop(Shop.findById(shop._id));
    res.json({ success: true, data: savedShop, message: `Shop marked as ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyShop = async (req, res) => {
  try {
    if (!req.user.shopId) {
      return res.status(404).json({ success: false, message: "No shop assigned to this user" });
    }

    const shop = await populateShop(Shop.findById(req.user.shopId));
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });

    res.json({ success: true, data: shop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
