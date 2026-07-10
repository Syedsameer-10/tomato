import express from "express";
import cors from "cors";

import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/", publicRoutes);
app.use("/api", authRoutes);
app.use("/api", orderRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

export default app;
