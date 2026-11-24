# WORK IN PROGRESS #

branch: stream
from: v1-eol
version: 1.13.1

## PURPOSE ##

* implement stream processing with async generators
* support common use cases
    * drain
	* sample
	* sequence
	* parallel
	* batch
* support error handling
    * fail fast
	* ignore
* support events

## MOTIVATION ##

* originally conceived as a way of handling "pages" of dynamodb items
* scripts often perform some work for every item returned from a query or scan
    * avoid reading entire result set into memory
* sometimes an indeterminate number of results is desired
    * search
* AVOID recreating Node stream libraries if they will do the job
* explore existing packages

## TO DO ##

* copy stream modules from gell-aws-dynamodb

## Node.js Streams ##

* you can use generators/iterators with stream concepts
    * docs are here: https://nodejs.org/api/stream.html#streams-compatibility-with-async-generators-and-async-iterators
* WebStreams could also be useful
    * https://nodejs.org/api/webstreams.html
	