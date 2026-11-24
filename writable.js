/**
 * WIP: just trying to get some guidelines down for writing sinks
 */

/**
 * in this case, only the iterator values are promises
 */
function* syncInit() {
	let item = yield;

	while (true) {
		/**
		 * item can be a value or a promise for a value
		 */

		item = yield when(item).then(i => console.debug('process item'));
	}
}

/**
 * IMPROVEMENTS:
 * 	- is there anyway to indicate to a sink that you are done with it?
 */