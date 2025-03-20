import express from "express";
import { fetchOrders, addOrder } from "../controllers/orders.controller.js";

const router = express.Router();

router.get("/", fetchOrders);
router.post("/", addOrder);

export default router;
