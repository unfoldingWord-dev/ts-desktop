const DataManager = require('../database').DataManager;
const Door43Client = require('door43-client');
const path = require('path');

const libraryPath = path.join(__dirname, '../../index/index.sqlite');
const resourceDir = path.join(__dirname, 'out');
const db = new Door43Client(libraryPath, resourceDir);

const apiUrl = '';
const sourceDir = path.join(__dirname, '../../index/resource_containers');
const dataManager = new DataManager(db, sourceDir, apiUrl, sourceDir);

describe('DataManager', () => {
    it('Returns sources for Matt', () => {
        return dataManager.getSourcesByProject('mat').then(sources => {
            // TRICKY: This list may change as the default resources are updated in src/index
            expect(sources.map(s => s.unique_id)).toEqual([
                'ar_mat_avd',
                'id_mat_ayt',
                'pt-br_mat_blv',
                'zh_mat_cuv',
                'sr-Latn_mat_dkl',
                'fr_mat_f10',
                'hu_mat_kar',
                'ru_mat_rsb',
                'sr-Latn_mat_stf',
                'gu_mat_udb',
                'en_mat_udb',
                'vi_mat_udb',
                'ne_mat_udb',
                'hi_mat_udb',
                'or_mat_udb',
                'gu_mat_ulb',
                'en_mat_ulb',
                'as_mat_ulb',
                'pt-br_mat_ulb',
                'id_mat_ulb',
                'ru_mat_ulb',
                'ur-Deva_mat_ulb',
                'ne_mat_ulb',
                'tl_mat_ulb',
                'pa_mat_ulb',
                'te_mat_ulb',
                'ta_mat_ulb',
                'fr_mat_ulb',
                'plt_mat_ulb',
                'ceb_mat_ulb',
                'hr_mat_ulb',
                'bn_mat_ulb',
                'hi_mat_ulb',
                'ha_mat_ulb',
                'ml_mat_ulb',
                'ilo_mat_ulb',
                'sw_mat_ulb',
                'kn_mat_ulb',
                'my_mat_ulb',
                'or_mat_ulb',
                'en_mat_ult',
                'en_mat_ust'
            ]);
        });
    });
});
