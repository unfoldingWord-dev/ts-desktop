/**
 * Created by delmarhager on 5/25/15.
 */
var assert = require('assert');
var render = require('../../app/js/renderer');
var sourceText = require('./data/source')
describe('@Renderer', function(){
    describe('@RemoveWhiteSpace ', function(){
        it('should remove extras white space', function(){
            var text = 'this  is  a test',
                textExpected = 'this is a test';

            assert.equal(render.renderWhiteSpace(text), textExpected);
        })
    })

    describe('@RemoveLineBreaks ', function(){
        it('should strip out new lines and replaces them with a single space', function(){
            var text = 'this is \na test',
                textExpected = 'this is a test';

            assert.equal(render.renderLineBreaks(text), textExpected);
        })
    })


    describe('@trimWhiteSpace ', function(){
        it('should remove white space from beginning and end of text', function(){
            var text = '  this is a test  ',
                textExpected = 'this is a test';

            assert.equal(render.trimWhiteSpace(text), textExpected);
        })
    })


    describe('@renderVerse ', function(){
        it('should remove a verse heading', function(){
            var text = sourceText.chapters[0].frames[0].text,
                textExpected = '<para style=\"p\">\n\n  I, John, am writing to you about the one who existed before there was anything else! He is the one whom we apostles listened to as he taught us! We saw him! We ourselves looked at him and touched him! He is the one who taught us the message about eternal life.\n\n  (Because he came here to the earth and we have seen him, we proclaim to you clearly that the one whom we have seen is the one who has always lived. He was previously with his Father in heaven, but he came to live among us.)</para>\n';

            assert.equal(render.renderVerse(text), textExpected);
        })
    })

    describe('@renderParagraph ', function(){
        it('should remove the paragraph headings', function(){
            var text = sourceText.chapters[0].frames[0].text,
                textExpected = '<verse number=\"1\" style=\"v\" />I, John, am writing to you about the one who existed before there was anything else! He is the one whom we apostles listened to as he taught us! We saw him! We ourselves looked at him and touched him! He is the one who taught us the message about eternal life.\n\n  <verse number=\"2\" style=\"v\" />(Because he came here to the earth and we have seen him, we proclaim to you clearly that the one whom we have seen is the one who has always lived. He was previously with his Father in heaven, but he came to live among us.)';

            assert.equal(render.renderParagraph(text), textExpected);
        })
    })

    describe('@renderParagraphHTML ', function(){
        it('should remove the paragraph headings', function(){
            var text = sourceText.chapters[0].frames[0].text,
                textExpected = '<p><verse number=\"1\" style=\"v\" />I, John, am writing to you about the one who existed before there was anything else! He is the one whom we apostles listened to as he taught us! We saw him! We ourselves looked at him and touched him! He is the one who taught us the message about eternal life.\n\n  <verse number=\"2\" style=\"v\" />(Because he came here to the earth and we have seen him, we proclaim to you clearly that the one whom we have seen is the one who has always lived. He was previously with his Father in heaven, but he came to live among us.)</p>';

            assert.equal(render.renderParagraphHTML(text), textExpected);
        })
    })


    describe('@renderCleanFrameHTML ', function(){
        it('should remove all markup', function(){
            var text = sourceText.chapters[0].frames[0].text,
                textExpected = '<p><span class=\"verse\">1</span>I, John, am writing to you about the one who existed before there was anything else! He is the one whom we apostles listened to as he taught us! We saw him! We ourselves looked at him and touched him! He is the one who taught us the message about eternal life. <span class=\"verse\">2</span>(Because he came here to the earth and we have seen him, we proclaim to you clearly that the one whom we have seen is the one who has always lived. He was previously with his Father in heaven, but he came to live among us.)</p>';

            assert.equal(render.renderCleanFrameHTML(text), textExpected);
        })
    })


    describe('@renderVerseHTML ', function(){
        it('should format verse number with style', function(){
            var text = sourceText.chapters[0].frames[0].text,
                textExpected = '<para style=\"p\">\n\n  <span class="verse">1</span>I, John, am writing to you about the one who existed before there was anything else! He is the one whom we apostles listened to as he taught us! We saw him! We ourselves looked at him and touched him! He is the one who taught us the message about eternal life.\n\n  <span class="verse">2</span>(Because he came here to the earth and we have seen him, we proclaim to you clearly that the one whom we have seen is the one who has always lived. He was previously with his Father in heaven, but he came to live among us.)</para>\n';

            assert.equal(render.renderVerseHTML(text), textExpected);
        })
    })

})
