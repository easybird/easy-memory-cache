'use strict';

function createCache() {
    var cache = Object.create(null);
    var debug = false;
    var hitCount = 0;
    var missCount = 0;
    var size = 0;

    function put(key, value, time, timeoutCallback) {
        if (debug) {
            console.log('caching: %s = %j (@%s)', key, value, time);
        }

        if (typeof time !== 'undefined' && (typeof time !== 'number' || isNaN(time) || time <= 0)) {
            throw new Error('Cache timeout must be a positive number');
        } else if (typeof timeoutCallback !== 'undefined' && typeof timeoutCallback !== 'function') {
            throw new Error('Cache timeout callback must be a function');
        }

        var oldRecord = cache[key];
        if (oldRecord) {
            clearTimeout(oldRecord.timeout);
        } else {
            size++;
        }

        var record = {
            value: value,
            expire: time + Date.now()
        };

        if (!isNaN(record.expire)) {
            record.timeout = setTimeout(function () {
                _del(key);
                if (timeoutCallback) {
                    timeoutCallback(key, value);
                }
            }, time);
        }

        cache[key] = record;

        return value;
    };

    function del(key) {
        var canDelete = true;

        var oldRecord = cache[key];
        if (oldRecord) {
            clearTimeout(oldRecord.timeout);
            if (!isNaN(oldRecord.expire) && oldRecord.expire < Date.now()) {
                canDelete = false;
            }
        } else {
            canDelete = false;
        }

        if (canDelete) {
            _del(key);
        }

        return canDelete;
    };

    function _del(key) {
        size--;
        delete cache[key];
    }

    function clear() {
        for (var key in cache) {
            clearTimeout(cache[key].timeout);
        }
        size = 0;
        cache = Object.create(null);
        hitCount = 0;
        missCount = 0;
    };

    function get(key) {
        var data = cache[key];
        if (typeof data != "undefined") {
            if (isNaN(data.expire) || data.expire >= Date.now()) {
                hitCount++;
                return data.value;
            } else {
                // free some space
                missCount++;
                size--;
                delete cache[key];
            }
        } else {
            missCount++;
        }
        return null;
    };

    function memsize() {
        var size = 0,
            key;
        for (key in cache) {
            size++;
        }
        return size;
    };

    return {
        put: put,
        del: del,
        clear: clear,
        get: get,
        memsize: memsize,
        size: () => size,
        debug: (bool) => debug = bool,
        hits: () => hitCount,
        misses: () => missCount,
        keys: () => Object.keys(cache)
    };
}

module.exports = createCache();
module.exports.createCache = createCache;