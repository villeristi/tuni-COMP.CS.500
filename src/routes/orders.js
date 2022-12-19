const responseUtils = require('../utils/responseUtils');
const { handleResource } = require('../utils/router');

const { isAdmin, getCurrentUser } = require('../utils/auth');
const { getOrders, getOrder } = require('../services/order');

const HTTPError = require('../errors/http-error');

const RESOURCE_BASE = '/api/orders'

/**
 * Handler-methods
 */
const methods = {

  /**
   * Fetch all orders
   *
   * @param  {...any} args
   * @returns Array[Order]
   */
  'GET_ROOT': async (...args) => {
    const [_, request, response] = args;
    const currentUser = getCurrentUser(request);

    if(!currentUser) {
      return responseUtils.forbidden(response);
    }

    const customerId = isAdmin(request) ? null : currentUser.id;

    const orders = await getOrders(customerId);
    return responseUtils.sendJson(response, orders);
  },

  /**
   * Fetch a single order
   *
   * @param  {...any} args
   * @returns Order
   */
  'GET': async (...args) => {
    const [id, request, response] = args;
    const currentUser = getCurrentUser(request);

    if(!currentUser) {
      return responseUtils.forbidden(response);
    }

    const customerId = isAdmin(request) ? null : currentUser.id;
    const order = await getOrder(id, customerId);

    if(!order) {
      throw new HTTPError({
        message: `Order with id ${id} not found!`,
        status: 404,
      });
    }

    return responseUtils.sendJson(response, order);
  },

  'DEFAULT': async (...args) => {
    const [_, __, response] = args;
    return responseUtils.methodNotAllowed(response);
  }
}

module.exports = async (request, response) => {
  return await handleResource(request, response, RESOURCE_BASE, methods);
}
