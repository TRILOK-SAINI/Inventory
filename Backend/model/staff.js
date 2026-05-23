import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
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
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not", ""],
      default: "",
    },
    age: {
      type: Number,
      min: 18,
      max: 100,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    photo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    role: {
      type: String,
      default: "staff",
      enum: ["staff"],
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    designation: {
      type: String,
      trim: true,
      default: "",
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const Staff = mongoose.model("Staff", staffSchema);
export default Staff;
