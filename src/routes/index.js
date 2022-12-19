const responseUtils = require('../utils/responseUtils');
const { acceptsJson, isJson } = require('../utils/requestUtils');
const { login } = require('../utils/auth');
const { renderPublic } = require('../utils/render');

const userResourceHandler = require('../routes/users');
const productResourceHandler = require('../routes/products');
const orderResourceHandler = require('../routes/orders');

const resourceHandlers = {
  '/api/products': productResourceHandler,
  '/api/users': userResourceHandler,
  '/api/orders': orderResourceHandler,
}

/**
 * Get correct resourceHandler
 *
 * @param {string} filePath
 * @returns
 */
const getResourceHandler = (filePath) => {
  const handlerKey = Object.keys(resourceHandlers).find((key) => filePath.startsWith(key) ? resourceHandlers[key] : null);
  return resourceHandlers[handlerKey] || null;
}

/**
 * Send response to client options request.
 *
 * @param {string} filePath pathname of the request URL
 * @param {http.ServerResponse} response
 */
const sendOptions = (filePath, response) => {
  if (filePath in allowedMethods) {
    response.writeHead(204, {
      'Access-Control-Allow-Methods': allowedMethods[filePath].join(','),
      'Access-Control-Allow-Headers': 'Content-Type,Accept',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Expose-Headers': 'Content-Type,Accept'
    });
    return response.end();
  }

  return responseUtils.notFound(response);
};

const handleRequest = async(request, response) => {
  const { url, method, headers } = request;
  const filePath = new URL(url, `http://${headers.host}`).pathname;

  // serve static files from public/ and return immediately
  if (method.toUpperCase() === 'GET' && !filePath.startsWith('/api')) {
    const fileName = filePath === '/' || filePath === '' ? 'index.html' : filePath;
    return renderPublic(fileName, response);
  }

  // See: http://restcookbook.com/HTTP%20Methods/options/
  if (method.toUpperCase() === 'OPTIONS') {
    return sendOptions(filePath, response)
  };

  // Handle resources on custom handlers
  const handler = getResourceHandler(filePath);

  if(handler) {
    return await handler(request, response);
  }

  // Require a correct accept header (require 'application/json' or '*/*')
  if (!acceptsJson(request)) {
    return responseUtils.contentTypeNotAcceptable(response);
  }

  // register new user
  if (filePath === '/api/register' && method.toUpperCase() === 'POST') {
    // Fail if not a JSON request, don't allow non-JSON Content-Type
    if (!isJson(request)) {
      return responseUtils.badRequest(response, 'Invalid Content-Type. Expected application/json');
    }

    // TODO: 8.4 Implement registration
    // You can use parseBodyJson(request) method from utils/requestUtils.js to parse request body.
    // Useful methods here include:
    // - validateUser(user) from /utils/users.js
    // - emailInUse(user.email) from /utils/users.js
    // - badRequest(response, message) from /utils/responseUtils.js
    throw new Error('Not Implemented');
  }

  // Login
  if (filePath === '/api/login' && method.toUpperCase() === 'POST') {
    if (!isJson(request)) {
      return responseUtils.badRequest(response, 'Invalid Content-Type. Expected application/json');
    }

    const res = await login(request);

    if(!res?.token) {
      return responseUtils.badRequest(response, 'email or password incorrect!');
    }

    return responseUtils.sendJson(response, { token: res.token });
  }

  // Default to 404 Not Found if unknown url
  return responseUtils.notFound(response)
};

module.exports = { handleRequest };
