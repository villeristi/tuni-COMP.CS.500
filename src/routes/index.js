const Router = require('./router');
const authRouter = require('./auth');
const userRouter = require('./users');

const mainRouter = new Router();

mainRouter.attachRouters([
  authRouter,
  userRouter,
]);

module.exports = mainRouter;
