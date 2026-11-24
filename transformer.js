import assert from 'node:assert';
import _ from 'lodash';

export default async function* transformer($stream, f) {
	assert($stream, 'source stream is required');
	assert(_.isFunction(f), 'transformer function is required');

	let next = await $stream.next();

	while (next.value) {
		yield f(next.value);

		if (!next.done) next = await $stream.next();
	}
}
