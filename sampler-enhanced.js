import assert from 'node:assert';
import _ from 'lodash';

const MODES = {
	FIRST: true,
	LAST: true,
	RANDOM: true
}

export default async function* sampler($stream, size=1, mode="FIRST") {
	assert($stream, 'source stream is required');
	assert(_.isNumber(size) && size > 0, 'size must be number greater than zero');

	try {
		for (let sampled = 0; sampled < size; sampled++) {
			const next = await $stream.next();

			if (next.done) return;

			yield next.value;
		}
	} finally {
		// close the source so it can release resources once the sample is taken
		await $stream.return?.();
	}
}
