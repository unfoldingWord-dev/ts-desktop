import mkdirp from 'mkdirp';
import fs from 'fs';
import path from 'path';
import {downloadtACatalog, downloadtATranslation} from "../src/js/academy/util";

export default async function(dest) {
    await mkdirp(dest);

    // download catalog
    const catalog = await downloadtACatalog(dest);
    fs.writeFileSync(path.join(dest, 'catalog.json'), JSON.stringify(catalog));

    // download articles
    for(let i = 0; i < catalog.length; i ++) {
        await downloadtATranslation(catalog[i], dest);
    }

    // TODO: zip everything up
}
