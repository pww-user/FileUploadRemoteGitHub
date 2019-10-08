window.powwow = window.powwow || {};

// Powwow version of Promise to solve issues with Promise getting
// overriden.
(function (powwow) {

    // Use polyfill for setImmediate for performance gains
    var asap = (typeof setImmediate === 'function' && setImmediate) ||
        function (fn) { setTimeout(fn, 1); };

    // Polyfill for Function.prototype.bind
    function bind(fn, thisArg) {
        return function () {
            fn.apply(thisArg, arguments);
        };
    }

    var isArray = Array.isArray || function (value) { return Object.prototype.toString.call(value) === "[object Array]"; };

    function Promise(fn) {
        if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new');
        if (typeof fn !== 'function') throw new TypeError('not a function');
        this._state = null;
        this._value = null;
        this._deferreds = [];

        doResolve(fn, bind(resolve, this), bind(reject, this));
    }

    function handle(deferred) {
        var me = this;
        if (this._state === null) {
            this._deferreds.push(deferred);
            return;
        }
        asap(function () {
            var cb = me._state ? deferred.onFulfilled : deferred.onRejected;
            if (cb === null) {
                (me._state ? deferred.resolve : deferred.reject)(me._value);
                return;
            }
            var ret;
            try {
                ret = cb(me._value);
            }
            catch (e) {
                deferred.reject(e);
                return;
            }
            deferred.resolve(ret);
        });
    }

    function resolve(newValue) {
        try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
            if (newValue === this) throw new TypeError('A promise cannot be resolved with itself.');
            if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
                var then = newValue.then;
                if (typeof then === 'function') {
                    doResolve(bind(then, newValue), bind(resolve, this), bind(reject, this));
                    return;
                }
            }
            this._state = true;
            this._value = newValue;
            finale.call(this);
        } catch (e) { reject.call(this, e); }
    }

    function reject(newValue) {
        this._state = false;
        this._value = newValue;
        finale.call(this);
    }

    function finale() {
        for (var i = 0, len = this._deferreds.length; i < len; i++) {
            handle.call(this, this._deferreds[i]);
        }
        this._deferreds = null;
    }

    function Handler(onFulfilled, onRejected, resolve, reject) {
        this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
        this.onRejected = typeof onRejected === 'function' ? onRejected : null;
        this.resolve = resolve;
        this.reject = reject;
    }

    /**
     * Take a potentially misbehaving resolver function and make sure
     * onFulfilled and onRejected are only called once.
     *
     * Makes no guarantees about asynchrony.
     */
    function doResolve(fn, onFulfilled, onRejected) {
        var done = false;
        try {
            fn(function (value) {
                if (done) return;
                done = true;
                onFulfilled(value);
            }, function (reason) {
                if (done) return;
                done = true;
                onRejected(reason);
            });
        } catch (ex) {
            if (done) return;
            done = true;
            onRejected(ex);
        }
    }

    Promise.prototype['catch'] = function (onRejected) {
        return this.then(null, onRejected);
    };

    Promise.prototype.then = function (onFulfilled, onRejected) {
        var me = this;
        return new Promise(function (resolve, reject) {
            handle.call(me, new Handler(onFulfilled, onRejected, resolve, reject));
        });
    };

    Promise.all = function () {
        var args = Array.prototype.slice.call(arguments.length === 1 && isArray(arguments[0]) ? arguments[0] : arguments);

        return new Promise(function (resolve, reject) {
            if (args.length === 0) return resolve([]);
            var remaining = args.length;
            function res(i, val) {
                try {
                    if (val && (typeof val === 'object' || typeof val === 'function')) {
                        var then = val.then;
                        if (typeof then === 'function') {
                            then.call(val, function (val) { res(i, val); }, reject);
                            return;
                        }
                    }
                    args[i] = val;
                    if (--remaining === 0) {
                        resolve(args);
                    }
                } catch (ex) {
                    reject(ex);
                }
            }
            for (var i = 0; i < args.length; i++) {
                res(i, args[i]);
            }
        });
    };

    Promise.resolve = function (value) {
        if (value && typeof value === 'object' && value.constructor === Promise) {
            return value;
        }

        return new Promise(function (resolve) {
            resolve(value);
        });
    };

    Promise.reject = function (value) {
        return new Promise(function (resolve, reject) {
            reject(value);
        });
    };

    Promise.race = function (values) {
        return new Promise(function (resolve, reject) {
            for (var i = 0, len = values.length; i < len; i++) {
                values[i].then(resolve, reject);
            }
        });
    };

    /**
     * Set the immediate function to execute callbacks
     * @param fn {function} Function to execute
     * @private
     */
    Promise._setImmediateFn = function _setImmediateFn(fn) {
        asap = fn;
    };

    if (!powwow.Promise) {
        powwow.Promise = Promise;
    }

})(window.powwow);

