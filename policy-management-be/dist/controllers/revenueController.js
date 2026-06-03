"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRevenueHandler = exports.updateRevenueHandler = exports.createRevenueHandler = exports.getRevenue = exports.getAllRevenues = exports.getRevenuesByTimePeriod = void 0;
const revenueSchema_1 = require("../schemas/revenueSchema");
const revenueRepository_1 = require("../repositories/revenueRepository");
const getRevenuesByTimePeriod = async (req, res) => {
    try {
        const siteId = req.params.siteId === "all" ? null : req.params.siteId;
        const period = req.params.timePeriod;
        const revenues = await (0, revenueRepository_1.findRevenuesByTimePeriod)(siteId, period);
        res.status(200).json(revenues);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
};
exports.getRevenuesByTimePeriod = getRevenuesByTimePeriod;
const getAllRevenues = async (req, res) => {
    try {
        const revenues = await (0, revenueRepository_1.getAllRevenues)();
        res.status(200).json(revenues);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getAllRevenues = getAllRevenues;
const getRevenue = async (req, res) => {
    try {
        const revenue = await (0, revenueRepository_1.getRevenueById)(req.params.id);
        if (!revenue) {
            res.status(404).json({ error: "Revenue not found" });
            return;
        }
        res.status(200).json(revenue);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getRevenue = getRevenue;
const createRevenueHandler = async (req, res) => {
    try {
        const data = revenueSchema_1.createRevenueSchema.parse(req.body);
        const revenue = await (0, revenueRepository_1.createRevenue)({
            ...data,
            month: new Date(data.month),
        });
        res.status(201).json(revenue);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
};
exports.createRevenueHandler = createRevenueHandler;
const updateRevenueHandler = async (req, res) => {
    try {
        const id = req.params.id;
        const data = revenueSchema_1.updateRevenueSchema.parse(req.body);
        const revenue = await (0, revenueRepository_1.updateRevenue)(id, {
            ...data,
            month: data.month ? new Date(data.month) : undefined,
        });
        res.status(200).json(revenue);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
};
exports.updateRevenueHandler = updateRevenueHandler;
const deleteRevenueHandler = async (req, res) => {
    try {
        const id = req.params.id;
        const revenue = await (0, revenueRepository_1.softDeleteRevenue)(id);
        res.status(200).json(revenue);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
};
exports.deleteRevenueHandler = deleteRevenueHandler;
