const qs = require('querystring');
const url = require('url');

const IGNORE_PATHNAMES = [
  'favicon.ico',
];

const supportedMethods = ['get', 'post', 'put', 'delete'];

class DeadSimpleRouter {
  constructor() {
    this.handlers = {};
    this.pathParamsRegexp = new RegExp(/(\/:.*?)+/, 'gi');

    // "magic" methods
    for(const method of supportedMethods) {
      this[method] = (path, handler) => {
        this.handlers[path] = {
          ...this.handlers[path],
          [method]: handler,
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
   * @param {string} path
   * @param {http.response} res
   * @returns
   */
  _sendOptions = (path, res) => {
    res.writeHead(204, {
      'Access-Control-Allow-Methods': Object.keys(this.handlers[path]).map((k) => k.toUpperCase()).join(', '),
      'Access-Control-Allow-Headers': 'Content-Type,Accept',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Expose-Headers': 'Content-Type,Accept'
    });

    return res.end();
  }

  /**
   * Attach child routes
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
  handleRequests = (req, res) => {
    const { method: m } = req;
    const pathname = url.parse(req.url).pathname;
    const method = m.toLowerCase();

    // Instantiate params as empty object
    req.params = {}

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
      return this.handlers[pathname][method].apply(null, [req, res]);
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

        return this.handlers[path][method].apply(null, [req, res]);
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
