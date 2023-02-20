'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./simple-changeset.cjs.prod.js");
} else {
  module.exports = require("./simple-changeset.cjs.dev.js");
}
