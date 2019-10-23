"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.INSTANCE_STORAGE = exports.SESSION_STORAGE = exports.LOCAL_STORAGE = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * Checks if the browser storage type is available
 * @param {string} type - the type of storage (localStorage|sessionStorage)
 * @return {boolean}
 */
function storageAvailable(type) {
  var storage;

  try {
    storage = window[type];
    var x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    try {
      return e instanceof DOMException && ( // everything except Firefox
      e.code === 22 || // Firefox
      e.code === 1014 || // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' || // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') && // acknowledge QuotaExceededError only if there's something already stored
      storage.length !== 0;
    } catch (error) {
      return false;
    }
  }
}
/**
 * Converts the key to a string
 * @param {*} key
 * @return {string}
 */


function stringifyKey(key) {
  return "".concat(key);
}
/**
 * A light cache object
 */


var InstanceStorage =
/*#__PURE__*/
function () {
  function InstanceStorage() {
    _classCallCheck(this, InstanceStorage);

    this.cache = {};
  }

  _createClass(InstanceStorage, [{
    key: "setItem",
    value: function setItem(key, value) {
      this.cache[stringifyKey(key)] = value;
    }
  }, {
    key: "removeItem",
    value: function removeItem(key) {
      delete this.cache[stringifyKey(key)];
    }
  }, {
    key: "getItem",
    value: function getItem(key) {
      return this.cache[stringifyKey(key)];
    }
  }, {
    key: "clear",
    value: function clear() {
      this.cache = {};
    }
  }, {
    key: "length",
    value: function length() {
      return Object.keys(this.cache).length;
    }
    /**
     *
     * @param {number} n
     * @return {string}
     */

  }, {
    key: "key",
    value: function key(n) {
      return Object.keys(this.cache)[n];
    }
  }]);

  return InstanceStorage;
}();
/**
 * Local storage flag
 * @type {string}
 */


var LOCAL_STORAGE = 'localStorage';
/**
 * Session storage flag
 * @type {string}
 */

exports.LOCAL_STORAGE = LOCAL_STORAGE;
var SESSION_STORAGE = 'sessionStorage';
/**
 * Instance storage flag
 * @type {string}
 */

exports.SESSION_STORAGE = SESSION_STORAGE;
var INSTANCE_STORAGE = 'instanceStorage';
/**
 * This is a simplistic key value cache.
 * It allows you to use localStorage, sessionStorage, or a simple instanceStorage.
 *
 * An interesting characteristic of the instanceStore is you can store objects
 * instead of just strings. This can boost performance since you don't have to
 * stringify things.
 */

exports.INSTANCE_STORAGE = INSTANCE_STORAGE;

var SimpleCache =
/*#__PURE__*/
function () {
  /**
   * Initializes a new simple cache.
   * @param {string} [storageType="instanceStorage"] - The type of storage to use behind the cache. Can be one of (LOCAL_STORAGE|SESSION_STORAGE|INSTANCE_STORAGE)
   */
  function SimpleCache() {
    var _this = this;

    var storageType = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : INSTANCE_STORAGE;

    _classCallCheck(this, SimpleCache);

    this.storageType = storageType;

    var fallback = function fallback() {
      console.warn("".concat(_this.storageType, " is not available. Falling back to ").concat(INSTANCE_STORAGE));
      _this.cache = new InstanceStorage();
      _this.storageType = INSTANCE_STORAGE;
    }; // bind to storage


    if (storageType === INSTANCE_STORAGE) {
      // use instance storage
      this.cache = new InstanceStorage();
    } else if (storageType === SESSION_STORAGE) {
      // use session storage
      if (storageAvailable('sessionStorage')) {
        this.cache = sessionStorage;
      } else {
        fallback();
      }
    } else {
      // use local storage
      if (storageAvailable('localStorage')) {
        this.cache = localStorage;
      } else {
        fallback();
      }
    }
  }
  /**
   * Returns the type of storage being used internally
   * @return {string}
   */


  _createClass(SimpleCache, [{
    key: "type",
    value: function type() {
      return this.storageType;
    }
    /**
     * Sets the value of the item
     * @param {string} key
     * @param {string} value
     */

  }, {
    key: "set",
    value: function set(key, value) {
      // TRICKY: the InstanceStore supports any value, but Web Storage require strings.
      if (this.storageType !== INSTANCE_STORAGE && typeof value !== 'string') {
        throw new Error("Failed to set cache key \"".concat(key, "\". Web Storage values must be strings. Type \"").concat(_typeof(value), "\" is not allowed."));
      }

      try {
        this.cache.setItem(key, value);
      } catch (e) {
        if ((e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') && // acknowledge QuotaExceededError only if there's something already stored
        this.cache.length !== 0) {
          console.error("Failed to set cache key \"".concat(key, "\". Storage quoted exceeded."));
        } else {
          throw e;
        }
      }
    }
    /**
     * Removes the item
     * @param key
     */

  }, {
    key: "remove",
    value: function remove(key) {
      this.cache.removeItem(key);
    }
    /**
     * Retrieves the item
     * @param key
     */

  }, {
    key: "get",
    value: function get(key) {
      return this.cache.getItem(key);
    }
    /**
     * Clears all data
     */

  }, {
    key: "clear",
    value: function clear() {
      this.cache.clear();
    }
    /**
     * Returns the number of key/values pairs currently present in the cache
     */

  }, {
    key: "length",
    value: function length() {
      return this.cache.length();
    }
    /**
     * Returns the name of the nth key in the cache
     * @param {number} n
     */

  }, {
    key: "key",
    value: function key(n) {
      return this.cache.key(n);
    }
  }]);

  return SimpleCache;
}();

exports["default"] = SimpleCache;