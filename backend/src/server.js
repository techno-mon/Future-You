import "dotenv/config";
import express from "express";
import cors from "cors";
import prisma from "./lib/prisma.js";
import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import saveRoutes from "./routes/save.js";

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(",").map(url => url.trim())
        : true
}));

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
    res.send("Welcome to Future You Backend!");
});

app.get("/api/health", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({
            success: true,
            message: "Future You backend and database are running!",
            status: "healthy"
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            message: "Database connection failed",
            status: "unhealthy"
        });
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/save", saveRoutes);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Future You server running on port ${PORT}`);
});

async function shutdown() {
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
