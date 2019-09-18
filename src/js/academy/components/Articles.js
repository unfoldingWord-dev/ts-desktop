import React from 'react';
import PropTypes from 'prop-types';
import {List, BulletList} from 'react-content-loader';
import {makeStyles} from '@material-ui/core/styles';
import Article from './Article';

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        overflowY: 'scroll',
        backgroundColor: '#fff',
        // TRICKY: give room for the title bar
        maxHeight: 'calc(100vh - 40px)'
    },
    frame: {
        padding: 30
    }
}));

/**
 * Renders a list of tA articles.
 * While the list is empty a placeholder will be displayed.
 * @param articles
 * @param onClickLink
 * @returns
 * @constructor
 */
export default function ArticleList({articles, onClickLink}) {
    const classes = useStyles();

    if (articles.length > 0) {
        return (
            <div id="articles" className={classes.root}>
                <div className={classes.frame}>
                    {articles.map((a, i) => (
                        <Article {...a} key={i} onClickLink={onClickLink}/>
                    ))}
                </div>
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

ArticleList.propTypes = {
    articles: PropTypes.array.isRequired,
    onClickLink: PropTypes.func.isRequired
};
