import mongoose from "mongoose";

// We store staff credentials in the existing User model with role "staff"
// Staff also gets a Staff profile document for extra details

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: String,
    sku: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    total: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    takenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: "Walk-in Customer",
    },
    customerPhone: {
      type: String,
      trim: true,
      default: "",
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "delivered", "cancelled"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

orderSchema.pre("save", async function () {
  if (this.orderNumber) return;
  const count = await mongoose.models.Order.countDocuments();
  this.orderNumber = `ORD-${String(count + 1).padStart(5, "0")}`;
});

orderSchema.index({ shopId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
