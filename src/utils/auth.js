const jwt = require('jsonwebtoken');

const User = require('../models/user');
const { parseBodyJson } = require('./requestUtils');
const { REQUIRED_KEYS_FOR_LOGIN, AUTH_HEADER, ROLE_ADMIN } = require('../constants');

// TODO:
const JWT_SECRET = 'sciZbEfXYYBkdDQoe*eKqC9TmNeXyfbT';

/**
 * Check if user tries to modify self
 *
 * @param {http.request} request
 * @param {string} currentId
 * @returns
 */
const isCurrentUser = (request, resourceId) => {
  const currentUser = getCurrentUser(request);

  return  currentUser?.id === resourceId;
}

/**
 * Check if current user is admin
 *
 * @param {http.request} request
 */
const isAdmin = (request) => {
  const currentUser = getCurrentUser(request);

  return  currentUser?.role === ROLE_ADMIN;
}

/**
 * Get current user from token
 *
 * @param {http.request} request
 */
const getCurrentUser = (request) => {
  const token = getToken(request);

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch(err) {
    console.error(err);
  }

  return null;
}

/**
 * Perform login
 *
 * @param {http.request} request
 * @returns object
 */
const login = async (request) => {
  try {
    const body = await parseBodyJson(request);

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
  isCurrentUser,
  isAdmin,
  login,
  getCurrentUser,
};
