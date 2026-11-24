import assert from 'node:assert';
import _ from 'lodash';

export default async function* filter($stream, f) {
	assert($stream, 'source stream is required');
	assert(_.isFunction(f), 'filter function is required');

	let next = await $stream.next();

	while (next.value) {
		const result = await f(next.value);

		if (result) yield next.value;

		if (!next.done) next = await $stream.next();
	}
}
