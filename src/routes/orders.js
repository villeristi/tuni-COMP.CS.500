const Router = require('./router');

const { isAdmin } = require('../utils/auth');
const { getOrders, getOrder, createOrder } = require('../services/order');

const orderRouter = new Router();

/**
 * GET orders
 */
orderRouter.get('/api/orders', async (req, res) => {
  if (!req.user) {
    return res.fail('Only logged-in users are allowed to view orders!', 403);
  }

  const customerId = isAdmin(req.user) ? null : req.user.id;
  const orders = await getOrders(customerId);

  return res.json(orders);
});

/**
 * GET order
 */
orderRouter.get('/api/orders/:orderId', async (req, res) => {
  if (!req.user) {
    return res.fail('Only logged-in users are allowed to view orders!', 403);
  }

  const orderId = req.params?.orderId;
  const customerId = isAdmin(req.user) ? null : req.user.id;
  const order = await getOrder(orderId, customerId);

  if (!order) {
    return res.fail(`Order with id ${orderId} not found!`);
  }

  return res.json(order);
});

/**
 * POST order
 */
orderRouter.post('/api/orders', async (req, res) => {
  if (!req.user) {
    return res.fail('Only logged-in users are allowed to create orders!', 403);
  }

  if (isAdmin(req.user)) {
    return res.fail('Admins are not allowed to create orders!', 403);
  }

  const order = await createOrder(req.body);

  return res.json(order, 201);
});

module.exports = orderRouter;