(function (powwow) {

    // Sort by a field.
    function sort_by(field, fn, descending) {
        var func = fn ? function (x) {
            return fn(x);
        } : function (x) {
            return x[field];
        };
        descending = !descending ? 1 : -1;
        return function (a, b) {
            a = func(a);
            b = func(b);
            return descending * ((a > b) - (b > a));
        };
    }

    function sortArray(array, sort) {
        if (sort) {
            array.sort(sort_by(sort.field, normalizeFunction(sort.fn), sort.descending));
        }
    }

    // TypeString can have format "type.param", where type is the type
    // to lookup in the types table, and param is a parameter to pass into
    // the type function.
    // TypeInfo object should end up with:
    // { type: type, param: param }

    function processTypeString(typeString, typeInfo) {
        var firstDotChar = typeString.indexOf(".");
        if (firstDotChar == -1) {
            typeInfo.type = typeString;
        } else {
            typeInfo.type = typeString.substring(0, firstDotChar);
            //if (typeInfo.param) {
            //    throw ("'type' is of format 'type.param', but there is also a param passed in.");
            //}
            typeInfo.param = typeString.substring(firstDotChar + 1);
        }
    }

    // Return expanded form of type as:
    // {
    //   type: "typeString",
    //   param: "typeParameter",
    //   fn: functionToCall
    // }
    function parseType(item, operations) {
        var type = null, prop;

        if (item.type == "descriptor") {
            if (item.hasOwnProperty('descriptor')) {
                var subDescriptor = powwow.models[item.descriptor];
                if (subDescriptor) {
                    delete item.descriptor;
                    var props = Object.keys(subDescriptor);
                    for (var iProp = 0; iProp < props.length; iProp++) {
                        prop = props[iProp];
                        item[prop] = subDescriptor[prop];
                    }
                } else {
                    throw("Not a valid descriptor: " + item.descriptor);
                }
            } else {
                throw("Descriptor type needs 'descriptor' to be specified.");
            }
        }

        if (operations) {
            if (operations.sets) {
                if (item.hasOwnProperty("set_control")) {
                    type = item.set_control;
                } else if (item.hasOwnProperty("set_fieldType")) {
                    type = item.set_fieldType;
                }
            } else if (operations.gets) {
                if (item.hasOwnProperty("get_fieldType")) {
                    type = item.get_fieldType;
                } else if (item.hasOwnProperty("get_control")) {
                    type = item.get_control;
                }
            }
        }

        if (!type) {
            if (item.hasOwnProperty("control")) {
                type = item.control;
            }
            else if (item.hasOwnProperty("fieldType")) {
                type = item.fieldType;
            }
            else {
                type = item.type; // Fallback on type if there is no control.
            }
        }

        var jsType = typeof type;
        var typeInfo = {};
        if (jsType == "object") {
            typeInfo = type;
            processTypeString(type.control || type.fieldType || type.type, typeInfo);
        } else if (jsType == "string") {
            processTypeString(type, typeInfo);
        } else if (jsType == "function") {
            typeInfo.fn = type;
        } else {
            throw ("'" + type + "' is an unexcepted type:" + powwow.stringify(item));
        }
        return typeInfo;
    }

    function normalizeFunction(fn) {
        if (typeof fn == "string") {
            var func;
            try {
                eval("func=" + fn);
            } catch (e) {
                powwow.log('Can not eval: ', fn);
                powwow.log(e.stack);
            }
            return func;
        }
        return fn;
    }

    powwow.isArray = isArray = function (item) {
        var type = toString.call(item);
        return (type.indexOf("Array]") >= 0 || type.indexOf("NodeList]") >= 0);
    };

    powwow.isObject = isObject = function (item) {
        var type = toString.call(item);
        return type === "[object Object]";
    };

    function _hasSelector(field, operations) {
        return __hasSelector(field, operations, "selector");
    }

    function _hasSelectorAll(field, operations) {
        return __hasSelector(field, operations, "selectorAll");
    }

    function _hasSelectorPath(field, operations) {
        return __hasSelector(field, operations, "selectorPath");
    }

    function _getSelector(field, operations) {
        return __getSelector(field, operations, "selector");
    }

    function _getSelectorAll(field, operations) {
        return __getSelector(field, operations, "selectorAll");
    }

    function _getSelectorPath(field, operations) {
        return __getSelector(field, operations, "selectorPath");
    }

    function _setSelector(field, value, operations) {
        __setSelector(field, operations, "selector");
    }

    function _setSelectorAll(field, value, operations) {
        __setSelector(field, value, operations, "selectorAll");
    }

    function _setSelectorPath(field, value, operations) {
        __setSelector(field, value, operations, "selectorPath");
    }

    function __hasSelector(field, operations, selectorType) {
        if (operations) {
            if (operations.sets) {
                if (field["set_" + selectorType]) {
                    return true;
                }
            } else if (operations.gets) {
                if (field["get_" + selectorType]) {
                    return true;
                }
            }
        }
        return !!field[selectorType];

    }

    function __getSelector(field, operations, selectorType) {
        if (operations) {
            if (operations.sets) {
                if (field["set_" + selectorType]) {
                    return field["set_" + selectorType];
                }
            } else if (operations.gets) {
                if (field["get_" + selectorType]) {
                    return field["get_" + selectorType];
                }
            }
        }
        return field[selectorType];
    }

    function __setSelector(field, value, operations, selectorType) {
        if (operations) {
            if (operations.sets) {
                if (field["set_" + selectorType]) {
                    field["set_" + selectorType] = value;
                    return;
                }
            } else if (operations.gets) {
                if (field["get_" + selectorType]) {
                    field["get_" + selectorType] = value;
                    return;
                }
            }
        }
        field[selectorType] = value;
    }

    function parsePathSelector(field, isSelectorAll, operations) {
        var pathInfo = {
            pathIndex: 0,
            selector: ""
        };
        var pathSelector = isSelectorAll ? field.pathSelectorAll : field.pathSelector;
        if (!isSelectorAll) {
            if (field.hasOwnProperty('field.selectIndex')) {
                // This isn't the path index, this is the index of the element in the selected array.
                pathInfo.selectIndex = field.selectIndex;
            } else if (field.hasOwnProperty('field.selectContains')) {
                pathInfo.selectContains = field.selectContains;
            }
        }
        var paths = pathSelector.split("/");
        while (paths[pathInfo.pathIndex] == "..") {
            pathInfo.pathIndex++;
        }
        //pathInfo.selector = paths[pathInfo.pathIndex];
        _setSelector(pathInfo, paths[pathInfo.pathIndex], operations);
        return pathInfo;
    }

    function nullIfHidden(field, item) {
        if ((!field.hasOwnProperty("selectHidden") || !field.selectHidden) && item && item.getBoundingClientRect) {
            var rect = item.getBoundingClientRect();
            if (rect.height == 0 && rect.width == 0) {
                return null;
            }
        }
        return item;
    }

    function filterOutHiddenNodes(field, allItems) {
        var visibleItems = [];
        if (allItems && allItems.length > 0) {
            for (var i = 0; i < allItems.length; i++) {
                var listItem = nullIfHidden(field, allItems[i]);
                if (listItem) {
                    visibleItems.push(listItem);
                }
            }
        }
        return visibleItems;
    }

    function getFirstNonHiddenNode(field, allItems) {
        for (var i = 0; i < allItems.length; i++) {
            var listItem = nullIfHidden(field, allItems[i]);
            if (listItem) {
                return listItem;
            }
        }
        return null;
    }

    function querySelector(node, field, operations) {
        var item;
        if (_getSelector(field, operations) === ".") {
            item = node;
        } else {
            var allItems;
            // Allow index = 0, to deal with hidden nodes.
            if (field.hasOwnProperty('selectIndex')) {
                allItems = runQuerySelectorAll(node, field, operations);

                // If it's negative, it's an index from the end of the array, with -1 being the last element,
                // -2 the second last, etc...
                if (field.selectIndex < 0) {
                    item = allItems[allItems.length + field.selectIndex];
                } else {
                    item = allItems[field.selectIndex];
                }

                // For finding text contained within a node.
            } else if (field.hasOwnProperty('selectContains') && field.selectContains) {
                allItems = runQuerySelectorAll(node, field, operations);
                var lowerCaseValToFind = field.selectContains.toLowerCase();
                for (var i = 0; i < allItems.length; i++) {
                    var listItem = allItems[i];
                    if (listItem && listItem.innerText &&
                        listItem.innerText.toLowerCase().indexOf(lowerCaseValToFind) >= 0) {
                        item = listItem;
                        break;
                    }
                }
            } else {
                item = runQuerySelector(node, field, operations);
            }
        }
        return item;
    }

    function runQuerySelectorObject(node, selectorObj, operations, field) {
        var foundNodeOrNodes;
        var items;
        if (_hasSelector(selectorObj, operations)) {
            items = node.querySelectorAll(_getSelector(selectorObj, operations));
            foundNodeOrNodes = getFirstNonHiddenNode(field, items);
        } else if (_hasSelectorAll(selectorObj, operations)) {
            items = node.querySelectorAll(_getSelectorAll(selectorObj, operations));
            foundNodeOrNodes = filterOutHiddenNodes(field, items);
        } else {
            foundNodeOrNodes = node;
        }

        if (selectorObj.fn && foundNodeOrNodes && (!powwow.isArray(foundNodeOrNodes) || foundNodeOrNodes.length > 0)) {
            var findFn = normalizeFunction(`powwow.find.${selectorObj.fn}`);
            return findFn.call(powwow, foundNodeOrNodes, ...(selectorObj.args || []));
        } else {
            return foundNodeOrNodes;
        }
    }

    function runQuerySelector(node, field, operations) {
        var selector = _getSelector(field, operations);
        var jsType = typeof selector;
        var foundNode;
        if (jsType == "string") {
            foundNode = getFirstNonHiddenNode(field, node.querySelectorAll(selector));
        } else if (jsType == "function" && node && (!powwow.isArray(node) || node.length > 0)) {
            foundNode = selector.call(powwow, node);
        } else if (jsType == "object") {
            foundNode = runQuerySelectorObject(node, selector, operations, field);
            if(powwow.isArray(foundNode)) {
                if(foundNode.length > 0) {
                    powwow.log("Query selector has a function that returns an array.  Returning the first item");
                    foundNode = foundNode[0];
                } else {
                    foundNode = null;
                }
            }
        }
        return foundNode;
    }

    function runQuerySelectorAll(node, field, operations) {
        var selector = _getSelectorAll(field, operations) || _getSelector(field, operations);
        var jsType = typeof selector;
        try {
            var arrFoundNodes;
            if (jsType === 'string') {
                arrFoundNodes = node.querySelectorAll(selector);
            } else if (jsType === 'function' && node && (!powwow.isArray(node) || node.length > 0)) {
                arrFoundNodes = selector.call(powwow, node);
            } else if (jsType === 'object') {
                arrFoundNodes = runQuerySelectorObject(node, selector, operations, field);
            }
            return filterOutHiddenNodes(field, arrFoundNodes);
        } catch (e) {
            powwow.log('Field: ', powwow.stringify(field));
            powwow.log('Selector: ', selector);
            powwow.log(e.stack);
        }
    }

    function processPathSelector(selectorScope, field, operations) {
        try {
            var pathInfo = parsePathSelector(field, false, operations);
            var node = selectorScope[pathInfo.pathIndex];
            return querySelector(node, pathInfo, operations);
        } catch (e) {
            powwow.log('Error in common.js/processPathSelector()');
            powwow.log(e.stack);
        }
    }

    function processPathSelectorAll(selectorScope, field, operations) {
        try {
            var pathInfo = parsePathSelector(field, true, operations);
            var node = selectorScope[pathInfo.pathIndex];
            var list = (_getSelector(pathInfo, operations) === '.') ?
                node :
                runQuerySelectorAll(node, pathInfo, operations);
            if (list.length === 0) {
                throw ('Unable to find path items with selector: ' + _getSelectorAll(pathInfo, operations));
            }
            return list;
        } catch (e) {
            powwow.log('Error in common.js/processPathSelector()');
            powwow.log(e.stack);
        }
    }

    function recursiveFlattenData(dataItem, itemId, newDataRoot) {
        if (isObject(dataItem) && !(dataItem.hasOwnProperty('selected') && dataItem.hasOwnProperty('options'))) {
            var subItemName, dataItemKeys = Object.keys(dataItem);
            for (var i=0; i < dataItemKeys.length; i++) {
                subItemName = dataItemKeys[i];
                recursiveFlattenData(dataItem[subItemName], addToItemId(itemId, subItemName), newDataRoot);
            }
        } else if (powwow.isArray(dataItem) && dataItem.length > 0 && isObject(dataItem[0])) {
            // Don't flatten arrays of values, as those are used for multiple select.
            for (var i = 0; i < dataItem.length; i++) {
                recursiveFlattenData(dataItem[i], addToItemId(itemId, i, true), newDataRoot);
            }
        } else {
            newDataRoot[itemId] = dataItem;
        }
    }

    function addToItemId(itemId, addition, isIndex) {
        return itemId + ((itemId.length > 0 && !isIndex) ? "." : "") + (isIndex ? "[" + addition + "]" : addition);
    }

    function flattenData(data) {
        var flatData = {};
        recursiveFlattenData(data, "", flatData);
        return flatData;
    }

    powwow.stringify = (function () {
        var toString = Object.prototype.toString;
        var isArray = Array.isArray || function (a) { return toString.call(a) === '[object Array]'; };
        var escMap = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'};
        var escFunc = function (m) { return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1); };
        var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
        return function stringify(value) {
            if (value == null) {
                return 'null';
            } else if (typeof value === 'number') {
                return isFinite(value) ? value.toString() : 'null';
            } else if (typeof value === 'boolean') {
                return value.toString();
            } else if (typeof value === 'object') {
                if (isArray(value)) {
                    var res = '[';
                    for (var i = 0; i < value.length; i++)
                        res += (i ? ', ' : '') + stringify(value[i]);
                    return res + ']';
                } else if (toString.call(value) === '[object Object]') {
                    var tmp = [];
                    var valueKeys = Object.keys(value);
                    for (var i = 0; i < valueKeys.length; i++) {
                        var k = valueKeys[i];
                        if (value.hasOwnProperty(k))
                            tmp.push(stringify(k) + ': ' + stringify(value[k]));
                    }
                    return '{' + tmp.join(', ') + '}';
                }
            }
            return '"' + value.toString().replace(escRE, escFunc) + '"';
        }
    })();
  
    powwow.processSelectorPathItem = function (
        item, selectorPathItem, selectorPath, path, funcProcessItems, itemId, operations
    ) {
        item = selectorPathItem.fn ? normalizeFunction(selectorPathItem.fn).call(powwow, item) : item;
        var newPath = selectorPath.slice(1);
        if (powwow.isArray(item)) {
            for (var j = 0; j < item.length; j++) {
                powwow.processSelectorPath(newPath, item[j], [item[j]].concat(path), funcProcessItems, itemId, operations);
            }
        } else {
            powwow.processSelectorPath(newPath, item, [item].concat(path), funcProcessItems, itemId, operations);
        }
    };

    powwow.processSelectorPath = function (selectorPath, scopeSelector, path, funcProcessItems, itemId, operations) {
        if (selectorPath.length > 0) {
            var selectorPathItem = selectorPath[0];
            if (_hasSelectorAll(selectorPathItem, operations)) {
                var list = runQuerySelectorAll(scopeSelector, selectorPathItem, operations);
                if (list.length == 0) {
                    throw ("Unable to find path items with selector: " + _getSelectorAll(selectorPathItem, operations));
                }
                for (var i = 0; i < list.length; i++) {
                    powwow.processSelectorPathItem(list[i],
                        selectorPathItem,
                        selectorPath,
                        path,
                        funcProcessItems,
                        itemId, operations);
                }
            } else if (_hasSelector(selectorPathItem, operations)) {
                var item = querySelector(scopeSelector, selectorPathItem, operations);
                if (item) {
                    powwow.processSelectorPathItem(item,
                        selectorPathItem,
                        selectorPath,
                        path,
                        funcProcessItems,
                        itemId, operations);
                }
            }
        } else {
            funcProcessItems.call(powwow, path, itemId);
        }
    };

    powwow.processSingleSelector = function (
        field, subSelectorScope, typeInfo, response, fieldName, operations, itemId
    ) {
        if (typeInfo.type == "array") {
            powwow.log("Used a selector that returns a single item with an array");
            return;
        }
        if (typeInfo.type == "object") {
            response[fieldName] = {};
            if (operations.hasOwnProperty("itemId")) {
                // TODO: TEST HOW TO ACCESS ROOT OF A PAGE MODEL.  E.G. IN LOGIN WHEN CONTENT PANE DISABLED.
                // For use in "waitOnceForSpecificDOMMutationUsingDescriptor" call.  If an item id is passed in, we add
                // the node to a list of nodes.
                if (operations.itemId == itemId) {
                    operations.nodes.push(subSelectorScope);
                }
            }
            powwow.processData(field.properties,
                subSelectorScope,
                response && response[fieldName],
                operations,
                itemId);
        } else {
            // Type is either a built-in type or app specific type.

            // Set the property value if the item id is in the map.
            if (operations.hasOwnProperty("itemId")) {
                if (operations.itemId == itemId) {
                    operations.nodes.push(subSelectorScope);
                }
            } else if (operations.setterMap) {
                if (operations.setterMap.hasOwnProperty(itemId)) {
                    var value = operations.setterMap[itemId];
                    if (powwow.controls[typeInfo.type] && powwow.controls[typeInfo.type].set) {
                        powwow.log("Setting", itemId, "to", value);
                        operations.sets.push({
                            node: subSelectorScope,
                            value: value,
                            type: typeInfo.type,
                            param: typeInfo.param
                        });
                    } else {
                        powwow.log("No setter function for", typeInfo.type);
                    }
                    delete operations.setterMap[itemId];
                }
            } else {
                if (powwow.controls[typeInfo.type] && powwow.controls[typeInfo.type].get) {
                    //powwow.log("Getting", itemId);
                    operations.gets.push({
                        node: subSelectorScope,
                        type: typeInfo.type,
                        param: typeInfo.param,
                        fn: normalizeFunction(`powwow.extract.${typeInfo.fn}`),
                        args: typeInfo.args,
                        container: response,
                        field: fieldName
                    });
                } else {
                    powwow.log("No getter function for", typeInfo.type);
                }
            }
        }
    };

    powwow.processArraySelector = function (
        field, subSelectorScope, typeInfo, response, fieldName, operations, itemId
    ) {
        if (typeInfo.type != "array") {
            throw ("Used a selector that returns an array with a single object.");
        }
        if (subSelectorScope) {
            // Type is array, add items to the array.
            response[fieldName] = [];
            for (var i = 0; i < subSelectorScope.length; i++) {
                powwow.processArrayData(field.items,
                    subSelectorScope[i],
                    response[fieldName],
                    operations,
                    addToItemId(itemId, i, true));
            }
            if (typeInfo.sort) {
                if (!operations.sorts) {
                    operations.sorts = [];
                }
                operations.sorts.push({ array: response[fieldName], sort: typeInfo.sort });
            }
        }
    };

    powwow.findNodeBySelector = function (field, node, operations) {
        var selectorScope = node;
        var fss;

        if (field.frameSelector) {
            if (powwow.isArray(field.frameSelector)) {
                for (var i = 0; i < field.frameSelector.length; i++) {
                    fss = selectorScope.querySelector(field.frameSelector[i]);
                    fss = nullIfHidden(field, fss);
                    if (fss) {
                        selectorScope = fss.contentDocument;
                    } else {
                        selectorScope = null;
                        powwow.log("Frame selector: " + field.frameSelector[i] + " didn't return anything.");
                    }
                }
            } else {
                fss = selectorScope.querySelector(field.frameSelector);
                fss = nullIfHidden(field, fss);
                if (fss) {
                    selectorScope = fss.contentDocument;
                } else {
                    selectorScope = null;
                    powwow.log("Frame selector: " + field.frameSelector + " didn't return anything.");
                }
            }
        }
        if (selectorScope == null && field.frameSelectorAlt) {
            selectorScope = node;
            if (powwow.isArray(field.frameSelectorAlt)) {
                for (var j = 0; j < field.frameSelectorAlt.length; j++) {
                    fss = selectorScope.querySelector(field.frameSelectorAlt[j]);
                    fss = nullIfHidden(field, fss);
                    if (fss) {
                        selectorScope = fss.contentDocument;
                    } else {
                        selectorScope = null;
                        powwow.log("Frame selector alt: " + field.frameSelectorAlt[j] + " didn't return anything.");
                    }
                }
            } else {
                fss = selectorScope.querySelector(field.frameSelectorAlt);
                fss = nullIfHidden(field, fss);
                if (fss) {
                    selectorScope = fss.contentDocument;
                } else {
                    selectorScope = null;
                    powwow.log("Frame selector alt: " + field.frameSelectorAlt[j] + " didn't return anything.");
                }
            }
        }

        if (powwow.isArray(selectorScope)) {
            if (field.pathSelector) {
                selectorScope = processPathSelector(selectorScope, field, operations);
            } else if (field.pathSelectorAll) {
                selectorScope = processPathSelectorAll(selectorScope, field, operations);
            } else {
                throw ("Children of selectorPath must select from path using 'pathSelector' or 'pathSelectorAll'");
            }
        } else {
            if (_hasSelector(field, operations)) {
                selectorScope = querySelector(selectorScope, field, operations);
            } else if (_hasSelectorAll(field, operations)) {
                selectorScope = runQuerySelectorAll(selectorScope, field, operations);
            } else if (_hasSelectorPath(field, operations)) {
                if (typeInfo.type != "array") {
                    throw ("Used a selectorPath that returns an array with a single object.");
                }
            }
        }

        return selectorScope;
    };

    function handleFrameError(e, selector, response) {
        var errMsg = "";
        powwow.log(e.message);
        powwow.log("***************************************************************************************************************")
        powwow.log("Cannot access IFRAME '" + selector + "' - it comes from a different site, and this violates Chrome's same-origin policy. This is a security feature to prevent one site from performing scripting attacks against another.");
        powwow.log("NOTE: This security feature is disabled in the SmartUX Platform, so won't be an issue when actually running the app.");
        powwow.log("In order to preview in the PowWow Chrome Extension, you have 2 options:")
        powwow.log(" - Request that the site in the IFRAME explicitly allow it to be used this way (by adding X-Frame-Options headers)");
        powwow.log(" - Restart Google Chrome with the '--disable-web-security' and '--user-data-dir' flags to turn off this security feature.");
        powwow.log(" ** Windows (run this on Command Prompt) **");
        powwow.log("taskkill /IM chrome.exe & timeout 1 & \"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe\" --disable-web-security --user-data-dir");
        powwow.log(" ** MacOS (run this in the Terminal) **");
        powwow.log("pkill \"Google Chrome\"; sleep 1; open -a \"Google Chrome\" --args --disable-web-security --user-data-dir");
        powwow.log(" ** Linux (run this on command prompt) **");
        powwow.log("pkill google-chrome; sleep 1; google-chrome --disable-web-security --user-data-dir");
        powwow.log("***************************************************************************************************************");
        if(powwow.ENV == "development") {
            response.$frameSecurityError = "IFRAME: '" + selector + "' comes from a different website.  See console log for details.";
        }
        return true;
    }

    // Initial, just deal with string selectors.
    powwow.processSelector = function (field, node, typeInfo, response, fieldName, operations, itemId) {
        // If there is a frameSelector, select starting from it.
        var selectorScope = node;
        var frameError = null;
        var fss;
        if (field.frameSelector) {
            if (powwow.isArray(field.frameSelector)) {
                for (var i = 0; i < field.frameSelector.length; i++) {
                    try {
                        fss = selectorScope && selectorScope.querySelector(field.frameSelector[i]);
                        fss = nullIfHidden(field, fss);
                    } catch (e) {
                        powwow.log('Field: ', field.frameSelector[i]);
                        powwow.log(e.stack);
                    }
                    try {
                        selectorScope = fss && fss.contentDocument;                        
                    } catch(e) {
                        frameError = handleFrameError(e, field.frameSelector[i], response);
                        selectorScope = null;
                    }
                }
            } else {
                try {
                    fss = selectorScope && selectorScope.querySelector(field.frameSelector);
                    fss = nullIfHidden(field, fss);
                } catch (e) {
                    powwow.log('Selector: ', field.frameSelector);
                    powwow.log(e.stack);
                }
                try {
                    selectorScope = fss && fss.contentDocument;                        
                } catch(e) {
                    frameError = handleFrameError(e, field.frameSelector, response);
                    selectorScope = null;
                }
            }
        }
        if (!selectorScope && field.frameSelectorAlt) {
            selectorScope = node;
            if (powwow.isArray(field.frameSelectorAlt)) {
                for (var j = 0; j < field.frameSelectorAlt.length; j++) {
                    try {
                        fss = selectorScope && selectorScope.querySelector(field.frameSelectorAlt[j]);
                        fss = nullIfHidden(field, fss);
                    } catch (e) {
                        powwow.log('Field: ', field.frameSelectorAlt[j]);
                        powwow.log(e.stack);
                    }
                    try {
                        selectorScope = fss && fss.contentDocument;                        
                    } catch(e) {
                        frameError = handleFrameError(e, field.frameSelectorAlt[j], response);
                        selectorScope = null;
                    }
                }
            } else {
                try {
                    fss = selectorScope && selectorScope.querySelector(field.frameSelectorAlt);
                    fss = nullIfHidden(field, fss);
                } catch (e) {
                    powwow.log('Selector: ', field.frameSelectorAlt);
                    powwow.log(e.stack);
                }
                try {
                    selectorScope = fss && fss.contentDocument;                        
                } catch(e) {
                    frameError = handleFrameError(e, field.frameSelectorAlt, response);
                    selectorScope = null;
                }
            }
        }
        if (!selectorScope) {
            if (field.frameSelector) {
                if(!frameError) {
                    if (field.frameSelectorAlt) {
                        powwow.log('No Frame found matching: ', field.frameSelector, 'or', field.frameSelectorAlt);
                    } else {
                        powwow.log('No Frame found matching: ', field.frameSelector);
                    }
                }
            } else {
                powwow.log('Error: node passed to processSelector is null!.');
            }
            return;
        }
        var subSelectorScope;

        if (powwow.isArray(selectorScope)) {
            if (field.pathSelector) {
                subSelectorScope = processPathSelector(selectorScope, field, operations);
                powwow.processSingleSelector(field,
                    subSelectorScope,
                    typeInfo,
                    response,
                    fieldName,
                    operations,
                    itemId);
            } else if (field.pathSelectorAll) {
                subSelectorScope = processPathSelectorAll(selectorScope, field, operations);
                powwow.processArraySelector(field,
                    subSelectorScope,
                    typeInfo,
                    response,
                    fieldName,
                    operations,
                    itemId);
            } else {
                throw ('Children of selectorPath must select from path using "pathSelector" or "pathSelectorAll"');
            }
        } else {
            if (_hasSelector(field, operations)) {
                if(powwow.controls[typeInfo.type] && powwow.controls[typeInfo.type].hasMultipleNodes) {
                    // Allow use of 'selector' with a control that needs multiple nodes such as 'radio'
                    subSelectorScope = runQuerySelectorAll(selectorScope, field, operations);
                } else {
                    subSelectorScope = querySelector(selectorScope, field, operations);
                }

                if (subSelectorScope) {
                    powwow.processSingleSelector(field,
                        subSelectorScope,
                        typeInfo,
                        response,
                        fieldName,
                        operations,
                        itemId);
                }
            } else if (_hasSelectorAll(field, operations)) {
                subSelectorScope = runQuerySelectorAll(selectorScope, field, operations);
                if (powwow.controls[typeInfo.type] && powwow.controls[typeInfo.type].hasMultipleNodes) {
                    powwow.processSingleSelector(field,
                        subSelectorScope,
                        typeInfo,
                        response,
                        fieldName,
                        operations,
                        itemId);
                } else {
                    powwow.processArraySelector(field,
                        subSelectorScope,
                        typeInfo,
                        response,
                        fieldName,
                        operations,
                        itemId);
                }
            } else if (_hasSelectorPath(field, operations)) {
                if (typeInfo.type !== 'array') {
                    throw ('Used a selectorPath that returns an array with a single object.');
                }
                response[fieldName] = [];
                powwow.processSelectorPath(_getSelectorPath(field, operations), selectorScope, [], function (
                    path, itemId
                ) {
                    itemId = addToItemId(itemId, response[fieldName].length, true);
                    powwow.processArrayData(field.items, path, response[fieldName], operations, itemId);
                }, itemId, operations);
                if (typeInfo.sort) {
                    if (!operations.sorts) {
                        operations.sorts = [];
                    }
                    operations.sorts.push({ array: response[fieldName], sort: typeInfo.sort });
                }
            } else {
                // No selector, use the parent selector
                powwow.processSingleSelector(field, selectorScope, typeInfo, response, fieldName, operations, itemId);
            }
        }
    };

    powwow.processArrayData = function (items, selectorScope, responseArray, operations, itemId) {
        var rootTypeInfo = parseType(items, operations);
        var response, field, typeInfo;
        if (rootTypeInfo.type == "object") {
            response = { $i: responseArray.length };
            responseArray.push(response);
            var fieldName, propKeys = Object.keys(items.properties);
            for (var i=0; i < propKeys.length; i++) {
                fieldName = propKeys[i];
                field = items.properties[fieldName];
                typeInfo = parseType(field, operations);
                powwow.processSelector(field,
                    selectorScope,
                    typeInfo,
                    response,
                    fieldName,
                    operations,
                    addToItemId(itemId, fieldName));
            }
        } else {
            field = items;
            typeInfo = parseType(items, operations);
            response = {};
            var rootFieldName = "data";
            if (!_hasSelector(field, operations) &&
                !_hasSelectorAll(field, operations) &&
                !_hasSelectorPath(field, operations)
            ) {
                // field.selector = ".";
                _setSelector(field, ".", operations);
            }
            powwow.processSelector(field, selectorScope, typeInfo, response, rootFieldName, operations, itemId);

            // Add the array to the end of the passed in array.
            if (powwow.isArray(response[rootFieldName])) {
                response[rootFieldName].unshift(responseArray.length, 0);
                Array.prototype.splice.apply(responseArray, response[rootFieldName]);
            } else {
                response[rootFieldName].$i = responseArray.length;
                responseArray.push(response[rootFieldName]);
            }
        }
    };

    powwow.processData = function (pageModel, selectorScope, response, operations, itemId) {
        var fieldName, pageModelKeys = Object.keys(pageModel);
        for (var i=0; i < pageModelKeys.length; i++) {
            fieldName = pageModelKeys[i];
            var field = pageModel[fieldName];
            var typeInfo = parseType(field, operations);
            powwow.processSelector(field,
                selectorScope,
                typeInfo,
                response,
                fieldName,
                operations,
                addToItemId(itemId, fieldName));
        }
    };

    powwow._fireEvents = function (input, scopedoc, events, resolve) {
        var nPos = events.indexOf(",");
        var func;
        if (nPos == -1) {
            func = powwow[events + "Event"];
            if (!func) {
                powwow.log("***** ERROR: NO SUCH EVENT:", events);
                resolve();
                return;
            }
            func(input, scopedoc);
            setTimeout(resolve, 0);
        } else {
            func = powwow[events.substring(0, nPos) + "Event"];
            if (!func) {
                powwow.log("***** ERROR: NO SUCH EVENT:", events.substring(0, nPos));
                resolve();
                return;
            }
            func(input, scopedoc);
            setTimeout(function () {
                powwow._fireEvents(input, scopedoc, events.substring(nPos + 1), resolve);
            }, 0);
        }
    };

    powwow.emptyPromise = function () {
        return new Promise(function (resolve) {
            resolve();
        });
    };

    /*
     * Get all the immediate child text nodes of a node as a string
     */
    powwow.getChildText = function (node) {
        var childText = "";
        for (var i = 0; i < node.childNodes.length; i++) {
            var childNode = node.childNodes[i];
            if (childNode.nodeType == 3) {
                if (childText.length > 0) {
                    childText += " ";
                }
                childText += childNode.nodeValue;
            }
        }
        return childText;
    };

    powwow.clickNode = function (node, scopedoc) {
        return new Promise(function (resolve) {
            if (!scopedoc) {
                scopedoc = document;
            }
            powwow.mousedownEvent(node, scopedoc);
            setTimeout(function () {
                powwow.mouseupEvent(node, scopedoc);
                setTimeout(function () {
                    powwow.clickEvent(node, scopedoc);
                    setTimeout(function () {
                        resolve();
                    }, 0);
                }, 20);
            }, 20);
        });
    };

    /*
     * Perform a "keyupEvent" event on a node.
     */
    powwow.keyupEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("HTMLEvents");
        evt.initEvent("keyup", false, true);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a "keydownEvent" event on a node.
     */
    powwow.keydownEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("HTMLEvents");
        evt.initEvent("keydown", false, true);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a "keypressEvent" event on a node.
     */
    powwow.keypressEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("HTMLEvents");
        evt.initEvent("keypress", false, true);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a "blur" event on a node.
     */
    powwow.blurEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("HTMLEvents");
        evt.initEvent("blur", false, true);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a "input" event on a node.
     */
    powwow.inputEvent = function (node, scopedoc) {
        var event = new Event('input', {
            'bubbles': true,
            'cancelable': true
        });
        node.dispatchEvent(event);
    };

    /*
     * Perform a "change" event on a node.
     */
    powwow.changeEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("HTMLEvents");
        evt.initEvent("change", false, true);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a "click" event on a node.
     */
    powwow.clickEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("MouseEvents");
        evt.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a "dblclick" event on a node.
     */
    powwow.dblclickEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("MouseEvents");
        evt.initMouseEvent('dblclick', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a "mouseup" action on a node
     */
    powwow.mouseupEvent = powwow.mouseUpEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("MouseEvents");
        evt.initMouseEvent("mouseup", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a "mousedown" action on a node
     */
    powwow.mousedownEvent = powwow.mouseDownEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("MouseEvents");
        evt.initMouseEvent("mousedown", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a "mouse right (button) down" action on a node
     */
    powwow.mouserightdownEvent = powwow.mouseRightDownEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("MouseEvents");
        evt.initMouseEvent("mousedown", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 2, null);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a "mouse right (button) up" action on a node
     */
    powwow.mouserightupEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("MouseEvents");
        evt.initMouseEvent("mouseup", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 2, null);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a "mouse right (button) up" action on a node
     */
    powwow.rightclickEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 2, null);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a right "dblclick" event on a node.
     */
    powwow.rightdblclickEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("MouseEvents");
        evt.initMouseEvent('dblclick', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 2, null);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a "mouseover" action on a node
     */
    powwow.mouseoverEvent = powwow.mouseOverEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("MouseEvents");
        evt.initEvent("mouseover", true, true);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a "mousemove" action on a node
     */
    powwow.mousemoveEvent = function(node, scopedoc, screenX, screenY, clientX, clientY) {
        var evt = scopedoc.createEvent("MouseEvents");
        var screen = {x: screenX || 0, y: screenY || 0};
        var client = {x: clientX || 0, y: clientY || 0};
        evt.initEvent("mousemove", true, true, window, 1, screen.x, screen.y, client.x, client.y, false, false, false, false, 0, null);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a "mouseout" action on a node
     */
    powwow.mouseoutEvent = powwow.mouseOutEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("MouseEvents");
        evt.initEvent("mouseout", true, true);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a "mouseenter" action on a node
     */
    powwow.mouseenterEvent = powwow.mouseEnterEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("MouseEvents");
        evt.initEvent("mouseenter", true, true);
        node.dispatchEvent(evt);
    };

    /*
     * Perform a "mouseenter" action on a node
     */
    powwow.mouseleaveEvent = powwow.mouseEnterEvent = function (node, scopedoc) {
        var evt = scopedoc.createEvent("MouseEvents");
        evt.initEvent("mouseleave", true, true);
        node.dispatchEvent(evt);
    };

    /*
     * Fire a specific key event on a node. e.g. powwow.sendKey(document.body, "keydown", 13) to send an enter event.
     */
    powwow.sendKey = function (node, event, keyCode) {
        var evt = document.createEventObject ?
            document.createEventObject() : document.createEvent("Events");

        if (evt.initEvent) {
            evt.initEvent(event, true, true);
        }

        evt.keyCode = keyCode;
        evt.which = keyCode;

        node.dispatchEvent ? node.dispatchEvent(evt) : node.fireEvent("on" + event, evt);
    };

    powwow.waitOnceForSpecificDOMMutationUsingSelector = function (selector, funcMutationsTest, timeoutInMs) {
        var rootNode = powwow.findNodeBySelector(selector, document);
        return powwow.waitOnceForSpecificDOMMutation(rootNode, funcMutationsTest, timeoutInMs);
    };

    powwow.waitOnceForSpecificDOMMutationUsingDescriptor = function (
        pageModel, itemId, funcMutationsTest, doc, timeoutInMs
    ) {
        var operations = {
            itemId: itemId,
            nodes: []
        };
        var typeInfo = parseType(pageModel);
        var container = {};
        powwow.processSelector(pageModel, doc, typeInfo, container, "response", operations, "");
        var rootNode = operations.nodes[0];
        powwow.log("Mutation item: '" + itemId + "' = " + getDOMNodeAsString(rootNode));
        return powwow.waitOnceForSpecificDOMMutation(rootNode, funcMutationsTest, timeoutInMs);
    };

    powwow.waitOnceForDOMMutationLullUsingDescriptor = function (
        pageModel, itemId, doc, lullTimeoutInMs, timeoutInMs
    ) {
        var operations = {
            itemId: itemId,
            nodes: []
        };
        var typeInfo = parseType(pageModel);
        var container = {};
        powwow.processSelector(pageModel, doc, typeInfo, container, "response", operations, "");
        var rootNode = operations.nodes[0];
        powwow.log("Mutation item: '" + itemId + "' = " + getDOMNodeAsString(rootNode));
        return powwow.waitForLullAfterDOMMutation(rootNode, lullTimeoutInMs, timeoutInMs);
    };

    powwow.setTemporaryMutationIgnoreList = function(ignoreList) {
        temporaryMutationIgnoreList = ignoreList;
    };

    /*
     * Returns a promise that resolved when a specific DOM mutation occurs or
     * until an optional timeout is reached.
     *
     * The promise function takes a parameter that indicates if there was a
     * timeout.
     * The test function allows for testing the mutation record (see
     * https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver#MutationRecord)
     *
     * e.g. To test when the element "<div id='loading-icon'>" is set to
     * "display:none", or timeout in 5 seconds if it doesn't happen,
     *      do this:
     *
     *  powwow.waitForSpecificDOMMutation(document.body, function (mutationRecord) {
     *      return (mutationRecord.target.id == "loading-icon" &&
     *              mutationRecord.type === "attributes" &&
     *              mutationRecord.attributeName === "style" &&
     *              mutationRecord.target.getAttribute("style") === "display:none;");
     *  }, 5000).then(function (didTimeout) {
     *      if (didTimeout) {
     *          powwow.log("Loading icon didn't go away in 5 seconds");
     *      } else {
     *          powwow.log("Loading icon went away!");
     *      }
     *  });
     */
    powwow.waitOnceForSpecificDOMMutation = function (rootNode, funcMutationsTest, timeoutInMs) {
        var mutationTypes = {
            childList: true,
            subtree: true,
            attributes: true
        };
        var nothingDoneTimer = 0;
        var nothingTimeout = timeoutInMs || 10000;
        return new Promise(function (resolve, reject) {
            var observer;

            var observerFunction = function (mutations) {
                var returnValue;
                try {
                    returnValue = funcMutationsTest(mutations);
                } catch (e) {
                    powwow.log("Mutation test function threw an exception: ", e.stack);
                }

                if (returnValue) {
                    if (nothingDoneTimer) {
                        clearTimeout(nothingDoneTimer);
                    }
                    observer.disconnect();
                    resolve(returnValue);
                }
            };

            nothingDoneTimer = setTimeout(function () {
                if (observer) {
                    observer.disconnect();
                }
                if (rootNode) {
                    var loggedNode = getDOMNodeAsString(rootNode);
                    powwow.log("waitForSpecificDOMMutation of " + loggedNode + " timed out");
                } else {
                    powwow.log("waitForSpecificDOMMutation of unknown node timed out");
                }
                resolve(false);
                reject();
            }, nothingTimeout);

            observer = new MutationObserver(observerFunction);
            observer.observe(rootNode, mutationTypes);
        });
    };

    powwow.waitForLullAfterDOMMutation = function (rootNode, lullTimeout, timeoutInMs) {
        var mutationTypes = {
            childList: true,
            subtree: true,
            attributes: true
        };
        var nothingDoneTimer = 0;
        var nothingTimeout = timeoutInMs || 10000;
        return new Promise(function (resolve, reject) {
            var observer;
            var intervalId = null;
            var observerFunction = function () {
                if (intervalId) {
                    clearTimeout(intervalId);
                }
                intervalId = setTimeout(function () {
                    // Regardless of what happened in mutations, resolve to true;
                    clearTimeout(nothingDoneTimer);
                    resolve(true);
                }, lullTimeout);
            };

            nothingDoneTimer = setTimeout(function () {
                if (observer) {
                    observer.disconnect();
                }
                if (rootNode) {
                    var loggedNode = getDOMNodeAsString(rootNode);
                    powwow.log("waitForLullAfterDOMMutation of " + loggedNode + " timed out");
                } else {
                    powwow.log("waitForLullAfterDOMMutation of unknown node timed out");
                }
                resolve(false);
                reject();
            }, nothingTimeout);

            observer = new MutationObserver(observerFunction);
            observer.observe(rootNode, mutationTypes);
        });
    };

    powwow.getCurrentWindow = function () {
        return window;
    };

    powwow.getAllFrameWindows = function (win) {
        function _getFrames(w, arr) {
            arr.push(w);
            for (var i = 0; i < w.frames.length; i++) {
                _getFrames(w.frames[i], arr);
            }
        }

        var arrWindows = [];
        _getFrames(win, arrWindows);
        return arrWindows;
    };

    var domMutationLoggingObservers = [];
    var mutationIgnoreList = [];
    var temporaryMutationIgnoreList = [];

    function getSingleDOMNodeAsString(node) {
        return "<" + (node.nodeName == "#document" ? "HTML" : node.nodeName) +
            (node.id ? " id='" + node.id + "'" : "") +
            (node.className ? " class='" + node.className + "'" : "") + ">";
    }

    function getDOMNodeAsString(node) {
        var nodePath = "";
        while (node) {
            nodePath = getSingleDOMNodeAsString(node) + nodePath;
            node = node.parentElement;
        }

        return nodePath;
    }

    // E.g. powwow.setMutationIgnoreList(["<DIV class='gates_searchLabelText'>",
    //                                    "<DIV class='gates_departureTimeLbl'>",
    //                                    "<DIV class='gates_timeinfo'>",
    //                                    "<DIV class='gates_monthInfo'>"]);
    powwow.setMutationIgnoreList = function (mutationsToIgnore) {
        mutationIgnoreList.length = 0; // Clear the existing list.

        // Append the new list into the existing list.
        mutationIgnoreList.splice.apply(mutationIgnoreList, [0, 0].concat(mutationsToIgnore));
    };

    powwow.startLoggingDOMMutations = function (rootNode) {
        var mutationTypes = {
            childList: true,
            subtree: true,
            attributes: true
        };

        var observer = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var nodeAsString = getDOMNodeAsString(mutations[i].target);
                var handleMutation = true;
                for (var j = 0; handleMutation && j < mutationIgnoreList.length; j++) {
                    var mutationToIgnore = mutationIgnoreList[j];
                    if (mutationToIgnore.charAt(0) == '=') {
                        mutationToIgnore = mutationToIgnore.substring(1);
                        if (nodeAsString == mutationToIgnore) {
                            handleMutation = false;
                            break;
                        }
                    } else {
                        if (nodeAsString.indexOf(mutationToIgnore) >= 0) {
                            handleMutation = false;
                            break;
                        }
                    }
                }
                if (handleMutation) {
                    powwow.log("DOMMutation[" + i +
                        "] Type:", mutations[i].type, "Path:", nodeAsString);
                    if (mutations[i].type == "attributes") {
                        var value = mutations[i].target.getAttribute(mutations[i].attributeName);
                        powwow.log("Attribute Changed: ", mutations[i].attributeName, "=", value);
                    }
                }
            }
        });

        observer.observe(rootNode, mutationTypes);
        domMutationLoggingObservers.push(observer);
    };

    if (!powwow.globalDomMutationObservers) {
        powwow.globalDomMutationObservers = [];
    }

    powwow.addToGlobalMutationListener = function (rootNode) {
        if (powwow.globalDomMutationObservers.length > 0) {
            return;
        }
        var mutationTypes = {
            childList: true,
            subtree: true,
            attributes: true
        };

        var observer = new MutationObserver(function (mutations) {
            var mutationData = "";
            for (var i = 0; i < mutations.length; i++) {
                var nodeAsString = getDOMNodeAsString(mutations[i].target);
                var handleMutation = true;

                var ignoreList = temporaryMutationIgnoreList.concat(mutationIgnoreList);
                for (var j = 0; handleMutation && j < ignoreList.length; j++) {
                    var mutationToIgnore = ignoreList[j];
                    if (mutationToIgnore.charAt(0) == '=') {
                        mutationToIgnore = mutationToIgnore.substring(1);
                        if (nodeAsString == mutationToIgnore) {
                            handleMutation = false;
                            break;
                        }
                    } else {
                        if (nodeAsString.indexOf(mutationToIgnore) >= 0) {
                            handleMutation = false;
                            break;
                        }
                    }
                }
                if (handleMutation) {
                    mutationData += nodeAsString + "\n";
                }
            }
            if (mutationData.length > 0) {
                powwow.sendPageMessage("window.domMutation", mutationData);
            }
        });

        observer.observe(rootNode, mutationTypes);
        powwow.globalDomMutationObservers.push(observer);
    };

    powwow.removeGlobalMutationListeners = function () {
        while (powwow.globalDomMutationObservers.length > 0) {
            var observer = powwow.globalDomMutationObservers.shift();
            observer.disconnect();
        }
    };

    powwow.stopLoggingDOMMutations = function () {
        while (domMutationLoggingObservers.length > 0) {
            var observer = domMutationLoggingObservers.shift();
            observer.disconnect();
        }
    };

    powwow.sendPageMessage = function (msgEvent, msgData) {
        window.top.callPhantom({ event: msgEvent, data: msgData });
    };

    powwow.log = function () {
        if (powwow.ENV === 'development') {
            console.log(Array.prototype.slice.call(arguments).join(' '));
        }
    };

    powwow.getDescriptor = function (mainObj, pageModel) {
        var path = pageModel.split(".");
        var childObject = mainObj[path[0]];

        if (path.length > 1) {
            path.shift();
            return powwow.getDescriptor(childObject, path.join("."));
        }
        if (!childObject) {
            powwow.log("**** DESCRIPTOR: '" + pageModel +
                "' not found! Check that it is in models/index.json and ensure JSON file is valid. ****");
        }

        return childObject;
    };

    powwow.getStateDescriptor = function (stateModelId) {
        if (powwow.stateModels) {
            for (var i = 0; i < powwow.stateModels.length; i++) {
                if(powwow.stateModels[i].id == stateModelId) {
                    return powwow.stateModels[i];
                }
            }
        } else {
            // This must be the Chrome Extension since otherwise we would have state models defined.
            return powwow.models[stateModelId];
        }
    };

    powwow.extract = function (pageModel, scopedoc) {
        return new Promise(function (resolve) {
            if (!scopedoc) {
                scopedoc = document;
            }

            var operations = {
                setterMap: null, //
                gets: []
            };
            var typeInfo = parseType(pageModel, operations);
            var container = {};

            try {
                powwow.processSelector(pageModel, scopedoc, typeInfo, container, 'response', operations, '');
            } catch (e) {
                powwow.log('Cannot extract model ' + pageModel.id + ":", e.stack);
            }

            processGetterOperations(operations, resolve, container);
        });
    };

    function processGetterOperations(operations, resolve, container) {
        while(operations.gets.length > 0) {
            var getterOp = operations.gets.shift();
            var getterFunc = powwow.controls[getterOp.type].get;
            if(!getterFunc) {
                resolve(container.response);
                return;
            }
            var valueOrPromise;
            try {
                valueOrPromise = getterFunc.call(powwow, getterOp.node, getterOp.param);
            } catch (e) {
                valueOrPromise = undefined;
                powwow.log(getterOp.field + ": " + getterOp.type + ".get() error:", e.stack);
            }

            if(powwow.controls[getterOp.type].getterReturnsPromise && valueOrPromise) {
                valueOrPromise.then(function (value) {
                    getterOp.container[getterOp.field] = value;
                    if (getterOp.fn) {
                        try {
                            getterOp.container[getterOp.field] = getterOp.fn.call(powwow, getterOp.container[getterOp.field], ...(getterOp.args||[]));
                        } catch (e) {
                            powwow.log(getterOp.field + ": " + getterOp.type + ".get function error:", e.stack);
                        }
                    }
                    processGetterOperations(operations, resolve, container);
                });
                return;
            } else {
                getterOp.container[getterOp.field] = valueOrPromise;
                if (getterOp.fn) {
                    try {
                        getterOp.container[getterOp.field] = getterOp.fn.call(powwow, getterOp.container[getterOp.field], ...(getterOp.args||[]));
                    } catch (e) {
                        powwow.log(getterOp.field + ": " + getterOp.type + ".get function error:", e.stack);
                    }
                }
            }
        }
        if (operations.sorts) {
            for (i = 0; i < operations.sorts.length; i++) {
                sortArray(operations.sorts[i].array, operations.sorts[i].sort);
            }
        }
        resolve(container.response);
    }

    powwow.update = function (pageModel, data, scopedoc) {
        return new Promise(function (resolve) {
            if (!scopedoc) {
                scopedoc = document;
            }
            var operations = {
                setterMap: flattenData(data),
                sets: []
            };
            var typeInfo = parseType(pageModel, operations);
            var container = {};
            try {
                powwow.processSelector(pageModel, scopedoc, typeInfo, container, "response", operations, "");
            } catch (e) {
                powwow.log("Error during update call:", e.stack);
            }
            processSetterOperations(operations, resolve, scopedoc);
        });
    };

    powwow.getNodeByDescriptorPath = function (pageModel, path, scopedoc) {
        return new Promise(function (resolve) {
            if (!scopedoc) {
                scopedoc = document;
            }
            var operations = {
                itemId: path,
                nodes: []
            };

            var typeInfo = parseType(pageModel, operations);
            var container = {};
            try {
                powwow.processSelector(pageModel, scopedoc, typeInfo, container, "response", operations, "");
            } catch (e) {
                powwow.log("Error during getNodeByDescriptorPath call:", e.stack);
            }
            var foundNode = null;
            if(operations.nodes.length > 0) {
                foundNode = operations.nodes[0];
            }
            resolve(foundNode);
        });
    };

    function processSetterOperations(operations, resolve, scopedoc) {
        if(operations.sets.length > 0) {
            createSetterPromise(scopedoc, operations.sets.shift()).then(function() {
                processSetterOperations(operations, resolve, scopedoc);
            });
        } else {
            resolve();
        }
    }

    function createSetterPromise(scopedoc, setterOp) {
        return new Promise(function(resolve) {
            var setterFunc = powwow.controls[setterOp.type].set;
            try {
                setterFunc.call(powwow, scopedoc, setterOp.node, setterOp.value, setterOp.param).then(resolve);
            } catch (e) {
                powwow.log("Failed to run setter for " + setterOp.type);
                powwow.log(e.stack);
                resolve();
            }
        });
    }

    powwow.action = function (pageModel, actionItemId, scopedoc) {
        var data = {};
        data[actionItemId] = true;
        return powwow.update(pageModel, data, scopedoc);
    };

    powwow.checkStateUsingDescriptor = function (testAll) {

        function getValueByPath(data, path) {
            var objectEndIndex = path.indexOf('.');
            if (objectEndIndex >= 0) {
                var objectPart = path.substring(0, objectEndIndex);
                var remainingPart = path.substring(objectEndIndex + 1);
                if (data[objectPart]) {
                    return getValueByPath(data[objectPart], remainingPart);
                }
                // else { return undefined; } // We don't actually need to write this...
            } else { // No "." in path.
                return data[path];
            }
        }

        function testNextDescriptor(arrPageModels, resolve, arrAllMatches) {
            if (arrPageModels.length > 0) {
                var pageModel = arrPageModels.shift();
                powwow.extract(pageModel).then(function (extractedData) {
                    if (extractedData && Object.keys(extractedData).length > 0) {
                        var arrConnections = pageModel.connect;
                        for (var connectionIndex = 0; connectionIndex < arrConnections.length; connectionIndex++) {
                            var arrMatchKeys = arrConnections[connectionIndex].match;
                            var variantMatch = !!arrMatchKeys.length;

                            for (var i = 0; variantMatch && i < arrMatchKeys.length; i++) {
                                var dataValue = getValueByPath(extractedData, arrMatchKeys[i]);
                                if (dataValue !== true) {
                                    variantMatch = false;
                                }
                            }
                            if (variantMatch) {
                                var connectionName = "";
                                if (arrConnections[connectionIndex].event) {
                                    connectionName = arrConnections[connectionIndex].event;
                                } else if (arrConnections[connectionIndex].screens) {
                                    connectionName = arrConnections[connectionIndex].screens[0];
                                } else if (arrConnections[connectionIndex].action) {
                                    connectionName = arrConnections[connectionIndex].action;
                                }
                                if (!testAll) {
                                    resolve({
                                        mainModel: pageModel.id,
                                        name: connectionName,
                                        index: connectionIndex,
                                        screens: arrConnections[connectionIndex].screens,
                                        model: arrConnections[connectionIndex].model,
                                        event: arrConnections[connectionIndex].event,
                                        action: arrConnections[connectionIndex].action
                                    });
                                    return;
                                } else {
                                    arrAllMatches.push({
                                        mainModel: pageModel.id,
                                        name: connectionName,
                                        index: connectionIndex,
                                        screens: arrConnections[connectionIndex].screens,
                                        model: arrConnections[connectionIndex].model,
                                        event: arrConnections[connectionIndex].event,
                                        action: arrConnections[connectionIndex].action
                                    });
                                }
                            }
                        }
                    }
                    testNextDescriptor(arrPageModels, resolve, arrAllMatches);
                });

            } else {
                if (testAll) {
                    resolve(arrAllMatches);
                } else {
                    // No state found.
                    resolve();
                }
            }
        }

        return new Promise(function (resolve) {
            // Copy the array of page models used for identifying aside.
            var models = [];
            if (powwow.stateModels && powwow.stateModels.length) {
                for (var i = 0; i < powwow.stateModels.length; i++) {
                    models.push(powwow.stateModels[i]);
                }
            } else {
                // This must be the Chrome Extension since otherwise we would have state models defined.
                var key, descriptorKeys = Object.keys(powwow.models);
                for (var i = 0; i < descriptorKeys.length; i++) {
                    key = descriptorKeys[i];
                    if (powwow.models[key].connect) {
                        powwow.models[key].id = key;
                        models.push(powwow.models[key]);
                    }
                }
            }

            if (testAll) {
                var arrAllMatches = [];
                testNextDescriptor(models, resolve, arrAllMatches);
            } else {
                testNextDescriptor(models, resolve);
            }
        });
    };

    // Helper methods used to test for mutations.

    powwow.mutations = {};

    powwow.mutations.anyMutation = function () {
        return true;
    };

    // {selector: "#contentPane", attribute: "disabled", value: "disabled"}
    powwow.mutations.mutationHas = function (mutations, match) {
        for (var i = 0; i < mutations.length; i++) {
            var mutation = mutations[i];
            if (mutation.target.ownerDocument.querySelector(_getSelector(match)) === mutation.target) {
                if (match.hasOwnProperty("attribute") && mutation.type == "attributes") {
                    if (match.attribute == mutation.attributeName) {
                        var val = mutation.target.getAttribute("disabled");
                        if (val == match.value) {
                            return true;
                        }
                    }
                }
            }
        }
    };

    powwow.mutations.log = function (mutations) {
        powwow.log("========= Mutations, n = " + mutations.length + " START =========");
        for (var i = 0; i < mutations.length; i++) {
            powwow.log("DOMMutation[" + i +
                "] Type:", mutations[i].type, "Path:", getDOMNodeAsString(mutations[i].target));
            if (mutations[i].type == "attributes") {
                var value = mutations[i].target.getAttribute(mutations[i].attributeName);
                powwow.log("Attribute Changed: ", mutations[i].attributeName, "=", value);
            }
        }
        powwow.log("========= Mutations, n = " + mutations.length + " END =========");
    };

    powwow.countElements = function (pageModel, itemId) {
        var parts = itemId.split('.');
        parts.shift();
        parts.pop();
        var parentItemId = parts.join('.');
        var doc = powwow.getCurrentWindow().document;
        var operations = {
            itemId: parentItemId,
            nodes: []
        };
        var typeInfo = parseType(pageModel);
        var container = {};
        powwow.processSelector(pageModel, doc, typeInfo, container, 'response', operations, '');
        if (parentItemId) {
            var parent = operations.nodes[0];
            var idParts = itemId.split('.');
            idParts.shift();
            var field = _getFieldById(pageModel, idParts);
            var selector = field.selector || field.selectorAll;
            var nodes = parent.querySelectorAll(selector);
            return nodes.length;
        } else {
            return operations.nodes.length;
        }
    };

    // HELPERS ------------------------------------------------------------------------------------

    function _getFieldById(field, idParts) {
        while (idParts.length) {
            if (field.type === 'array') {
                field = field.items;
            }
            if (field.type === 'object') {
                field = field.properties;
            }
            var id = idParts.shift();
            field = field[id];
        }
        return field;
    }

})(window.powwow);

