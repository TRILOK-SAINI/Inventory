import dotenv          from "dotenv";
dotenv.config();
import express from "express";
import { connectDB } from "./db/dbconnection.js";
import cors from "cors"


const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors());
import productRoute from "./routes/productRoute.js";
app.use("/api/products", productRoute);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server running at port ${PORT}`);
  });
});
