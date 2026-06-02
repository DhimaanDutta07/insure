import { Request, Response } from "express";
import { createRevenueSchema, updateRevenueSchema } from "../schemas/revenueSchema";
import {
  findRevenuesByTimePeriod,
  createRevenue,
  updateRevenue,
  softDeleteRevenue,
  getRevenueById,
  getAllRevenues as getAllRevenuesRepo
} from "../repositories/revenueRepository";

export const getRevenuesByTimePeriod = async (req: Request, res: Response) => {
  try {
    const siteId = req.params.siteId as string === "all" ? null : req.params.siteId as string;
    const period = req.params.timePeriod as string;
    const revenues = await findRevenuesByTimePeriod(siteId, period);
    res.status(200).json(revenues);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

export const getAllRevenues = async (req: Request, res: Response) => {
  try {
    const revenues = await getAllRevenuesRepo();
    res.status(200).json(revenues);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getRevenue = async (req: Request, res: Response) => {
  try {
    const revenue = await getRevenueById(req.params.id as string);
    if (!revenue) {
      res.status(404).json({ error: "Revenue not found" });
      return;
    }
    res.status(200).json(revenue);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createRevenueHandler = async (req: Request, res: Response) => {
  try {
    const data = createRevenueSchema.parse(req.body);
    const revenue = await createRevenue({
      ...data,
      month: new Date(data.month),
    });
    res.status(201).json(revenue);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

export const updateRevenueHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = updateRevenueSchema.parse(req.body);
    const revenue = await updateRevenue(id, {
      ...data,
      month: data.month ? new Date(data.month) : undefined,
    });
    res.status(200).json(revenue);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

export const deleteRevenueHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const revenue = await softDeleteRevenue(id);
    res.status(200).json(revenue);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};