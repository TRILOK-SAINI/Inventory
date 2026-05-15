import dotenv          from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./db/dbconnection.js";
import productRoute from "./routes/productRoute.js";
import authRoute from "./routes/authRoute.js";


const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(cors({
   origin: process.env.FRONTEND_URL,
   credentials: true
}));


app.use("/api/auth", authRoute);
app.use("/api/products", productRoute);
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server running at port ${PORT}`);
  });
});
