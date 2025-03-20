import express from "express";
import { addEmployee } from "../controllers/employees.controller.js";

const router = express.Router();

router.post("/", addEmployee);

export default router;
