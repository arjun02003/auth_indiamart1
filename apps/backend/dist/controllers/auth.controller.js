"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = exports.listUsers = exports.changePassword = exports.updateProfile = exports.getMe = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = require("jsonwebtoken");
const prisma_1 = require("../utils/prisma");
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password required' });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const valid = await bcryptjs_1.default.compare(password, user.password);
        if (!valid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const jwtSecret = String(process.env.JWT_SECRET ?? 'fallback-secret');
        const token = (0, jsonwebtoken_1.sign)({ id: user.id, email: user.email, role: user.role, name: user.name }, jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' });
        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar },
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Login failed', details: String(error) });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, email: true, role: true, phone: true, avatar: true, createdAt: true },
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const user = await prisma_1.prisma.user.update({
            where: { id: req.user.id },
            data: { name, phone },
            select: { id: true, name: true, email: true, role: true, phone: true },
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const valid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!valid) {
            res.status(400).json({ error: 'Current password is incorrect' });
            return;
        }
        const hashed = await bcryptjs_1.default.hash(newPassword, 12);
        await prisma_1.prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
        res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Password change failed' });
    }
};
exports.changePassword = changePassword;
const listUsers = async (req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};
exports.listUsers = listUsers;
const createUser = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;
        const exists = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (exists) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }
        const hashed = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_1.prisma.user.create({
            data: { name, email, password: hashed, phone, role: role || 'SALES_AGENT' },
            select: { id: true, name: true, email: true, role: true, phone: true },
        });
        res.status(201).json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'User creation failed' });
    }
};
exports.createUser = createUser;
//# sourceMappingURL=auth.controller.js.map