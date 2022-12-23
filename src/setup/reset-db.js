const { connectDB, disconnectDB } = require('../models/db');
const User = require('../models/user');
const Order = require('../models/order');
const Product = require('../models/product');

const users = require('./users.json').map((user) => ({ ...user }));
const products = require('./products.json').map((product) => ({ ...product }));

(async () => {
  connectDB();

  try {
    await Order.deleteMany({});
  } catch (err) {
    console.error(err);
  }

  try {
    await Product.deleteMany({});
    await Product.create(products);
    console.log('Created products');
  } catch (err) {
    console.err(err);
  }

  await User.deleteMany({});
  await User.create(users);
  console.log(`Created users`);

  disconnectDB();
})();
