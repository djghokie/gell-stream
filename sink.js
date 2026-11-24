/**
 * Common stream sink implementations
 * 
 * Async generators vs values
 * 	- how to implement async behavior in sink implementatons
 * 	- sinks, by definition, injest stream items
 * 		- first call to a sink cannot receive an item
 * 		- sink "initialization" must happen before it can be used
 * 		- there are use cases for async initialization
 * 			- loading dependencies
 * 			- loading external supporting data
 * 			- etc
 *		- should drain, sample, etc implementatons perform initialization?
			- YES
				- can perform common error handling, etc
			- NO
				- re-usable sinks can't be implemented
				- drain implementations don't know details about sink
					- async generator?
					- async values?
 */

/**
 * Sends items to console.debug
 */
function* consoleSink() {
	let item = yield;

	while (true) {
		console.debug('######', item);

		item = yield;
	}
}

function* array(sink=[]) {
	let item = yield sink;

	while (true) {
		sink.push(item);

		item = yield sink;
	}
}

/**
 * WIP: beginnings of a mapping sink
 * 	- should allow f to be async
 * 	- mapping to array currently
 * 		- support delegation to another sink
 * 
 * @param {*} f 
 * @param {*} sink 
 */
function* mapper(f, sink=[]) {
	let item = yield sink;

	while (true) {
		sink.push(f(item));

		item = yield sink;
	}
}

export {
	array,
	consoleSink as console,
	mapper
};
