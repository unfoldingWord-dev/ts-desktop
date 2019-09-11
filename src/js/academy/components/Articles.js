import React from 'react';
import ContentLoader, { List, BulletList } from 'react-content-loader'
import {makeStyles} from '@material-ui/core/styles';

/**
 * Renders a single tA article
 * @param props
 * @returns
 * @constructor
 */
function Article(props) {
    return (
        <div>
            This is an article
        </div>
    );
}

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        padding: 30,
        backgroundColor: '#fff'
    }
}));

/**
 * Renders a list of tA articles.
 * While the list is empty a placeholder will be displayed.
 * @param articles
 * @returns
 * @constructor
 */
export default function ArticleList({articles}) {
    const classes = useStyles();
    if(articles.length > 0) {
        return (
            <div id="articles" className={classes.root}>
                {articles.map((a, i) => (
                    <Article {...a} key={i}/>
                ))}
            </div>
        );
    } else {
        // placeholder while articles are loading
        return (
            <div id="articles" className={classes.root}>
                <List speed={2}/>
                <BulletList speed={2}/>
            </div>

        );
    }

}
