import express from "express";
import {
  fetchOrders,
  fetchOrderById,
  addOrder,
  closeOrderById
} from "../controllers/orders.controller.js";

const router = express.Router();

router.get("/", fetchOrders);
router.get("/:id", fetchOrderById);
router.post("/", addOrder);
router.put("/:id/close", closeOrderById);

export default router;
