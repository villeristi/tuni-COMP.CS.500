const responseUtils = require('../utils/responseUtils');
const { isJson } = require('../utils/requestUtils');
const { handleResource } = require('../utils/router');

const { isAdmin, getCurrentUser } = require('../utils/auth');
const { parseBodyJson } = require('../utils/requestUtils');
const {
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  createProduct: createProductService,
  updatableFields,
} = require('../services/product');

const HTTPError = require('../errors/http-error');
const RESOURCE_BASE = '/api/products'

/**
 * Handler-methods
 */
const methods = {

  /**
   * Fetch all products
   *
   * @param  {...any} args
   * @returns Array[Product]
   */
  'GET_ROOT': async (...args) => {
    const [_, request, response] = args;
    if(!getCurrentUser(request)) {
      return responseUtils.forbidden(response);
    }

    const products = await getProducts();
    return responseUtils.sendJson(response, products);
  },

  /**
   * Create product
   *
   * @param  {...any} args
   */
  'POST_ROOT': async (...args) => {
    const [_, request, response] = args;

    if (!isJson(request)) {
      throw new HTTPError({
        message: 'Invalid Content-Type. Expected application/json',
        status: 400,
      });
    }

    if(!isAdmin(request)) {
      throw new HTTPError({
        message: `Only admins are allowed to create products!`,
        status: 400,
      });
    }

    const payload = await parseBodyJson(request);

    // Get only allowed values from payload
    const valuesToAdd = updatableFields.reduce((obj, key) => {
      if(payload[key]) {
        return {...obj, [key]: payload[key]}
      }

      return obj;
    }, {});

    if(!updatableFields.every((key) => valuesToAdd.hasOwnProperty(key))) {
      const requiredFieldsMessage = updatableFields.join(', ');
      throw new HTTPError({
        message: `Required fields missing: ${requiredFieldsMessage}`,
        status: 400,
      });
    }

    const newProduct = await createProductService(valuesToAdd);

    return responseUtils.sendJson(response, newProduct);
  },

  /**
   * Fetch single product
   * @param  {...any} args
   * @returns
   */
  'GET': async (...args) => {
    const [id, _, response] = args;
    const product = await getProduct(id);

    if(!product) {
      throw new HTTPError({
        message: `Product with id ${id} not found!`,
        status: 404,
      });
    }

    return responseUtils.sendJson(response, product);
  },

  /**
   * Update product
   * @param  {...any} args
   */
  'PUT': async (...args) => {
    const [id, request, response] = args;

    if (!isJson(request)) {
      throw new HTTPError({
        message: 'Invalid Content-Type. Expected application/json',
        status: 400,
      });
    }

    if(!isAdmin(request)) {
      throw new HTTPError({
        message: `Only admins are allowed to update products!`,
        status: 400,
      });
    }

    const payload = await parseBodyJson(request);

    // Get only allowed values from payload
    const valuesToUpdate = updatableFields.reduce((obj, key) => {
      if(payload[key]) {
        return {...obj, [key]: payload[key]}
      }

      return obj;
    }, {});

    const updatedProduct = await updateProduct(id, valuesToUpdate);

    if(!updatedProduct) {
      throw new HTTPError({
        message: `Product with id ${id} not found!`,
        status: 404,
      });
    }

    return responseUtils.sendJson(response, updatedProduct);
  },

  /**
   * Delete product
   * @param  {...any} args
   */
  'DELETE': async (...args) => {
    const [id, request, response] = args;

    if(!isAdmin(request)) {
      throw new HTTPError({
        message: `Only admins are allowed to delete products!`,
        status: 400,
      });
    }

    const deleted = await deleteProduct(id);

    if(!deleted) {
      throw new HTTPError({
        message: `Product with id ${id} not found!`,
        status: 404,
      });
    }

    return responseUtils.sendJson(response, deleted);
  },

  'DEFAULT': async (...args) => {
    const [_, __, response] = args;
    return responseUtils.methodNotAllowed(response);
  }
};

module.exports = async (request, response) => {
  return await handleResource(request, response, RESOURCE_BASE, methods);
}
