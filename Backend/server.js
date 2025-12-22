import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import connectdb from "./config/db.js";
import { env } from "./config/env.js";

import auth from "./Router/auth.js";
import ForgotPassword from "./Router/forgetpassword.js";
import donorRoutes from "./Router/donor.js";
import orgRoutes from "./Router/org.js";
import adminRoutes from "./Router/admin.js";
import geoRoutes from "./Router/geo.js";
import healthRoutes from "./Router/health.js";
import notificationRoutes from "./Router/notification.js";
import requestRoutes from "./Router/requests-complete.js";
import donationRoutes from "./Router/donation.js";
import appointmentRoutes from "./Router/appointments.js";

const app = express();

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(morgan(env.env === "production" ? "combined" : "dev"));

// Basic rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
});
app.use(["/api/login", "/api/signup"], authLimiter);

connectdb();

// api health
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "OK" });
})

// Routes
app.use("/api", auth);
app.use("/api", ForgotPassword);
app.use("/api/donor", donorRoutes);
app.use("/api/org", orgRoutes);
app.use("/api/admin/donations", donationRoutes); // More specific route first
app.use("/api/admin", adminRoutes);
app.use("/api/geo", geoRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/notifications", notificationRoutes);
// app.use("/health", healthRoutes); // Disabling external healthRoutes file for now to be simple

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(env.port, () => {
    console.log(`Server running at http://localhost:${env.port}`);
  });
}

export default app;
