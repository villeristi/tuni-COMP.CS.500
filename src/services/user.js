const User = require('../models/user');

// Only allow specific fields to be updated
const updatableFields = ['role'];

/**
 * Transform objects from db (as we don't want to display those as is)
 *
 * @param {User} userInDB
 * @returns
 */
const UserDTO = (userInDB) => {
  return {
    id: userInDB._id,
    name: userInDB.name,
    email: userInDB.email,
    role: userInDB.role,
  };
}

/**
 * Fetch all users
 *
 * @returns User[]
 */
const getUsers = async () => {
  const users = await User.find({});

  return users?.map((user) => UserDTO(user));
}

/**
 * Fetch a single user
 *
 * @returns User[]
 */
const getUser = async (userId) => {
  const user = await User.findOne({ _id: userId });
  return user ? UserDTO(user) : null;
}

/**
 * Update user
 *
 * @returns User
 */
const updateUser = async (userId, body) => {
  const user = await User.findOneAndUpdate({ _id: userId }, { ...body }, { new: true });
  await user?.validate();

  return user ? UserDTO(user) : null;
}

/**
 * Delete User
 *
 * @returns User
 */
const deleteUser = async (userId) => {
  const deleted = await User.findOneAndRemove({ _id: userId });
  return deleted ? UserDTO(deleted) : null;
}


module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updatableFields,
}
