import express from "express";
import prisma from "../lib/prisma.js";
import authenticate from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
    try {
        const saved = await prisma.userSave.findUnique({
            where: { userId: req.userId }
        });

        res.json({
            success: true,
            data: saved ? saved.data : null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Could not load cloud save"
        });
    }
});

router.put("/", authenticate, async (req, res) => {
    try {
        const data = req.body?.data;

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            return res.status(400).json({
                success: false,
                message: "A valid save object is required"
            });
        }

        const saved = await prisma.userSave.upsert({
            where: { userId: req.userId },
            create: {
                userId: req.userId,
                data
            },
            update: {
                data
            }
        });

        res.json({
            success: true,
            message: "Cloud save updated successfully",
            updatedAt: saved.updatedAt
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Could not update cloud save"
        });
    }
});

export default router;
