import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import authenticate from "../middleware/auth.js";

const router = Router();

function createToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({ success: false, message: "Name, email and password are required" });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            return res.status(409).json({ success: false, message: "Email is already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword
            },
            select: {
                id: true,
                name: true,
                email: true,
                xp: true,
                gems: true,
                hearts: true,
                streak: true
            }
        });

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            token: createToken(user.id),
            user
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ success: false, message: "Could not create account" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email?.trim() || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const safeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            xp: user.xp,
            gems: user.gems,
            hearts: user.hearts,
            streak: user.streak
        };

        res.json({
            success: true,
            message: "Login successful",
            token: createToken(user.id),
            user: safeUser
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Could not log in" });
    }
});

router.get("/me", authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                name: true,
                email: true,
                xp: true,
                gems: true,
                hearts: true,
                streak: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({ success: false, message: "Could not fetch profile" });
    }
});

export default router;
