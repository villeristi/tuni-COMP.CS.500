const Router = require('./router');

const { isAdmin } = require('../utils/auth');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updatableFields,
} = require('../services/user');

const { getValidFields } = require('../utils/helpers');


const userRouter = new Router();


/**
 * GET users
 */
userRouter.get('/api/users', async (req, res) => {
  if(!isAdmin(req.user)) {
    return res.fail('Only admins are allowed to view users!', 403);
  }

  const users = await getUsers();
  return res.json(users);
});

/**
 * GET user
 */
userRouter.get('/api/users/:userId', async (req, res) => {
  if(!isAdmin(req.user)) {
    return res.fail('Only admins are allowed to view users!', 403);
  }

  const userId = req.params?.userId;
  const user = await getUser(userId);

  if(!user) {
    return res.fail(`User with id ${userId} not found!`, 404);
  }

  return res.json(user);
});

/**
 * PUT user
 */
userRouter.put('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!req.isJson) {
    return res.fail('Invalid Content-Type. Expected application/json', 400);
  }

  if(!isAdmin(req.user)) {
    return res.fail('Only admins are allowed to view users!', 403);
  }

  if(req.user?.id === userId) {
    return res.fail(`You can't update yourself!`, 400);
  }

  const updatedFields = getValidFields(req.body, updatableFields);
  const updatedUser = await updateUser(userId, updatedFields);

  if(!updatedUser) {
    return res.fail(`User with id ${userId} not found!`, 404);
  }

  return res.json(updatedUser);
});

/**
 * DELETE user
 */
userRouter.delete('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;

  if(!isAdmin(req.user)) {
    return res.fail('Only admins are allowed to delete users!', 403);
  }

  const deletedUser = await deleteUser(userId);

  if(!deletedUser) {
    return res.fail(`User with id ${userId} not found!`, 404);
  }

  return res.json(deletedUser);
});


module.exports = userRouter;
