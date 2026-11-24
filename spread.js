import assert from 'node:assert';
import _ from 'lodash';

export default async function* spread($stream, f) {
	assert($stream, 'source stream is required');
	assert(_.isFunction(f), 'spread function is required');

	try {
		for (let next = await $stream.next(); !next.done; next = await $stream.next()) {
			const result = await f(next.value);

			assert(isIterable(result), 'spread function must return an iterable');

			yield* result;
		}
	} finally {
		await $stream.return?.();
	}
}

function isIterable(value) {
	return value != null && (_.isFunction(value[Symbol.iterator]) || _.isFunction(value[Symbol.asyncIterator]));
}
