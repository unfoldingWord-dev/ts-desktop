const Renderer = require('../render').Renderer;

const render = new Renderer();

const normalize = obj => {
  return JSON.parse(JSON.stringify(obj));
};

describe('Resource Container Link Rendering', () => {

    describe('match html link', () => {
        it('matches a plain link', () => {
            const input = '<a href="my/link">Some text</a>';
            const output = render.matchHtmlLink(input, /([a-z]+)\/([a-z]+)/);
            const expected = {
                "matches": [
                    "<a href=\"my/link\">Some text</a>",
                    "my",
                    "link"
                ],
                "title": "Some text"
            };
            expect(normalize(output)).toEqual(normalize(expected));
        });

        it('matches a link with classes and other properties', () => {
            const input = '<a class="simple-class" href="my/link" id="hello-world">Some text</a>';
            const output = render.matchHtmlLink(input, /([a-z]+)\/([a-z]+)/);
            const expected = {
                "matches": [
                    `<a class="simple-class" href="my/link" id="hello-world">Some text</a>`,
                    "my",
                    "link"
                ],
                "title": "Some text"
            };
            expect(normalize(output)).toEqual(normalize(expected));
        });
    });

    describe('match markdown link', () => {
        it('matches regular link', () => {
            const input = `[[01/02]]`;
            const output = render.matchMarkdownLink(input, /(\d\d)\/(\d\d)/);
            const expected = {matches: ['[[01/02]]', '01', '02'], title: null};
            expect(normalize(output)).toEqual(normalize(expected));
        }) ;

        it('matches titled link', () => {
            const input = `[Hello](01/02)`;
            const output = render.matchMarkdownLink(input, /(\d\d)\/(\d\d)/);
            const expected = {matches: ['[Hello](01/02)', '01', '02'], title: 'Hello'};
            expect(normalize(output)).toEqual(normalize(expected));
        });
    });

    describe('render relative markdown links', () => {
        it('renders a titled book link', () => {
            const input = `[Philippians 1:21](../../php/01/21.md)`;
            const expected = `<a href="#" data-link='ult/php/01/21' class='style-scope rc-link link ts-resource-display biblelink' id='01:21'>Philippians 1:21</a>`;
            expect(render.renderRelativeLinks(input)).toEqual(expected);
        });

        it('renders a titled single nested book link', () => {
            const input = `[Philippians 1:21](../php/01/21.md)`;
            const expected = `<a href="#" data-link='ult/php/01/21' class='style-scope rc-link link ts-resource-display biblelink' id='01:21'>Philippians 1:21</a>`;
            expect(render.renderRelativeLinks(input)).toEqual(expected);
        });
    });

    describe('render rc markdown links', () => {
        it('renders a book link', () => {
            const input = `[[rc://en/ulb/book/gen/01/02]]`;
            const expected = `<a href="#" data-link='ulb/gen/01/02' class='style-scope rc-link link ts-resource-display biblelink' id='01:02'>gen 1:2</a>`;
            expect(render.renderResourceContainerLinks(input)).toEqual(expected);
        });

        it('renders a titled book link', () => {
            const input = `[Genesis 1:2](rc://en/ulb/book/gen/01/02)`;
            const expected = `<a href="#" data-link='ulb/gen/01/02' class='style-scope rc-link link ts-resource-display biblelink' id='01:02'>Genesis 1:2</a>`;
            expect(render.renderResourceContainerLinks(input)).toEqual(expected);
        });

        it('renders a tA link', () => {
            const input = `[[rc://en/ta/man/translate/translate-names]]`;
            const expected = `<a href="#" data-link='translate/translate-names' class='style-scope rc-link link ts-resource-display talink' id='translate-names'>translate-names</a>`;
            expect(render.renderResourceContainerLinks(input)).toEqual(expected);
        });

        it('renders a titled tA link', () => {
            const input = `[Translate Names](rc://en/ta/man/translate/translate-names)`;
            const expected = `<a href="#" data-link='translate/translate-names' class='style-scope rc-link link ts-resource-display talink' id='translate-names'>Translate Names</a>`;
            expect(render.renderResourceContainerLinks(input)).toEqual(expected);
        });

        it('renders a word link', () => {
            const input = `[[rc://en/tw/dict/bible/kt/sin]]`;
            const expected = `<a href="#" data-link="kt/sin" class="style-scope rc-link link ts-resource-display wordlink" id="kt/sin">sin</a>`;
            expect(render.renderResourceContainerLinks(input)).toEqual(expected);
        });

        it('renders a titled word link', () => {
            const input = `[Sin](rc://en/tw/dict/bible/kt/sin)`;
            const expected = `<a href="#" data-link="kt/sin" class="style-scope rc-link link ts-resource-display wordlink" id="kt/sin">Sin</a>`;
            expect(render.renderResourceContainerLinks(input)).toEqual(expected);
        });
    });

    describe('render rc html links', () => {
        it('renders a titled book link', () => {
            const input = `<a href="rc://en/ulb/book/gen/01/02">Genesis 1:2</a>`;
            const expected = `<a href="#" data-link='ulb/gen/01/02' class='style-scope rc-link link ts-resource-display biblelink' id='01:02'>Genesis 1:2</a>`;
            expect(render.renderResourceContainerLinks(input)).toEqual(expected);
        });

        it('renders a titled tA link', () => {
            const input = `<a href="rc://en/ta/man/translate/translate-names">Translate Names</a>`;
            const expected = `<a href="#" data-link='translate/translate-names' class='style-scope rc-link link ts-resource-display talink' id='translate-names'>Translate Names</a>`;
            expect(render.renderResourceContainerLinks(input)).toEqual(expected);
        });

        it('renders a titled word link', () => {
            const input = `<a href="rc://en/tw/dict/bible/kt/sin">Sin</a>`;
            const expected = `<a href="#" data-link="kt/sin" class="style-scope rc-link link ts-resource-display wordlink" id="kt/sin">Sin</a>`;
            expect(render.renderResourceContainerLinks(input)).toEqual(expected);
        });

        it('renders a titled word link with an empty title', () => {
            const input = `<a href="rc://en/tw/dict/bible/kt/sin"></a>`;
            const expected = `<a href="#" data-link="kt/sin" class="style-scope rc-link link ts-resource-display wordlink" id="kt/sin">sin</a>`;
            expect(render.renderResourceContainerLinks(input)).toEqual(expected);
        });
    });
});
