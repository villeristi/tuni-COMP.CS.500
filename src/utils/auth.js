const jwt = require('jsonwebtoken');

const User = require('../models/user');
const { REQUIRED_KEYS_FOR_LOGIN, AUTH_HEADER, ROLE_ADMIN } = require('../constants');

// TODO:
const JWT_SECRET = 'sciZbEfXYYBkdDQoe*eKqC9TmNeXyfbT';

/**
 * Check if current user is admin
 *
 * @param {object} user
 */
const isAdmin = (user) => user?.role === ROLE_ADMIN;

/**
 * Get current user from token
 *
 * @param {http.request} request
 */
const getCurrentUser = (request) => {
  const token = getToken(request);

  try {
    if(token) {
      return jwt.verify(token, JWT_SECRET);
    }
  } catch(err) {
    console.error(err);
  }

  return null;
}

/**
 * Perform login
 *
 * @param {body} object
 * @returns object
 */
const login = async (body) => {
  try {
    // const body = await parseBodyJson(request);

    // Check if both ['username', 'email'] are present in body
    if(REQUIRED_KEYS_FOR_LOGIN.every((key) => body.hasOwnProperty(key))) {
      const user = await User.findOne({ email: body.email }).exec();

      if(await user.checkPassword(body.password)) {
        const { _id: id, name, email, role } = user;
        const token = jwt.sign({ id, name, email, role }, JWT_SECRET);

        return {
          token,
        }
      }
    }

    return null;

  } catch(err) {
    console.error(err);
    return null;
  }
}

/**
 *
 * Get token from authorization-header
 *
 * @param {http.request} request
 */
const getToken = (request) => {
  const authHeader = request.headers.authorization;

  // We have a correct type?
  if(authHeader?.startsWith(AUTH_HEADER)) {
    const splitted = authHeader.split(' ');

    return splitted.length > 1 ? splitted[1] : null;
  }

  return null;
}

module.exports = {
  isAdmin,
  login,
  getCurrentUser,
};
