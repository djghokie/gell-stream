import assert from 'node:assert';
import _ from 'lodash';

export default async function* reducer(f, initialValue) {
	assert(_.isFunction(f), 'reducer function is required');

	let accumulator = initialValue;

	let item = yield accumulator;

	while (true) {
		accumulator = await f(accumulator, item);

		item = yield accumulator;
	}
}
