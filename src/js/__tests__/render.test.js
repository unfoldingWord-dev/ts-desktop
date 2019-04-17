const Renderer = require('../render').Renderer;

const render = new Renderer();

const normalize = obj => {
  return JSON.parse(JSON.stringify(obj));
};

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

describe('render rc links', () => {
    it('renders a book link', () => {
        const input = `[[rc://en/ulb/book/gen/01/02]]`;
        const expected = ``;
        expect(render.renderResourceContainerLinks(input)).toEqual(expected);
    });

    it('renders a titled book link', () => {

    });

    it('renders a tA link', () => {
        const input = `[[rc://en/ta/man/translate/translate-names]]`;
        const expected = `<a href='translate-names' class='style-scope link talink' id='translate-names'>translate-names</a>`;
        expect(render.renderResourceContainerLinks(input)).toEqual(expected);
    });

    it('renders a titled tA link', () => {

    });

    it('renders a word link', () => {
        const input = `[[rc://en/tw/dict/bible/kt/sin]]`;
        const expected = `<a href="kt/sin" class="style-scope link wordlink" id="kt/sin">sin</a>`;
        expect(render.renderResourceContainerLinks(input)).toEqual(expected);
    });

    it('renders a titled word link', () => {
        const input = `[Sin](rc://en/tw/dict/bible/kt/sin]`;
        const expected = `<a href="kt/sin" class="style-scope link wordlink" id="kt/sin">Sin</a>`;
        expect(render.renderResourceContainerLinks(input)).toEqual(expected);
    });
});
