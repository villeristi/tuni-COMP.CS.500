const Product = require('../models/product');

// Only allow specific fields to be updated
const updatableFields = ['name', 'price', 'image', 'description'];

/**
 * Transform objects from db (as we don't want to display those as is)
 * @param {Product} productInDB
 * @returns
 */
const ProductDTO = (productInDB) => {
  return {
    id: productInDB._id,
    name: productInDB.name,
    price: productInDB.price,
    image: productInDB.image,
    description: productInDB.description,
  };
}

/**
 * Fetch all products
 *
 * @returns Product[]
 */
const getProducts = async () => {
  const products = await Product.find({});

  return products?.map((product) => ProductDTO(product));
}

/**
 * Fetch a single product
 *
 * @returns Product
 */
const getProduct = async (productId) => {
  const product = await Product.findOne({ _id: productId });
  return product ? ProductDTO(product) : null;
}

/**
 * Create a product
 *
 * @returns Product
 */
const createProduct = async (body) => {
  const product = await Product.create({ ...body });
  await product?.validate();

  return product ? ProductDTO(product) : null;
}

/**
 * Update a product
 *
 * @returns Product
 */
const updateProduct = async (productId, body) => {
  const product = await Product.findOneAndUpdate({ _id: productId }, { ...body }, { new: true });
  await product.validate();

  return product ? ProductDTO(product) : null;
}

/**
 * Delete product
 *
 * @returns Product
 */
const deleteProduct = async (productId) => {
  const deleted = await Product.findOneAndRemove({ _id: productId });
  return deleted ? ProductDTO(deleted) : null;
}



module.exports = {
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  createProduct,
  updatableFields,
}
