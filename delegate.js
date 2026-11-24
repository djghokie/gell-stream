import assert from 'node:assert';

export default function* delegatingSink(f) {
	assert(typeof f === 'function', 'delegate function is required');

	let item = yield;

	while (true) item = yield f(item);
}
