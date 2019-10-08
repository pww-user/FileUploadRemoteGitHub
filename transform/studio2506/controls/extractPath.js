exports = {
	hasMultipleNodes: false,
	getterReturnsPromise: false,
    get: function (node) {
        return node.innerText.substring(9);
    },
	set: function(scopedoc, node, value, params) {}
}