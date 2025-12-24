require('ts-node/register');
require('tsconfig-paths/register');
const { resolve } = require('path');
module.exports = require(resolve('src/config/database/config.ts'));

