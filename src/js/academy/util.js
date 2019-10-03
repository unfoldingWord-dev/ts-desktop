import {useEffect, useState} from 'react';
import axios from "axios";
import path from "path";
import fs from "fs";
import TranslationReader from "./TranslationReader";
import semver from "semver";
import {compareAsc} from "date-fns";
import SimpleCache, {LOCAL_STORAGE} from "./SimpleCache";
import {ipcRenderer} from "electron";

const cache = new SimpleCache(LOCAL_STORAGE);
const TA_CACHE_KEY = 'ta-cache';
const catalogUrl = 'https://api.door43.org/v3/subjects/Translation_Academy.json';

/**
 *
 * @param translation
 * @param datapath {string} the directory where translationStudio data is stored.
 * @returns {*}
 */
function getTranslationPath(translation, dataPath) {
    return path.join(dataPath, `translationAcademy/${translation.language}/${translation.language}_ta`);
}

/**
 *
 * @param translation
 * @param datapath {string}
 * @returns {boolean | *}
 */
function isTranslationDownloaded(translation, datapath) {
    return fs.existsSync(getTranslationPath(translation, datapath));
}

/**
 *
 * @param translation
 * @param datapath {string}
 * @returns {boolean}
 */
function isTranslationOutdated(translation, datapath) {
    if (!translation.downloaded) {
        return false;
    }

    try {
        const reader = new TranslationReader(getTranslationPath(translation, datapath));
        const manifest = reader.readManifest();

        // check version
        const localVersion = semver.coerce(manifest.dublin_core.version);
        const remoteVersion = semver.coerce(translation.version);
        if (semver.gt(remoteVersion, localVersion)) {
            return true;
        }

        // check modified
        const localModified = manifest.dublin_core.modified;
        const remoteModified = translation.modified;
        return compareAsc(new Date(remoteModified),
            new Date(localModified)) > 0;
    } catch (error) {
        console.error('Invalid translation', translation, error);
        return true;
    }
}

/**
 * Downloads the tA catalog and returns the formatted entries.
 * @param datapath {string} the directory where translationStudio data is stored.
 * @returns {Promise<AxiosResponse<any>>}
 */
export async function downloadtACatalog(datapath) {
    const response = await axios.get(catalogUrl);
    const resources = response.data.map(d => {
        // filter down to the first valid resource container
        try {
            const format = d.resources[0].formats.filter(f => {
                return f.format.includes('application/zip;') &&
                    f.format.includes('type=man') &&
                    f.format.includes('conformsto=rc0.2');
            })[0];

            const translation = {
                title: d.title,
                direction: d.direction,
                language: d.language,
                url: format.url,
                size: format.size,
                // TRICKY: there seems to be a bug in the api because it does not have the correct modified date in the format.
                //  I think the api is using the real modified date from the commit, while the modified date in the manifest is manually updated and can become stale.
                modified: d.resources[0].modified, // format.modified,
                version: d.resources[0].version,
                downloaded: isTranslationDownloaded(d, datapath)
            };

            return {
                ...translation,
                update: isTranslationOutdated(translation, datapath)
            };

        } catch (error) {
            console.error('The resource is invalid', error, d);
            return {};
        }
    }).filter(r => !!r.url);

    return resources;
}

export function cacheCatalog(catalog) {
    if (catalog && catalog.length) {
        cache.set(TA_CACHE_KEY, JSON.stringify(catalog));
    }
}

/**
 * Adds support for reading and downloading the translationAcademy catalog.
 * @param dataPath {string} the directory where translationStudio data is stored.
 * @returns {{updateCatalog: *, catalog: *, loading: *}}
 */
export function useCatalog(dataPath) {
    const [loading, setLoading] = useState(true);
    const [catalog, setCatalog] = useState([]);
    const [ready, setReady] = useState(false);

    /**
     * Synchronizes the catalog with the filesystem
     */
    function syncCatalog() {
        _syncCatalog(catalog);
    }

    /**
     * Private sync method
     * @param c - the catalog to sync
     * @private
     */
    function _syncCatalog(c) {
        if (dataPath) {
            const newCatalog = c.map(r => {
                const record = {...r};
                record.downloaded = isTranslationDownloaded(record, dataPath);
                // TRICKY: check if outdated after checking if downloaded.
                record.update = isTranslationOutdated(record, dataPath);
                return record;
            });
            setCatalog(newCatalog);
        }
    }

    /**
     * Utility to download the latest catalog
     * @returns {Promise<void>}
     */
    async function updateCatalog() {
        setLoading(true);
        try {
            const resources = await downloadtACatalog(dataPath);
            setCatalog(resources);
        } finally {
            setLoading(false);
        }
    }

    // load cached catalog
    useEffect(() => {
        function getCachedCatalog() {
            let cachedCatalog = cache.get(TA_CACHE_KEY);
            if (cachedCatalog) {
                try {
                    return JSON.parse(cachedCatalog);
                } catch (error) {
                    console.error('Cached tA catalog was corrupt', error);
                }
            }
            return [];
        }

        // TRICKY: we need the dataPath to check if things are downloaded
        if (dataPath) {
            setLoading(true);
            const catalog = getCachedCatalog();

            _syncCatalog(catalog);

            if (!ready) {
                // the catalog is ready to go
                setReady(true);
            }
            setLoading(false);
        }
    }, [dataPath]);

    // keep catalog cached
    useEffect(() => {
        cacheCatalog(catalog);
    }, [catalog]);

    return {
        loading,
        catalog,
        ready,
        updateCatalog,
        syncCatalog
    };
}

/**
 * Subscribes to keyboard events
 * @returns {KeyboardEvent}
 */
export function useKeyboard() {
    const [keys, setKeys] = useState({});

    useEffect(() => {
        function handleKeyDown(event) {
            setKeys(event);
        }

        function handleBlur() {
            // TRICKY: clear keys when window does not have focus
            setKeys({});
        }

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyDown);
        ipcRenderer.on('blur', handleBlur);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyDown);
            ipcRenderer.removeListener('blur', handleBlur);
        };
    }, []);

    return keys;
}

/**
 * Allows the prop to override the state when changed
 * @param propValue
 * @returns {[unknown, (value: unknown) => void]}
 */
export function useControlledProp(propValue) {
    const [value, setValue] = useState(propValue);

    useEffect(() => {
        setValue(propValue);
    }, propValue);

    return [value, setValue];
}

/**
 * Keeps a record of the previous non-null value.
 * @param [initialValue]
 * @returns {[value, history, setValue]}
 */
export function useHistoricState(initialValue=undefined) {
    const [value, setValue] = useState(initialValue);
    const [history, setHistory] = useState();

    useEffect(() => {
        if(value !== null && value !== undefined) {
            setHistory(value);
        }
    }, [value]);

    return [
        value,
        history,
        setValue
    ];
}
