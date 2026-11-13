const Product = require("./../models/productModel");
const fs = require("fs");
const mongoose = require("mongoose");
const path = require("path");
const { readProducts, writeProducts } = require("../utils/productStore");
const cloudinary = require('./../utils/cloudinary');

const isDatabaseConnected = () => mongoose.connection.readyState === 1;
const hasCloudinaryConfig = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      (process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET_KEY)
  );
const getNextId = (products) =>
  products.reduce((highest, product) => Math.max(highest, Number(product.id) || 0), 0) + 1;
const serializeProduct = (product, req) => {
  const result = product.toObject ? product.toObject() : { ...product };
  if (result.image?.startsWith("/images/")) {
    const backendUrl = (process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
    result.image = `${backendUrl}${result.image}`;
  }
  return result;
};
const getProductData = (body) => {
  const { name, category, new_price, old_price, description = "" } = body;
  const newPrice = Number(new_price);
  const oldPrice = Number(old_price);

  if (!name?.trim() || !["men", "women", "kids"].includes(category)) {
    const error = new Error("Enter a product name and choose a valid category.");
    error.statusCode = 400;
    throw error;
  }
  if (!Number.isFinite(newPrice) || newPrice <= 0 || !Number.isFinite(oldPrice) || oldPrice < newPrice) {
    const error = new Error("Enter a valid offer price and a regular price that is at least as high.");
    error.statusCode = 400;
    throw error;
  }

  return {
    name: name.trim(),
    category,
    description: String(description).trim(),
    new_price: newPrice,
    old_price: oldPrice,
  };
};
const saveImage = async (file, req) => {
  if (!file) {
    const error = new Error("Choose a product image.");
    error.statusCode = 400;
    throw error;
  }
  if (process.env.NODE_ENV === "production" && !hasCloudinaryConfig()) {
    const error = new Error("Product image storage is not configured for production.");
    error.statusCode = 503;
    throw error;
  }
  if (hasCloudinaryConfig()) {
    const result = await cloudinary.uploader.upload(file.path, { folder: "images" });
    await fs.promises.unlink(file.path);
    return result.secure_url;
  }
  return `${process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`}/images/${file.filename}`;
};
const deleteLocalImage = async (image) => {
  if (!image) return;
  const imagePathname = new URL(image, "http://localhost").pathname;
  if (!imagePathname.startsWith("/images/")) return;
  const filename = imagePathname.slice("/images/".length);
  if (filename !== path.basename(filename)) return;
  const imagePath = path.join(__dirname, "../uploads/images", filename);
  try {
    await fs.promises.unlink(imagePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};

exports.getAllProducts = async (req, res, next) => {
  try {
    const products = isDatabaseConnected()
      ? await Product.find({}).sort({ id: 1 })
      : await readProducts();
    res.status(200).json(products.map((product) => serializeProduct(product, req)));
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const data = getProductData(req.body);
    const image = await saveImage(req.file, req);
    let product;
    if (isDatabaseConnected()) {
      const lastProduct = await Product.findOne({}).sort({ id: -1 }).select("id");
      product = await Product.create({
        ...data,
        id: (lastProduct?.id || 0) + 1,
        image,
      });
    } else {
      const products = await readProducts();
      product = { ...data, id: getNextId(products), image, available: true, date: new Date() };
      products.push(product);
      await writeProducts(products);
    }
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      const error = new Error("Product not found.");
      error.statusCode = 404;
      throw error;
    }
    let product;
    if (isDatabaseConnected()) {
      product = await Product.findOneAndDelete({ id });
    } else {
      const products = await readProducts();
      product = products.find((item) => Number(item.id) === id);
      if (product) await writeProducts(products.filter((item) => Number(item.id) !== id));
    }
    if (!product) {
      const error = new Error("Product not found.");
      error.statusCode = 404;
      throw error;
    }
    if (hasCloudinaryConfig() && product.image?.includes("res.cloudinary.com")) {
      const imageId = product.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`images/${imageId}`);
    } else {
      await deleteLocalImage(product.image);
    }
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
};

exports.getNewCollections = async (req, res, next) => {
  try {
    const newCollection = isDatabaseConnected()
      ? await Product.find({}).sort({ date: -1 }).limit(8)
      : (await readProducts()).slice(-8).reverse();
    res.status(200).json(newCollection.map((product) => serializeProduct(product, req)));
  } catch (err) {
    next(err);
  }
};

exports.getPopularInWomen = async (req, res, next) => {
  try {
    const products = isDatabaseConnected()
      ? await Product.find({ category: "women" }).sort({ date: -1 }).limit(4)
      : (await readProducts())
          .filter((product) => product.category === "women")
          .slice(0, 4);
    const popularInWomen = products.slice(0, 4);
    res.status(200).json(popularInWomen.map((product) => serializeProduct(product, req)));
  } catch (err) {
    next(err);
  }
};
