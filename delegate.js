const assert = require('assert');
const _ = require('lodash');

module.exports = function* delegatingSink(f) {
	assert(_.isFunction(f), 'delegate function is required');

	let item = yield;

	while (true) item = yield f(item);
}
