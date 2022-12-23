/**
 * Parse valid updatable fields from body
 *
 * @param {object} payload
 * @param {Array<string>} fields
 * @returns
 */
const getValidFields = (payload, fields) =>
  fields?.reduce((obj, key) => {
    if (payload[key]) {
      return { ...obj, [key]: payload[key] };
    }

    return obj;
  }, {});

module.exports = {
  getValidFields,
};
