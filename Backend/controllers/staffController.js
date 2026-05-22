import Staff from "../model/staff.js";
import User from "../model/user.js";
import { uploadToCloud, deleteFromCloud } from "../utils/CloudUpload.js";

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
    const { name, email, phone, designation, gender, age, address } = req.body;

    if (!name?.trim() || !email?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Name and email are required" });
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ success: false, message: "Phone must be exactly 10 digits" });
    }
    if (
      age !== undefined &&
      age !== "" &&
      (Number(age) < 18 || Number(age) > 100)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Age must be between 18 and 100" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({
          success: false,
          message: "A user with this email already exists",
        });
    }

    // ── Photo upload (same as products) ───────────────────────────
    let photo = { url: "", public_id: "" };
    if (req.file) {
      const result = await uploadToCloud(req.file, "staff");
      photo = { url: result.secure_url, public_id: result.public_id };
    }

    const staff = await Staff.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || "",
      designation: designation || "",
      gender: gender || "",
      age: age !== "" && age !== undefined ? Number(age) : null,
      address: address || "",
      photo,
      shopId,
    });

    await User.create({
      name,
      email: email.toLowerCase().trim(),
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
// export const createStaff = async (req, res) => {
//   try {
//     const shopId = req.user.shopId;
//     const { name, email, phone, designation } = req.body;

//     if (!name || !email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Name and email are required" });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "A user with this email already exists",
//         });
//     }

//     // Create staff profile
//     const staff = await Staff.create({
//       name,
//       email,
//       phone,
//       designation,
//       shopId,
//     });

//     // Create user account for login
//     const user = await User.create({
//       name,
//       email,
//       password: DEFAULT_STAFF_PASSWORD,
//       role: "staff",
//       shopId,
//       staffId: staff._id,
//       isActive: true,
//     });

//     res.status(201).json({
//       success: true,
//       data: staff,
//       credentials: { username: email, password: DEFAULT_STAFF_PASSWORD },
//       message: "Staff created successfully",
//     });
//   } catch (err) {
//     if (err.code === 11000) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Email already exists" });
//     }
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user.shopId;
    const { name, phone, designation, gender, age, address } = req.body;

    if (!name?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ success: false, message: "Phone must be exactly 10 digits" });
    }
    if (
      age !== undefined &&
      age !== "" &&
      (Number(age) < 18 || Number(age) > 100)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Age must be between 18 and 100" });
    }

    const existing = await Staff.findOne({ _id: id, shopId });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Staff member not found" });
    }

    // ── Photo: upload new, delete old from Cloudinary ─────────────
    let photo = existing.photo;
    if (req.file) {
      if (existing.photo?.public_id)
        await deleteFromCloud(existing.photo.public_id);
      const result = await uploadToCloud(req.file, "staff");
      photo = { url: result.secure_url, public_id: result.public_id };
    }

    const updated = await Staff.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        phone: phone || "",
        designation: designation || "",
        gender: gender || "",
        age: age !== "" && age !== undefined ? Number(age) : null,
        address: address || "",
        photo,
      },
      { new: true, runValidators: true },
    );

    res.json({
      success: true,
      data: updated,
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
