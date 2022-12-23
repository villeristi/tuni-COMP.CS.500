const mongoose = require('mongoose');
const HTTPError = require('../errors/http-error');
const { getCurrentUser } = require('../utils/auth');

const IGNORE_PATHNAMES = [
  'favicon.ico',
];

const supportedMethods = ['get', 'post', 'put', 'delete'];

/**
 * add .json function to http.response
 *
 * @param  {...any} args
 * @returns Function
 */
const sendAsJson = (...args) => {
  const [_, res] = args;

  return (payload, code = 200) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(payload));
  }
}

/**
 * add .fail function to http.response
 *
 * @param  {...any} args
 * @returns Function
 */
const sendFail = (...args) => {
  const [_, res] = args;

  return (message = 'internal server error', code = 500) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({error: message}));
  }
}

/**
 * Add .body-property to request
 *
 * @param  {...any} args
 * @returns JSON
 */
const bodyAsJson = (...args) => {
  const [req, _] = args;

  return new Promise((resolve, reject) => {
    let body = '';
    req.on('error', err => reject(err));
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({})
      }
    });
  });
};

/**
 * Add .body-property to request
 *
 * @param {http.incomingMessage} request
 * @returns {boolean}
 */
const isJson = (...args) => {
  const [req, _] = args;
  return new Promise((resolve) => {
    return resolve(req.headers['content-type']?.toLowerCase() === 'application/json');
  });
}

/**
 * Add .user-property to request
 *
 * @param {http.incomingMessage} request
 * @returns {boolean}
 */
const getUser = (...args) => {
  const [req, _] = args;
  return new Promise((resolve) => {
    return resolve(getCurrentUser(req));
  });
}

/**
 * Always respond with something
 *
 * @param {Function} func
 * @returns
 */
const errorWrapper = (func) =>  (...args) => Promise.resolve(func(...args)).catch(
  (err) => {
    const [_, req] = args;
    const status = (err instanceof mongoose.Error.ValidationError) ? 422 : err.status ?? 500;
    const errorMsg =
      (err instanceof mongoose.Error.ValidationError) || (err instanceof HTTPError)
      ? err.message
      : 'internal server error';

    console.error(err);

    return req.fail(errorMsg, status);
  }
);

class DeadSimpleRouter {
  constructor() {
    this.handlers = {};
    this.pathParamsRegexp = new RegExp(/(\/:.*?)+/, 'gi');

    // "magic" methods
    for(const method of supportedMethods) {
      this[method] = (path, handler) => {
        this.handlers[path] = {
          ...this.handlers[path],
          [method]: errorWrapper(handler),
        }
      }
    }
  }

  /**
   * Remove unwanted things from splitted paths
   *
   * @param {array} pathsArray
   * @returns
   */
  _cleanUpPaths = (pathsArray) => pathsArray.filter((item) => {
    return Boolean(item) && !IGNORE_PATHNAMES.includes(item);
  });

  /**
   * Send options
   *
   * @param {string} path
   * @param {http.response} res
   * @returns
   */
  _sendOptions = (path, res) => {
    const allowedMethods = Object.keys(this.handlers[path]).map((k) => k.toUpperCase()).join(', ');

    res.writeHead(204, {
      'Access-Control-Allow-Methods': allowedMethods,
      'Access-Control-Allow-Headers': 'Content-Type,Accept',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Expose-Headers': 'Content-Type,Accept'
    });

    return res.end();
  }

  /**
   * Attach child routers
   *
   * @param {DeadSimpleRouter|Array<DeadSimpleRouter>} routerInstances
   */
  attachRouters = (routerInstances) => {
    const instances = Array.isArray(routerInstances) ? routerInstances : [routerInstances];

    instances.forEach((instance) => {
      for(const path in instance.handlers) {
        this.handlers[path] = {...this.handlers[path], ...instance.handlers[path]}
      }
    });
  }

  /**
   * Check if current pathname & handler matches regex
   *
   * @param {Array<string>} currentPathParts
   * @param {Array<string>} handlerPathParts
   * @returns
   */
  _matchesRouteWithParams = (currentPathParts, handlerPathParts) => {
    const resourceBase = '/' + currentPathParts.slice(0, -1).join('/');
    const currentPath = '/' + currentPathParts.join('/');
    const handlerPath = '/' + handlerPathParts.join('/');
    const regex = new RegExp(`^${resourceBase}(\/.+?)$`)

    return regex.test(currentPath) && regex.test(handlerPath);
  };


  /**
   * Handle the requests
   *
   * @param {http.request} req
   * @param {http.response} res
   * @returns
   */
  handleRequests = async (req, res) => {
    const { method: m, headers } = req;
    const { pathname, searchParams } = new URL(req.url, `http://${headers.host}`);
    const method = m.toLowerCase();

    // Add initial .params-property to request
    req.params = {}

    // Add .query-property to request
    req.query = Object.fromEntries(searchParams);

    // add .json-method to response
    res.json = sendAsJson.apply(this, [req, res]);

    // add .fail-method to response
    res.fail = sendFail.apply(this, [req, res]);

    // add .body-property to request
    req.body = await bodyAsJson.apply(this, [req, res]);

    // add .jsJson-property to request
    req.isJson = await isJson.apply(this, [req, res]);

    // add .user-property to request
    req.user = await getUser.apply(this, [req, res]);

    // Handle OPTIONS-request
    if(method === 'options') {
      if(this.handlers[pathname]) {
        return this._sendOptions(pathname, res);
      }

      for(const path in this.handlers) {
        if(this.pathParamsRegexp.test(path)) {
          return this._sendOptions(path, res);
        }
      }
    }

    // Handle paths without params
    if(this.handlers[pathname]?.[method]) {
      return this.handlers[pathname][method].apply(this, [req, res]);
    }

    const pathnameParts = this._cleanUpPaths(pathname.split('/'));

    // Handle paths WITH params
    for(const path in this.handlers) {
      const handlerPathParts = this._cleanUpPaths(path.split('/'));
      if(
        this._matchesRouteWithParams(pathnameParts, handlerPathParts) &&
        this.handlers[path]?.[method]
      ) {

        // Mismatched params on route and url
        if(handlerPathParts.length !== pathnameParts.length) {
          continue;
        }

        for(const part in handlerPathParts) {
          if(handlerPathParts[part].indexOf(':') === 0) {
            req.params[handlerPathParts[part].slice(1)] = pathnameParts[part];
            continue;
          }

          if(handlerPathParts[part] !== pathnameParts[part]){
            break;
          }
        }

        return this.handlers[path][method].apply(this, [req, res]);
      }
    }

    return this.defaultHandler(res);
  }

  /**
   *
   * @param {http.response} res
   * @returns
   */
  defaultHandler = (res) => {
    // Finally catch as 404
    res.statusCode = 404;
    return res.end('Not found');
  }
};

// Export as singleton
module.exports = DeadSimpleRouter;