(function (powwow, Promise) {
powwow.controls = {};
powwow.find = {};
var exports;
exports = {
    set: function (scopedoc, node, value, actionType) {
        return new Promise(function (resolve) {
            // If no value is specified in the action, don't perform it.  Value
            // must be true.
            if (!value) {
                resolve();
                return;
            }
            /* Clicks the node */
            if (actionType == "form") {
                node.submit();
                setTimeout(resolve, 0);
            } else if (actionType == "dblclick") {
                powwow._fireEvents(node, scopedoc, "mousedown,mouseup,click,mousedown,mouseup,dblclick", resolve);
            } else if (actionType == "button" || actionType == "link" || actionType == "click") {
                powwow._fireEvents(node, scopedoc, "mousedown,mouseup,click", resolve);
            } else {
                powwow._fireEvents(node, scopedoc, actionType, resolve);
            }
        });
    }
};

powwow['controls']['action'] = exports;
exports = {
    get: function (node, attribute) {
        if (attribute !== null) {
            return node.getAttribute(attribute);
        } else {
            powwow.log('No attribute specified for attrib control');
            return node;
        }
    }
};
powwow['controls']['attrib'] = exports;
exports = {
    get: function (checkBoxNode) {
        return checkBoxNode ? checkBoxNode.checked : false;
    },
    set: function (scopedoc, checkBoxNode, boolValue) {
        return new Promise(function (resolve) {
            var currentVal = powwow.controls.checkbox.get(checkBoxNode);
            if (boolValue !== currentVal) {
                //checkBoxNode.checked = boolValue;
                powwow.clickNode(checkBoxNode, scopedoc).then(resolve);
            } else {
                resolve();
            }
        });
    }
};
powwow['controls']['checkbox'] = exports;
exports = {
    get: function (node, styleName) {
        if (styleName !== null) {
            return getComputedStyle(node)[styleName];
        } else {
            powwow.log('No style specified for computedstyle control');
            return node;
        }
    }
};
powwow['controls']['computedstyle'] = exports;
exports = {
    /*
     * Simply return the pameter value
     */
    get: function (node, value) {
        return value;
    }
};

powwow['controls']['constant'] = exports;
exports = {
    /*
     * Checks for a node's existence based on the selector finding it.
     */
    get: function (node) {
        return !!node;
    }
};

powwow['controls']['exists'] = exports;
exports = {
    /*
     * Checks for a node having a particular class name.
     */
    get: function (node, className) {
        return node.classList.contains(className);
    }
};
powwow['controls']['hasClass'] = exports;
exports = {
    get: function (node, styleNameAndValueTest) {
        if (styleNameAndValueTest !== null) {
            var styleValueSeperatorPos = styleNameAndValueTest.indexOf('=');
            if (styleValueSeperatorPos == -1) {
                powwow.log('Missing "=" in hasComputedstyle control parameter');
                return false;
            }
            return getComputedStyle(node)[styleNameAndValueTest.substring(0, styleValueSeperatorPos)] == styleNameAndValueTest.substring(styleValueSeperatorPos + 1);
        } else {
            powwow.log('No style specified for hasComputedstyle control');
            return false;
        }
    }
};
powwow['controls']['hasComputedstyle'] = exports;
exports = {
    // Type with no setters and getters, used to select a node that will be used in a mutation listener.
};

powwow['controls']['none'] = exports;
exports = {
    /*
     * Get a property of a node.  Node itself is returned if there is no property.
     */
    get: function (node, property) {
        if (!property) {
            return node;
        }
        return node[property];
    }
};
powwow['controls']['property'] = exports;
exports = {
    /* hasMultipleNodes - indicates that selectorAll should be used with a control that isn't an array */
    hasMultipleNodes: true,
    /*
     * Get the list of options and current selection of a set of <INPUT
     * type='radio'> elements
     */
    get: function (formRadioElements) {
        if (formRadioElements.length == 0) {
            return;
        }
        var response = {
            selected: null,
            options: []
        };
        for (var i = 0; i < formRadioElements.length; i++) {
            var radioElement = formRadioElements[i];
            var label = powwow.controls.radio.label(radioElement);
            var option = {
                label: label,
                value: radioElement.getAttribute("value")
            };
            if (powwow.controls.radio.disabled(radioElement)) {
                option.disabled = true;
            }
            response.options.push(option);
            if (radioElement.checked) {
                response.selected = option;
            }
        }
        //powwow.log("getRadioDataAndSelection", radioName,
        // response.selected.value);
        return response;
    },
    set: function (scopedoc, nodeList, radioValue) {
        return new Promise(function (resolve) {
            for (var i = 0; i < nodeList.length; i++) {
                if (nodeList[i].value == radioValue) {
                    powwow.clickNode(nodeList[i], scopedoc).then(resolve);
                    return;
                }
            }
            resolve();
        });
    },
    label: function (radioInput) {
        var label = "????";
        var labelElement = radioInput.nextSibling;
        if (labelElement) {
            if (labelElement.nodeType == 3) {
                label = labelElement.nodeValue;
            } else if (labelElement.nodeType == 1) {
                label = labelElement.innerText;
            }
        }
        return label;
    },
    disabled: function (radioInput) {
        return radioInput.hasAttribute("disabled");
    }
};

powwow['controls']['radio'] = exports;
exports = {
    get: function (node, param) {

        if (param) {
            node = node[param];
        }
        if (node) {
            var isMultiSelect = node.multiple;
            var response = {
                selected: null,
                options: []
            };
            if (isMultiSelect) {
                response.selected = [];
            }
            var options = node.options;
            var selectedValue = node.value;
            for (var iOption = 0; iOption < options.length; iOption++) {
                // Check if option is selected
                var option = options[iOption];
                var extractedOption = {
                    label: option.innerHTML,
                    value: option.value
                };
                response.options.push(extractedOption);
                if (isMultiSelect) {
                    if (option.selected) {
                        response.selected.push(option.value);
                    }
                } else if (extractedOption.value === selectedValue) {
                    response.selected = extractedOption;
                }
            }
            if (node.hasAttribute("disabled")) {
                response.disabled = true;
            }
            return response;
        }
    },
    set: function (scopedoc, selectNode, value, param) {
        return new Promise(function (resolve) {
            if (param) {
                selectNode = selectNode[param];
            }
            if (powwow.isObject(value) && value.hasOwnProperty('selected')) {
                value = value.selected.value;
            }
            //console.log("select value is:" + JSON.stringify(value));
            if (powwow.isArray(value)) {
                var changed = false;
                for (var i = 0; i < selectNode.options.length; i++) {
                    if (value.indexOf(selectNode.options[i].value) >= 0) {
                        if (!selectNode.options[i].selected) {
                            changed = true;
                        }
                        selectNode.options[i].selected = true;
                    } else {
                        if (selectNode.options[i].selected) {
                            changed = true;
                        }
                        selectNode.options[i].selected = false;
                    }
                    if (changed) {
                        powwow.changeEvent(selectNode, scopedoc);
                        setTimeout(resolve, 0);
                    } else {
                        resolve();
                    }
                }
            } else {
                var newValue = (value === undefined) ? '' : value;
                if (selectNode.value !== newValue) {
                    selectNode.value = newValue;
                    powwow.changeEvent(selectNode, scopedoc);
                    setTimeout(resolve, 0);
                } else {
                    //powwow.log("Not setting select value as it hasn't changed",
                    // selectSelector);
                    resolve();
                }
            }
            //powwow.log("SetSelect", selectSelector,
            // scopedoc.querySelector(selectSelector).value);
        });
    }
};
powwow['controls']['select'] = exports;
exports = {
    get: function (node, styleName) {
        if (styleName !== null) {
            return node.style[styleName];
        } else {
            powwow.log('No style specified for style control');
            return node;
        }
    }
};
powwow['controls']['style'] = exports;
exports = {
    get: function (node) {
        return node.value;
    },
    set: function (scopedoc, input, value, events) {
        return new Promise(function (resolve) {
            var newValue = (value === undefined) ? '' : value;
            if (input.value !== newValue) {
                // https://github.com/assaf/zombie/issues/1123
                // Instead of calling the straighforward:
                //     input.value = newValue;
                // Need to do this because ".value" may not be the raw DOM property.
                let descriptor = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value');
                descriptor.set.call(input, value);

                if (!events) {
                    events = "input,change,blur";
                }
                powwow._fireEvents(input, scopedoc, events, resolve);
            } else if (events) {
                powwow._fireEvents(input, scopedoc, events, resolve);
            } else {
                resolve();
            }
        });
    }
};

powwow['controls']['text'] = exports;
exports = {
    get: function (node, param) {
        var normhref = window.location.href.toLowerCase();
        var normparam = param.toLowerCase();
        return (normhref.indexOf(normparam) >= 0);
    }
};

powwow['controls']['url'] = exports;
[]
powwow['controls']['index'] = exports;
exports = {
    get: function (node, param) {

        if (param) {
            node = node[param];
        }
        if (node) {
            var isMultiSelect = node.multiple;
            var response = {
                selected: null,
                options: []
            };

            var options = node.options;
            if (isMultiSelect) {
                response.selected = [];
            }
            else {
                response.selected = node.value;
            }

            for (var iOption = 0; iOption < options.length; iOption++) {
                // Check if option is selected
                var option = options[iOption];
                var extractedOption = {
                    label: option.innerHTML,
                    value: option.value
                };
                response.options.push(extractedOption);
                if (isMultiSelect && option.selected) {
                    response.selected.push(option.value);
                }
            }

            if (node.hasAttribute('disabled')) {
                response.disabled = true;
            }
            return response;
        }
    },
    set: function (scopedoc, selectNode, value, param) {
        return new Promise(function (resolve) {
            if (param) {
                selectNode = selectNode[param];
            }
            if (powwow.isObject(value) && value.hasOwnProperty('selected')) {
                value = value.selected;
            }
            //console.log("select value is:" + JSON.stringify(value));
            if (powwow.isArray(value)) {
                var changed = false;
                for (var i = 0; i < selectNode.options.length; i++) {
                    if (value.indexOf(selectNode.options[i].value) >= 0) {
                        if (!selectNode.options[i].selected) {
                            changed = true;
                        }
                        selectNode.options[i].selected = true;
                    } else {
                        if (selectNode.options[i].selected) {
                            changed = true;
                        }
                        selectNode.options[i].selected = false;
                    }
                    if (changed) {
                        powwow.changeEvent(selectNode, scopedoc);
                        setTimeout(resolve, 0);
                    } else {
                        resolve();
                    }
                }
            } else {
                var newValue = (value === undefined) ? '' : value;
                if (selectNode.value !== newValue) {
                    selectNode.value = newValue;
                    powwow.changeEvent(selectNode, scopedoc);
                    setTimeout(resolve, 0);
                } else {
                    //powwow.log("Not setting select value as it hasn't changed",
                    // selectSelector);
                    resolve();
                }
            }
            //powwow.log("SetSelect", selectSelector,
            // scopedoc.querySelector(selectSelector).value);
        });
    }
};

powwow['controls']['select2'] = exports;
[]
powwow['extract']['index'] = exports;
exports = function firstMatchAfterNode(startNode, query, ) {
    let match;
    if (startNode.matches(query)) {
        return startNode;
    }
    else if (match = startNode.querySelector(query)) {
        return match;
    }
    else if (startNode.nextElementSibling){
        return firstMatchAfterNode(startNode.nextElementSibling, query);
    }
    else if (startNode.parentElement &&
        startNode.parentElement.nextElementSibling
    ) {
        return firstMatchAfterNode(startNode.parentElement.nextElementSibling, query);
    }
    else {
        return null;
    }
}
powwow['find']['findAfter'] = exports;
[]
powwow['find']['index'] = exports;
exports = function (node, selector) {
    const matches = document.querySelectorAll(selector);
    return matches[matches.length - 1];
}
powwow['find']['lastMatch'] = exports;
powwow.models = {
  "createexpense": {
    "type": "object",
    "comment": "Blank",
    "properties": {
      "reportId": {
        "type": "string",
        "control": "property.innerText",
        "selector": "span[id='REPORT_ID']"
      },
      "employeeId": {
        "type": "string",
        "control": "text",
        "selector": "input[type='text'][id='EMP_ID']"
      },
      "expenses": {
        "type": "array",
        "update": {
          "type": "none"
        },
        "selectorAll": "input[type='date']",
        "items": {
          "type": "object",
          "properties": {
            "date": {
              "type": "string",
              "control": "text",
              "selector": {
                "selector": "",
                "fn": "findAfter",
                "args": [
                  [
                    "[id^='DATE']"
                  ]
                ]
              }
            },
            "category": {
              "type": "select",
              "selector": {
                "selector": "",
                "fn": "findAfter",
                "args": [
                  [
                    "[id^='CATEGORY']"
                  ]
                ]
              },
              "control": "select2"
            },
            "description": {
              "type": "string",
              "selector": {
                "selector": "",
                "fn": "findAfter",
                "args": [
                  [
                    "[id^='DESCRIPTION']"
                  ]
                ]
              },
              "control": "text"
            },
            "amount": {
              "type": "string",
              "control": "text",
              "selector": {
                "selector": "",
                "fn": "findAfter",
                "args": [
                  "[id^='AMOUNT']"
                ]
              }
            },
            "removeRow": {
              "type": "action",
              "control": "action.click",
              "selector": {
                "selector": "",
                "fn": "findAfter",
                "args": [
                  "[id^='REMOVE']"
                ]
              }
            },
            "location": {
              "type": "string",
              "selector": {
                "selector": "",
                "fn": "findAfter",
                "args": [
                  "[id^='LOCATION']"
                ]
              },
              "control": "text"
            },
            "customerName": {
              "type": "string",
              "control": "text",
              "selector": {
                "selector": "",
                "fn": "findAfter",
                "args": [
                  "[id^='CUSTNAME']"
                ]
              }
            },
            "hadAlchohol": {
              "type": "boolean",
              "selector": {
                "selector": "",
                "fn": "findAfter",
                "args": [
                  "[id^='ALCHOHOL']"
                ]
              },
              "control": "text"
            }
          }
        }
      },
      "addRow": {
        "type": "action",
        "control": "action.click",
        "selector": {
          "fn": "lastMatch",
          "args": [
            "button[id^='ADD']"
          ],
          "selector": ""
        }
      },
      "summary": {
        "type": "string",
        "control": "text",
        "selector": "textarea[id='SUMMARY']"
      },
      "submit": {
        "type": "action",
        "control": "action.click",
        "selector": "button",
        "selectContains": "Submit"
      }
    },
    "id": "createexpense",
    "connect": [
      {
        "match": [
          "isCreateExpense"
        ],
        "event": "createexpense"
      }
    ]
  }
}
powwow.stateModels = [
  {
    "type": "object",
    "comment": "Blank",
    "properties": {
      "expenses": {
        "type": "array",
        "update": {
          "type": "none"
        },
        "selectorAll": "input[type='date']",
        "items": {
          "type": "object",
          "properties": {}
        }
      },
      "isCreateExpense": {
        "type": "identifier",
        "control": "exists",
        "selector": "button[id='ADD$0']"
      }
    },
    "id": "createexpense",
    "connect": [
      {
        "match": [
          "isCreateExpense"
        ],
        "event": "createexpense"
      }
    ]
  }
]
powwow.models_loaded = true;
})(window.powwow, window.powwow.Promise);
//# sourceURL=http://PowWow.SmartUX/inject.js
