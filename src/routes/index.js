const Router = require('./router');

const authRouter = require('./auth');
const userRouter = require('./users');
const productRouter = require('./products');

const mainRouter = new Router();

mainRouter.attachRouters([
  authRouter,
  userRouter,
  productRouter,
]);

module.exports = mainRouter;
