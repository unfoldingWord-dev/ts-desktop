import React, {useEffect, useState} from 'react';
import {List} from 'react-content-loader';
import remark from 'remark';
import remark2react from 'remark-react';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core';
import RCLinkContainer from './RCLinkContainer';

const useStyles = makeStyles(theme => ({
    ltr: {
        direction: 'ltr'
    },
    rtl: {
        direction: 'rtl'
    }
}));

/**
 * Renders a single tA article
 * @param props
 * @returns
 * @constructor
 */
export default function Article(props) {
    const {title, subTitle, body, manualId, articleId, direction, onClickLink} = props;
    const [component, setComponent] = useState(<List speed={2}/>);
    const classes = useStyles();

    useEffect(() => {

        function handleClickLink(link) {
            onClickLink({
                ...link,
                manualId: link.manualId ? link.manualId : manualId
            });
        }

        const options = {
            remarkReactComponents: {
                a: (props) => (
                    <RCLinkContainer
                        {...props}
                        onClick={handleClickLink}
                    />
                ),
                div: (props) => <div {...props} style={{width: '100%'}}/>,
                img: props => {
                    // TODO: render local images
                    console.log('rendering image', props);
                    return <img {...props} />;
                }
            }
        };
        // TODO: set rendering options
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
    }, [body]);

    return (
        <div id={articleId} className={direction === 'rtl' ? classes.rtl : classes.ltr}>
            <h1>{title}</h1>
            <h2>{subTitle}</h2>
            {component}
        </div>
    );
}

Article.propTypes = {
    manualId: PropTypes.string.isRequired,
    articleId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subTitle: PropTypes.string,
    body: PropTypes.string,
    direction: PropTypes.string.isRequired,
    onClickLink: PropTypes.func.isRequired
};

Article.defaultProps = {
    direction: 'ltr'
};
