import Staff from "../model/staff.js";
import User from "../model/user.js";

const DEFAULT_STAFF_PASSWORD = "123456";

export const getMyStaff = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const staff = await Staff.find({ shopId }).lean();
    // Attach user info
    const userIds = staff.map((s) => s._id); // staffId stored in User.staffId
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createStaff = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { name, email, phone, designation } = req.body;

    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, message: "Name and email are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({
          success: false,
          message: "A user with this email already exists",
        });
    }

    // Create staff profile
    const staff = await Staff.create({
      name,
      email,
      phone,
      designation,
      shopId,
    });

    // Create user account for login
    const user = await User.create({
      name,
      email,
      password: DEFAULT_STAFF_PASSWORD,
      role: "staff",
      shopId,
      staffId: staff._id,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: staff,
      credentials: { username: email, password: DEFAULT_STAFF_PASSWORD },
      message: "Staff created successfully",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const staff = await Staff.findOne({ _id: req.params.id, shopId });
    if (!staff)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });

    const { name, phone, designation, isActive } = req.body;

    if (name !== undefined) staff.name = name;
    if (phone !== undefined) staff.phone = phone;
    if (designation !== undefined) staff.designation = designation;
    if (isActive !== undefined) staff.isActive = isActive;

    await staff.save();

    // Sync user account
    await User.findOneAndUpdate(
      { email: staff.email, role: "staff" },
      { name: staff.name, isActive: staff.isActive },
    );

    res.json({
      success: true,
      data: staff,
      message: "Staff updated successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const staff = await Staff.findOne({ _id: req.params.id, shopId });
    if (!staff)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });

    await User.findOneAndDelete({ email: staff.email, role: "staff" });
    await staff.deleteOne();

    res.json({ success: true, message: "Staff deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleStaffStatus = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const staff = await Staff.findOne({ _id: req.params.id, shopId });
    if (!staff)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });

    staff.isActive = !staff.isActive;
    await staff.save();

    await User.findOneAndUpdate(
      { email: staff.email, role: "staff" },
      { isActive: staff.isActive },
    );

    res.json({
      success: true,
      data: staff,
      message: `Staff ${staff.isActive ? "activated" : "deactivated"}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
