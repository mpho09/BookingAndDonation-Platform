import "dotenv/config";
import express from "express";
import cors from "cors";
import { resourcesRouter } from "./routes/resources.js";
import { bookingsRouter } from "./routes/bookings.js";
import { campaignsRouter } from "./routes/campaigns.js";
import { donationsRouter } from "./routes/donations.js";
import { profilesRouter } from "./routes/profiles.js";
import { notificationsRouter } from "./routes/notifications.js";
import { adminRouter } from "./routes/admin.js";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/resources", resourcesRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/campaigns", campaignsRouter);
app.use("/api/donations", donationsRouter);
app.use("/api/profiles", profilesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/admin", adminRouter);

// Central error handler — keeps stack traces out of API responses.
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Riverside Hub API listening on http://localhost:${port}`);
});
