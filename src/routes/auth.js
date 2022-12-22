const Router = require('./router');
const { login } = require('../utils/auth');

const authRouter = new Router();

/**
 * Login
 */
authRouter.post('/api/auth/login', async (req, res) => {
  const loginRes = await login(req.body);

  if(!loginRes?.token) {
    return res.fail('email or password incorrect!', 400);
  }

  return res.json({ token: loginRes.token });
});

/**
 * Register
 */
authRouter.post('/api/auth/register', async (req, res) => {
  // TODO:
  return res.json({ 'foo': 'bar' });
});


module.exports = authRouter;
