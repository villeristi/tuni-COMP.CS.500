const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const { Schema } = mongoose;

// You can use SALT_ROUNDS when hashing the password with bcrypt.hashSync()
const SALT_ROUNDS = 10;

// You can use these SCHEMA_DEFAULTS when setting the validators for the User Schema. For example the default role can be accessed with
// SCHEMA_DEFAULTS.role.defaultValue
const SCHEMA_DEFAULTS = {
  name: {
    minLength: 1,
    maxLength: 50,
  },
  email: {
    // https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
    match:
      /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
  },
  password: {
    minLength: 10,
  },
  role: {
    values: ['admin', 'customer'],
    defaultValue: 'customer',
  },
};

const userSchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: true,
    minLength: SCHEMA_DEFAULTS.name.minLength,
    maxLength: SCHEMA_DEFAULTS.name.maxLength,
  },

  email: {
    type: String,
    required: true,
    index: {
      unique: true,
    },
    validate: {
      validator: (value) =>
        SCHEMA_DEFAULTS.email.match.test(value.toLowerCase()),
      message: 'Email looks malformed',
    },
  },

  password: {
    type: String,
    required: true,
    minLength: SCHEMA_DEFAULTS.password.minLength,
    set: (value) =>
      !value || value.length < SCHEMA_DEFAULTS.password.minLength
        ? value
        : bcrypt.hashSync(value, bcrypt.genSaltSync(SALT_ROUNDS)),
  },

  role: {
    type: String,
    lowercase: true,
    trim: true,
    default: SCHEMA_DEFAULTS.role.defaultValue,
    validate: {
      validator: (value) => SCHEMA_DEFAULTS.role.values.includes(value),
      message: `Role must be one of ${SCHEMA_DEFAULTS.role.values.join(', ')}`,
    },
  },
});

/**
 * Compare supplied password with user's own (hashed) password
 *
 * @param {string} password
 * @returns {Promise<boolean>} promise that resolves to the comparison result
 */
userSchema.methods.checkPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Omit the version key when serialized to JSON
userSchema.set('toJSON', { virtuals: false, versionKey: false });

const User = new mongoose.model('User', userSchema);
module.exports = User;
