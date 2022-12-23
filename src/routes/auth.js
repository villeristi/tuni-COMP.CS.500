const Router = require('./router');
const { login } = require('../utils/auth');
const { createUser } = require('../services/user');

const authRouter = new Router();

/**
 * Login
 */
authRouter.post('/api/auth/login', async (req, res) => {
  const loginRes = await login(req.body);

  if (!loginRes?.token) {
    return res.fail('email or password incorrect!', 400);
  }

  return res.json({ token: loginRes.token });
});

/**
 * Register
 */
authRouter.post('/api/auth/register', async (req, res) => {
  if (req.user) {
    return res.fail(`Already logged in as ${req.user.name}`, 418);
  }

  const user = await createUser(req.body);

  return res.json(user, 201);
});

module.exports = authRouter;
