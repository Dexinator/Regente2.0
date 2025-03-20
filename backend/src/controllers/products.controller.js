import { getAllProducts } from "../models/products.model.js";

export const fetchProducts = async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo productos" });
  }
};
