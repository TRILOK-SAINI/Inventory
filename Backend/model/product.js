import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    shortDescription: {
      type: String,
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    comparePrice: {
      type: Number,
      min: [0, "Compare price cannot be negative"],
      default: null,
    },

    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },

    unit: {
      type: String,
      enum: ["piece", "kg", "litre", "box", "set", "pair"],
      default: "piece",
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    brand: {
      type: String,
      trim: true,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String },          // cloudinary / s3 key
        isPrimary: { type: Boolean, default: false },
      },
    ],

    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "active",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    weight: {
      type: Number,
      min: 0,
      default: null,
    },

    dimensions: {
      length: { type: Number, default: null },
      width:  { type: Number, default: null },
      height: { type: Number, default: null },
    },

    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count:   { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,                         // createdAt, updatedAt
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ── Virtuals ───────────────────────────────────────────────── */
productSchema.virtual("discountPercent").get(function () {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

productSchema.virtual("inStock").get(function () {
  return this.quantity > 0;
});

/* ── Pre-save: auto-generate slug ───────────────────────────── */
productSchema.pre("save", async function () {
  if (!this.isModified("name") && this.slug) return;

  let base = this.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  let slug = base;
  let count = 1;

  while (await mongoose.models.Product.findOne({
    slug,
    _id: { $ne: this._id }
  })) {
    slug = `${base}-${count++}`;
  }

  this.slug = slug;
});
/* ── Indexes ────────────────────────────────────────────────── */
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;