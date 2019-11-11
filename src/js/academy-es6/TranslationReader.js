import path from 'path';
import yaml from 'js-yaml';
import fs from 'fs';

/**
 * Returns the contents of the file if it exists, otherwise null
 * @param filePath
 * @returns {string|null}
 */
function safeRead(filePath) {
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath).toString();
    } else {
        return null;
    }
}

/**
 * Returns an array of articles based on the section in a table of contents
 * @param section
 * @param dir
 * @param [handler] - optional callback to do extra processing for each article
 * @returns {[]}
 */
function readTOCSection(section, dir, handler) {
    let sectionArticles = [];
    if (section.link) {
        const articleDir = path.join(dir, section.link);
        const articleTitle = safeRead(path.join(articleDir, 'title.md'));
        const articleSubTitle = safeRead(path.join(articleDir, 'sub-title.md'));
        const articleBody = safeRead(path.join(articleDir, '01.md'));

        if(!articleBody) {
            throw new Error(`Could not find the article '${section.link}' while reading the table of contents in ${dir}`);
        }

        let article = {
            path: articleDir,
            manualId: path.basename(dir),
            articleId: section.link,
            title: articleTitle,
            subTitle: articleSubTitle,
            body: articleBody
        };

        if (handler) {
            article = handler(article);
        }

        sectionArticles.push(article);
    }

    // recurse
    if (section.sections) {
        section.sections.forEach(s => {
            sectionArticles.push.apply(
                sectionArticles, readTOCSection(s, dir, handler));
        });
    }

    return sectionArticles;
}

export default class TranslationReader {
    constructor(dir) {
        this.dir = dir;
        this.listArticles = this.listArticles.bind(this);
        this.readManifest = this.readManifest.bind(this);
    }

    /**
     * @throws {Error} if the translation is corrupt
     * @returns {*}
     */
    readManifest() {
        const manifestPath = path.join(this.dir, 'manifest.yaml');
        return yaml.safeLoad(fs.readFileSync(manifestPath, 'utf8'));
    }

    /**
     * Returns a list of article paths
     * @param [handler] - optional callback to do extra processing for each article.
     * @throws {Error} if the translation is corrupt.
     * @returns {[]}
     */
    listArticles(handler=null) {
        const manifest = this.readManifest();
        let articles = [];
        manifest.projects.forEach(p => {
            // load articles in each project
            const projectPath = path.join(this.dir, p.path);
            const tocPath = path.join(projectPath, 'toc.yaml');
            if(fs.existsSync(tocPath)) {
                const toc = yaml.safeLoad(fs.readFileSync(tocPath, 'utf8'));
                if (toc) {
                    toc.sections.forEach(s => {
                        articles.push.apply(articles,
                            readTOCSection(s, projectPath, handler));
                    });
                    return;
                }
            }

            // fallback to directory listing
            console.warn(`Table of contents not found in ${projectPath}`);
            const files = fs.readdirSync(projectPath);
            files.forEach(f => {
                const dir = path.join(projectPath, f);
                const isDir = fs.existsSync(dir) && fs.lstatSync(dir).isDirectory();
                if (isDir) {
                    articles.push.apply(articles,
                        readTOCSection({
                            link: f
                        }, projectPath, handler));
                }
            });
        });

        return articles;
    }
}
