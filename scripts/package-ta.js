import mkdirp from 'mkdirp';
import fs from 'fs';
import rimraf from 'rimraf';
import archiver from 'archiver';
import path from 'path';
import {cacheCatalog, downloadtACatalog, downloadtATranslation} from "../src/js/academy/util";
import FileReader from 'filereader';
import AdmZip from 'adm-zip';

global.FileReader = FileReader;

/**
 * Bundles up the tA material for distribution.
 * @param dest
 * @returns {Promise<void>}
 */
export async function pack(dest) {
    rimraf.sync(dest);
    mkdirp.sync(dest);

    // download catalog
    const catalog = await downloadtACatalog(dest);
    fs.writeFileSync(path.join(dest, 'catalog.json'), JSON.stringify(catalog));

    // download articles
    for(let i = 0; i < catalog.length; i ++) {
        console.log(`Downloading ${catalog[i].language}`);
        await downloadtATranslation(catalog[i], dest);
    }

    // zip everything up
    console.log('zipping everything');
    const academyDir = path.join(dest, 'translationAcademy');
    const destZip = `${academyDir}.zip`;
    await new Promise((resolve, reject) => {
        var writer = fs.createWriteStream(destZip);
        writer.on('finish', resolve);
        writer.on('error', reject);
        const zip = archiver.create('zip');
        zip.pipe(writer);
        zip.directory(academyDir, 'translationAcademy/');
        zip.finalize();
    });

    rimraf.sync(academyDir);
}

/**
 * Unpacks the tA material and installs it.
 * @param src {string} the path where the packaged tA material can be found.
 * @param dest {string} the path where the tA material will be installed.
 * @returns {Promise<void>}
 */
export async function unpack(src, dest) {
    const catalogPath = path.join(src, 'catalog.json');
    const catalog = JSON.parse(fs.readFileSync(catalogPath).toString());
    cacheCatalog(catalog);

    const articlesZip = path.join(src, 'translationAcademy.zip');
    const zip = new AdmZip(articlesZip);
    zip.extractAllTo(dest, true);
}
