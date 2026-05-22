import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./db/dbconnection.js";
import productRoute from "./routes/productRoute.js";
import authRoute from "./routes/authRoute.js";
import shopRoute from "./routes/shopRoute.js";
import staffRoute from "./routes/staffRoute.js";
import orderRoute from "./routes/orderRoute.js";
import stockEntryRoute   from "./routes/stockEntryRoute.js";

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : [];

app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use("/api/auth", authRoute);
app.use("/api/products", productRoute);
app.use("/api/shops", shopRoute);
app.use("/api/staff", staffRoute);
app.use("/api/orders", orderRoute);
app.use("/api/stock-entries", stockEntryRoute);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server running at port ${PORT}`);
  });
});
