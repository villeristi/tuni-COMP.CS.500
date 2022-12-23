const Router = require('./router');
const { isAdmin } = require('../utils/auth');
const { getValidFields } = require('../utils/helpers');
const {
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  createProduct,
  updatableFields,
} = require('../services/product');

const productRouter = new Router();

/**
 * GET products
 */
productRouter.get('/api/products', async (req, res) => {
  if (!req.user) {
    return res.fail('Only logged-in users are allowed to view products!', 403);
  }

  const products = await getProducts();
  return res.json(products);
});

/**
 * GET product
 */
productRouter.get('/api/products/:productId', async (req, res) => {
  if (!req.user) {
    return res.fail('Only logged-in users are allowed to view products!', 403);
  }

  const productId = req.params?.productId;
  const product = await getProduct(productId);

  if (!product) {
    return res.fail(`Product with id ${productId} not found!`, 404);
  }

  return res.json(product);
});

/**
 * POST product
 */
productRouter.post('/api/products', async (req, res) => {
  if (!req.isJson) {
    return res.fail('Invalid Content-Type. Expected application/json', 400);
  }

  if (!isAdmin(req.user)) {
    return res.fail('Only admins are allowed to create products!', 403);
  }

  const newProduct = await createProduct(req.body);

  return res.json(newProduct, 201);
});

/**
 * PUT product
 */
productRouter.put('/api/products/:productId', async (req, res) => {
  const { productId } = req.params;

  if (!req.isJson) {
    return res.fail('Invalid Content-Type. Expected application/json', 400);
  }

  if (!isAdmin(req.user)) {
    return res.fail('Only admins are allowed to update products!', 403);
  }

  const updatedFields = getValidFields(req.body, updatableFields);
  const updatedProduct = await updateProduct(productId, updatedFields);

  if (!updatedProduct) {
    return res.fail(`Product with id ${productId} not found!`, 404);
  }

  return res.json(updatedProduct);
});

/**
 * DELETE product
 */
productRouter.delete('/api/products/:productId', async (req, res) => {
  const { productId } = req.params;

  if (!isAdmin(req.user)) {
    return res.fail('Only admins are allowed to delete products!', 403);
  }

  const deletedProduct = await deleteProduct(productId);

  if (!deletedProduct) {
    return res.fail(`Product with id ${productId} not found!`, 404);
  }

  return res.json(deletedProduct);
});

module.exports = productRouter;
