import mongoose from "mongoose";

/**
 * StockEntry — one document per stock update action.
 * Created every time super_admin updates a product's quantity
 * via PATCH /api/products/:id/stock.
 */
const stockEntrySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, default: "" },
    productSku: { type: String, default: "" },
    category: { type: String, default: "" },

    previousQty: { type: Number, required: true },
    newQty: { type: Number, required: true },
    change: { type: Number, required: true },

    notes: { type: String, trim: true, default: "" },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Denormalised date parts for fast aggregation
    date: { type: String, required: true }, 
    week: { type: Number, required: true }, 
    month: { type: Number, required: true }, 
    year: { type: Number, required: true },
  },
  { timestamps: true },
);

stockEntrySchema.index({ product: 1, createdAt: -1 });
stockEntrySchema.index({ date: 1 });
stockEntrySchema.index({ year: 1, month: 1 });
stockEntrySchema.index({ year: 1, week: 1 });

const StockEntry = mongoose.model("StockEntry", stockEntrySchema);
export default StockEntry;
