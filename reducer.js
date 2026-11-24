import assert from 'node:assert';

export default async function* reducer(f, initialValue) {
	assert(typeof f === 'function', 'reducer function is required');

	let accumulator = initialValue;

	let item = yield accumulator;

	while (true) {
		accumulator = await f(accumulator, item);

		item = yield accumulator;
	}
}
