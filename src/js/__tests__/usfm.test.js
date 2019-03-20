var path = require('path');
var {generateProjectUSFM, fileComparator} = require('../usfm');

describe('Project usfm generator', () => {
    it('produces usfm', () => {
        var usfm = generateProjectUSFM(path.join(__dirname, './usfmProject'));
        expect(usfm).toEqual('\\id phl Philemon\n' +
            '\\ide usfm\n' +
            '\\h Philemon\n' +
            '\\toc1 Philemon\n' +
            '\\toc2 Philemon\n' +
            '\\toc3 phl\n' +
            '\\mt Philemon\n' +
            '\\s1 Chapter 1\n' +
            '\\c 1 \n' +
            '\\v 1 Paul, a prisoner of Christ Jesus, and the brother Timothy to Philemon, our dear friend and fellow worker, \n' +
            '\\v 2 and to Apphia our sister, and to Archippus our fellow soldier, and to the church that meets in your home. \n' +
            '\\v 3 May grace be to you and peace from God our Father and the Lord Jesus Christ.\n' +
            '\\s1 Chapter 10\n' +
            '\\c 10 \n' +
            '\\v 1 This is another verse \n' +
            '\\v 2 And another.');
    });
});


describe('file sorter', () => {
    it('checks compare conditions', () => {
        expect(fileComparator('front','back')).toEqual(-1);
        expect(fileComparator('back','front')).toEqual(1);
        expect(fileComparator('front','01')).toEqual(-1);
        expect(fileComparator('back','01')).toEqual(1);
        expect(fileComparator('01','front')).toEqual(1);
        expect(fileComparator('01','back')).toEqual(-1);
        expect(fileComparator('01','02')).toEqual(-1);
        expect(fileComparator('02','01')).toEqual(1);
        expect(fileComparator('10','01')).toEqual(1);
        expect(fileComparator('01','10')).toEqual(-1);
        expect(fileComparator('01','01')).toEqual(0);
    });

    it('sorts an array', () => {
        expect(['01', 'front'].sort(fileComparator)).toEqual(['front', '01']);
        expect(['01', 'back'].sort(fileComparator)).toEqual(['01', 'back']);
        expect(['back', 'front'].sort(fileComparator)).toEqual(['front', 'back']);
        expect(['front', '01'].sort(fileComparator)).toEqual(['front', '01']);
        expect(['01', 'title'].sort(fileComparator)).toEqual(['title', '01']);
    });
});
