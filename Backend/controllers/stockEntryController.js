import StockEntry from "../model/stockEntry.js";
import Product from "../model/product.js";

/* ── date helpers ──────────────────────────────────────────── */
function isoWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  );
}

function toYMD(date) {
  return new Date(date).toISOString().slice(0, 10);
}

/* ── Create a stock entry log (called internally from updateStock) ─ */
export const createStockEntry = async ({
  product,
  previousQty,
  newQty,
  notes = "",
  enteredBy,
}) => {
  const now = new Date();
  await StockEntry.create({
    product: product._id,
    productName: product.name,
    productSku: product.sku || "",
    category: product.category || "",
    previousQty,
    newQty,
    change: newQty - previousQty,
    notes,
    enteredBy,
    date: toYMD(now),
    week: isoWeek(now),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
};

/* ════════════════════════════════════════════════════════════════
   GET /api/stock-entries/report
   Query params:
     mode  — "day" | "week" | "month"  (default "day")
     date  — YYYY-MM-DD  used for day mode (default today)
     week  — ISO week number  (used for week mode, default current week)
     month — 1-12  (used for month mode, default current month)
     year  — YYYY   (default current year)
     page  — default 1
     limit — default 50
════════════════════════════════════════════════════════════════ */
export const getReport = async (req, res) => {
  try {
    const now = new Date();
    const {
      mode = "day",
      date = toYMD(now),
      week = String(isoWeek(now)),
      month = String(now.getMonth() + 1),
      year = String(now.getFullYear()),
      page = 1,
      limit = 50,
    } = req.query;

    let filter = {};

    if (mode === "day") {
      filter.date = date;
    } else if (mode === "week") {
      filter.year = Number(year);
      filter.week = Number(week);
    } else if (mode === "month") {
      filter.year = Number(year);
      filter.month = Number(month);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await StockEntry.countDocuments(filter);
    const entries = await StockEntry.find(filter)
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .populate("enteredBy", "name email")
      .lean();

    // Summary aggregation for the current filter
    const [summary] = await StockEntry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalAdded: {
            $sum: { $cond: [{ $gt: ["$change", 0] }, "$change", 0] },
          },
          totalRemoved: {
            $sum: { $cond: [{ $lt: ["$change", 0] }, "$change", 0] },
          },
          productsUpdated: { $addToSet: "$product" },
        },
      },
    ]);

    res.json({
      success: true,
      data: entries,
      summary: summary
        ? {
            totalEntries: summary.totalEntries,
            totalAdded: summary.totalAdded,
            totalRemoved: Math.abs(summary.totalRemoved),
            productsUpdated: summary.productsUpdated.length,
          }
        : {
            totalEntries: 0,
            totalAdded: 0,
            totalRemoved: 0,
            productsUpdated: 0,
          },
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      meta: {
        mode,
        date,
        week: Number(week),
        month: Number(month),
        year: Number(year),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════════════
   GET /api/stock-entries/calendar
   Returns dates that have at least one entry (for calendar highlights).
   Query: year, month
════════════════════════════════════════════════════════════════ */
export const getCalendarDates = async (req, res) => {
  try {
    const now = new Date();
    const { year = now.getFullYear(), month = now.getMonth() + 1 } = req.query;

    const dates = await StockEntry.distinct("date", {
      year: Number(year),
      month: Number(month),
    });

    res.json({ success: true, data: dates.sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
