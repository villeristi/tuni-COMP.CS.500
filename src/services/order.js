const Order = require('../models/order');

/**
 * Transform objects from db (as we don't want to display those as is)
 */

const ProductDTO = (productInDB) => {
  return {
    id: productInDB._id,
    name: productInDB.name,
    price: productInDB.price,
    description: productInDB.description,
  }
}

const ItemDTO = (itemInDb) => {
  return {
    id: itemInDb._id,
    quantity: itemInDb.quantity,
    product: ProductDTO(itemInDb.product),
  }
}

const OrderDTO = (orderInDb) => {
  return {
    id: orderInDb._id,
    customerId: orderInDb.customerId,
    items: orderInDb.items.map(ItemDTO),
  };
}

/**
 * Fetch all orders
 *
 * @returns Order[]
 */
const getOrders = async (customerId = null) => {
  const filters = customerId ? { customerId } : {};
  const orders = await Order.find(filters).populate('items');

  return orders?.map((order) => OrderDTO(order));
}

/**
 * Fetch a single order
 *
 * @param {string} orderId
 * @param {string|null} customerId
 * @returns
 */
const getOrder = async (orderId, customerId = null) => {
  const filters = !customerId ? { _id: orderId } : { _id: orderId, customerId };
  const order = await Order.findOne(filters).populate('items');

  return order ? OrderDTO(order) : null;
}

module.exports = {
  getOrders,
  getOrder,
}
