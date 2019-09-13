import fs from 'fs';
import path from 'path';
import axios from 'axios';

export async function downloadFile(url, dest) {
    // const url = 'https://unsplash.com/photos/AaEQmoufHLk/download?force=true'
    // const path = Path.resolve(__dirname, 'images', 'code.jpg')
    const writer = fs.createWriteStream(dest);

    console.log('downloading', url);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}
