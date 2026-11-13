const fs = require("fs/promises");
const path = require("path");

const productsFile = path.join(__dirname, "../data/products.json");
const seedFile = path.join(__dirname, "../products.seed.json");

const readProducts = async () => {
  try {
    const contents = await fs.readFile(productsFile, "utf8");
    const products = JSON.parse(contents);
    if (!Array.isArray(products)) {
      throw new Error("The local product catalog must contain a JSON array.");
    }
    return products;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await fs.mkdir(path.dirname(productsFile), { recursive: true });
    const seedContents = await fs.readFile(seedFile, "utf8");
    const seedProducts = JSON.parse(seedContents);
    if (!Array.isArray(seedProducts)) {
      throw new Error("The starter product catalog must contain a JSON array.");
    }
    await writeProducts(seedProducts);
    return seedProducts;
  }
};

const writeProducts = async (products) => {
  await fs.mkdir(path.dirname(productsFile), { recursive: true });
  await fs.writeFile(productsFile, `${JSON.stringify(products, null, 2)}\n`, "utf8");
};

module.exports = { readProducts, writeProducts };
