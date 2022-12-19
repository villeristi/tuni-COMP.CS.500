const { isJson } = require('../utils/requestUtils');
const responseUtils = require('../utils/responseUtils');
const { handleResource } = require('../utils/router');

const { isAdmin, isCurrentUser } = require('../utils/auth');
const { parseBodyJson } = require('../utils/requestUtils');
const { getUsers, getUser, updateUser, updatableFields } = require('../services/user');

const HTTPError = require('../errors/http-error');
const RESOURCE_BASE = '/api/users'

/**
 * Handler-methods
 */
const methods = {
  /**
   * Fetch all users
   *
   * @param  {...any} args
   * @returns Array[User]
   */
  'GET_ROOT': async (...args) => {
    const [_, request, response] = args;

    if(!isAdmin(request)) {
      return responseUtils.forbidden(response);
    }

    const users = await getUsers();
    return responseUtils.sendJson(response, users);
  },
  /**
   * Fetch single user
   *
   * @param  {...any} args
   * @returns
   */
  'GET': async (...args) => {
    const [id, _, response] = args;
    const user = await getUser(id);

    if(!user) {
      throw new HTTPError({
        message: `User with id ${id} not found!`,
        status: 404,
      });
    }

    return responseUtils.sendJson(response, user);
  },

  /**
   * Update user
   *
   * @param  {...any} args
   */
  'PUT': async (...args) => {
    const [id, request, response] = args;

    if (!isJson(request)) {
      throw new HTTPError({
        message: 'Invalid Content-Type. Expected application/json',
        status: 400,
      });
    }

    if(isCurrentUser(request, id)) {
      throw new HTTPError({
        message: `You can't update yourself!`,
        status: 400,
      });
    }

    const payload = await parseBodyJson(request);

    // Get only allowed values from payload
    const valuesToUpdate = updatableFields.reduce((obj, key) => {
      if(payload[key]) {
        return {...obj, [key]: payload[key]}
      }

      return obj;
    }, {});

    const updatedUser = await updateUser(id, valuesToUpdate);

    if(!updatedUser) {
      throw new HTTPError({
        message: `User with id ${id} not found!`,
        status: 404,
      });
    }

    return responseUtils.sendJson(response, updatedUser);
  },

  /**
   * Delete user
   *
   * @param  {...any} args
   */
  'DELETE': async (...args) => {
    const [id, request, response] = args;

    if(isCurrentUser(request, id)) {
      throw new HTTPError({
        message: `You can't delete yourself!`,
        status: 400,
      });
    }

    return responseUtils.sendJson(response, {"foo": "bar"});
  },

  'DEFAULT': async (...args) => {
    const [_, __, response] = args;
    return responseUtils.methodNotAllowed(response);
  }
}

module.exports = async (request, response) => {
  return await handleResource(request, response, RESOURCE_BASE, methods);
}
