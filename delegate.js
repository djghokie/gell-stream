import assert from 'node:assert';
import _ from 'lodash';

export default function* delegatingSink(f) {
	assert(_.isFunction(f), 'delegate function is required');

	let item = yield;

	while (true) item = yield f(item);
}
