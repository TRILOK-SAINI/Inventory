import mongoose from "mongoose";

const shopProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
      maxlength: 160,
    },
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      maxlength: 600,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    pincode: {
      type: String,
      trim: true,
      default: "",
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    products: {
      type: [shopProductSchema],
      default: [],
    },
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

shopSchema.pre("save", async function () {
  if (this.code) return;

  const base = this.name
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 24) || "SHOP";

  let code = base;
  let count = 1;

  while (await mongoose.models.Shop.findOne({ code, _id: { $ne: this._id } })) {
    code = `${base}-${count++}`;
  }

  this.code = code;
});

shopSchema.index({ name: "text", ownerName: "text", email: "text", city: "text" });
shopSchema.index({ status: 1, createdAt: -1 });

const Shop = mongoose.model("Shop", shopSchema);
export default Shop;
