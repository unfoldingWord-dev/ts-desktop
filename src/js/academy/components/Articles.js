import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {List, BulletList} from 'react-content-loader';
import {makeStyles} from '@material-ui/core/styles';
import remark from 'remark';
import remark2react from 'remark-react';

/**
 * Renders a single tA article
 * @param props
 * @returns
 * @constructor
 */
function Article(props) {
    const {title, subTitle, body, id} = props;
    const [component, setComponent] = useState(<List speed={2}/>);

    useEffect(() => {
        const options = {};
        setTimeout(() => {
            remark().
                use(remark2react, options).
                process(body, (error, file) => {
                    if (error) {
                        // TODO: render error
                        console.error(error);
                    } else {
                        setComponent(file.contents);
                    }
                });
        }, 500);

        // setComponent(renderedComponent);
    }, [body]);

    // TODO: render rtl languages correctly.
    return (
        <div id={id}>
            <h1>{title}</h1>
            <h2>{subTitle}</h2>
            {component}
        </div>
    );
}

Article.propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subTitle: PropTypes.string,
    body: PropTypes.string
};

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
 * @returns
 * @constructor
 */
export default function ArticleList({articles}) {
    const classes = useStyles();
    if (articles.length > 0) {
        return (
            <div id="articles" className={classes.root}>
                <div className={classes.frame}>
                    {articles.map((a, i) => (
                        <Article {...a} key={i}/>
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
