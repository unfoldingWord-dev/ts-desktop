import mkdirp from 'mkdirp';
import fs from 'fs';
import rimraf from 'rimraf';
import path from 'path';
import {downloadtACatalog, downloadtATranslation} from "../src/js/academy/util";
import FileReader from 'filereader';

global.FileReader = FileReader;

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

    // TODO: zip everything up
}
