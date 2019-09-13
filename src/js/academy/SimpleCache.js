/**
 * Checks if the browser storage type is available
 * @param {string} type - the type of storage (localStorage|sessionStorage)
 * @return {boolean}
 */
function storageAvailable(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return e instanceof DOMException && (
                // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
    }
}

/**
 * Converts the key to a string
 * @param {*} key
 * @return {string}
 */
function stringifyKey(key) {
    return `${key}`;
}

/**
 * A light cache object
 */
class InstanceStorage {
    constructor() {
        this.cache = {};
    }

    setItem(key, value) {
        this.cache[stringifyKey(key)] = value;
    }

    removeItem(key) {
        delete this.cache[stringifyKey(key)];
    }

    getItem(key) {
        return this.cache[stringifyKey(key)];
    }

    clear() {
        this.cache = {};
    }

    length() {
        return Object.keys(this.cache).length;
    }

    /**
     *
     * @param {number} n
     * @return {string}
     */
    key(n) {
        return Object.keys(this.cache)[n];
    }
}

/**
 * Local storage flag
 * @type {string}
 */
export const LOCAL_STORAGE = 'localStorage';

/**
 * Session storage flag
 * @type {string}
 */
export const SESSION_STORAGE = 'sessionStorage';

/**
 * Instance storage flag
 * @type {string}
 */
export const INSTANCE_STORAGE = 'instanceStorage';

/**
 * This is a simplistic key value cache.
 * It allows you to use localStorage, sessionStorage, or a simple instanceStorage.
 *
 * An interesting characteristic of the instanceStore is you can store objects
 * instead of just strings. This can boost performance since you don't have to
 * stringify things.
 */
export default class SimpleCache {
    /**
     * Initializes a new simple cache.
     * @param {string} [storageType="instanceStorage"] - The type of storage to use behind the cache. Can be one of (LOCAL_STORAGE|SESSION_STORAGE|INSTANCE_STORAGE)
     */
    constructor(storageType = INSTANCE_STORAGE) {
        this.storageType = storageType;

        const fallback = () => {
            console.warn(`${this.storageType} is not available. Falling back to ${INSTANCE_STORAGE}`);
            this.cache = new InstanceStorage();
            this.storageType = INSTANCE_STORAGE;
        };

        // bind to storage
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
    type() {
        return this.storageType;
    }

    /**
     * Sets the value of the item
     * @param {string} key
     * @param {string} value
     */
    set(key, value) {
        // TRICKY: the InstanceStore supports any value, but Web Storage require strings.
        if (this.storageType !== INSTANCE_STORAGE && typeof value !== 'string') {
            throw new Error(`Failed to set cache key "${key}". Web Storage values must be strings. Type "${typeof value}" is not allowed.`);
        }

        try {
            this.cache.setItem(key, value);
        } catch (e) {
            if ((e.name === 'QuotaExceededError' ||
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
                // acknowledge QuotaExceededError only if there's something already stored
                this.cache.length !== 0) {
                console.error(`Failed to set cache key "${key}". Storage quoted exceeded.`);
            } else {
                throw e;
            }
        }
    }

    /**
     * Removes the item
     * @param key
     */
    remove(key) {
        this.cache.removeItem(key);
    }

    /**
     * Retrieves the item
     * @param key
     */
    get(key) {
        return this.cache.getItem(key);
    }

    /**
     * Clears all data
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Returns the number of key/values pairs currently present in the cache
     */
    length() {
        return this.cache.length();
    }

    /**
     * Returns the name of the nth key in the cache
     * @param {number} n
     */
    key(n) {
        return this.cache.key(n);
    }
}
