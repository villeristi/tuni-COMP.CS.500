class HTTPError extends Error {
  constructor(params) {
    const {message, status, error} = params;

    super(message);
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.status = status || 500;

    // capture original error
    if (error) {
      this.error = error;
    }
  }
}

module.exports = HTTPError;
