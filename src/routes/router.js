const mongoose = require('mongoose');
const HTTPError = require('../errors/http-error');

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
   * @param {array} partsArray
   * @returns
   */
  _cleanUpPaths = (partsArray) => partsArray.filter((item) => {
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

    // Add params-property to request
    req.params = {}

    // Add query-property to request
    req.query = Object.fromEntries(searchParams);

    // add .json-method to response
    res.json = sendAsJson.apply(this, [req, res]);

    // add .fail-method to response
    res.fail = sendFail.apply(this, [req, res]);

    // add .body-property to request
    req.body = await bodyAsJson.apply(this, [req, res]);

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

    // Handle paths WITH params
    for(const path in this.handlers) {
      if(
        this.pathParamsRegexp.test(path) &&
        this.handlers[path]?.[method]
      ) {
        const pathParts = this._cleanUpPaths(path.split('/'));
        const urlParts = this._cleanUpPaths(pathname.split('/'));

        // Mismatched params on route and url
        if(pathParts.length !== urlParts.length) {
          continue;
        }

        for(const part in pathParts) {
          if(pathParts[part].indexOf(':') === 0) {
            req.params[pathParts[part].slice(1)] = urlParts[part];
            continue;
          }

          if(pathParts[part] !== urlParts[part]){
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
