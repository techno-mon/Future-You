import { Router } from "express";
import prisma from "../lib/prisma.js";
import authenticate from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", async (req, res) => {
    try {
        const habits = await prisma.habit.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: "asc" }
        });

        res.json({ success: true, habits });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Could not fetch habits" });
    }
});

router.post("/", async (req, res) => {
    try {
        const { title } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({ success: false, message: "Habit title is required" });
        }

        const habit = await prisma.habit.create({
            data: {
                title: title.trim(),
                userId: req.userId
            }
        });

        res.status(201).json({ success: true, habit });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Could not create habit" });
    }
});

router.patch("/:id", async (req, res) => {
    try {
        const { title, completed } = req.body;

        if (title === undefined && completed === undefined) {
            return res.status(400).json({ success: false, message: "Provide a title or completed value" });
        }

        if (title !== undefined && (typeof title !== "string" || !title.trim())) {
            return res.status(400).json({ success: false, message: "Habit title cannot be empty" });
        }

        if (completed !== undefined && typeof completed !== "boolean") {
            return res.status(400).json({ success: false, message: "Completed must be true or false" });
        }

        const result = await prisma.habit.updateMany({
            where: { id: req.params.id, userId: req.userId },
            data: {
                ...(title !== undefined ? { title: title.trim() } : {}),
                ...(completed !== undefined ? { completed } : {})
            }
        });

        if (result.count === 0) {
            return res.status(404).json({ success: false, message: "Habit not found" });
        }

        const habit = await prisma.habit.findFirst({
            where: { id: req.params.id, userId: req.userId }
        });

        res.json({ success: true, habit });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Could not update habit" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const result = await prisma.habit.deleteMany({
            where: { id: req.params.id, userId: req.userId }
        });

        if (result.count === 0) {
            return res.status(404).json({ success: false, message: "Habit not found" });
        }

        res.json({ success: true, message: "Habit deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Could not delete habit" });
    }
});

export default router;
