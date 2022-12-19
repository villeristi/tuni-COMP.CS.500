const { getResourceId } = require('../utils/requestUtils');
const responseUtils = require('../utils/responseUtils');
const mongoose = require('mongoose');
const HTTPError = require('../errors/http-error');

/**
 * Wrapper for handlers
 *
 * @param {http.request} request
 * @param {http.response} response
 * @returns
 */
const handleResource = async (request, response, resourceBase, methods) => {
  const { method } = request;
  const resourceId = getResourceId(resourceBase, request)
  const METHOD = method.toUpperCase();

  try {
    const handler = resourceId ? methods[METHOD] : methods[`${METHOD}_ROOT`];

    if(!handler) {
      return methods.DEFAULT;
    }

    return await handler(resourceId, request, response);
  } catch (err) {
    console.error(err);

    // Handle ValidationError
    if(err instanceof mongoose.Error.ValidationError) {
      return responseUtils.badRequest(response, err.message);
    }

    // Handle custom HTTPErrors
    if(err instanceof HTTPError) {
      if(err.status === 400) {
        return responseUtils.badRequest(response, err.message);
      }

      if(err.status === 404) {
        return responseUtils.notFound(response, err.message);
      }
    }

    return responseUtils.internalServerError(response, err.message);
  }
}

module.exports = {
  handleResource,
}
