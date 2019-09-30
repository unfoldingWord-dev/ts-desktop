import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@material-ui/core/Tooltip';
import {makeStyles} from '@material-ui/core';
import {
    Chip,
    Typography
} from '@material-ui/core';
import {
    Subject,
    Link,
    Email
} from '@material-ui/icons';

const useStyles = makeStyles(theme => ({
    chip: {
        height: 'unset',
        maxWidth: '95%'
    },
    label: {
        maxWidth: '81%'
    }
}));

export default function RCLinkContainer(props) {
    const {href, children, onClick} = props;
    const classes = useStyles();
    const child = children ? children[0] : null;
    const [link, setLink] = useState({title: href ? href : child});

    function handleOpen() {
        if(link.clickable) {
            onClick(link);
        }
    }

    useEffect(() => {

        function parseHref(href, title) {
            let manual, article, linkTitle = title;
            const regexpDeepLinks = /\.\.\/\.\.\/([\w-_]+)\/([\w-_]+)\/(.+)/;
            const regexpLocalLinks = /\.\.\/([\w-_]+)\/(.+)/;
            const regexpHREFLinks = /https?:.*/;
            const regexpEmailLinks = /mailto:(.*)/;

            if (regexpDeepLinks.test(href)) {
                [,manual, article] = regexpDeepLinks.exec(href);
            } else if (regexpLocalLinks.test(href)) {
                [,article] = regexpLocalLinks.exec(href);
            } else if (regexpHREFLinks.test(href)) {
                return {
                    icon: 'link',
                    href,
                    title: title ? title : href,
                    clickable: true
                };
            } else if(regexpEmailLinks.test(href)) {
                const [,email] = regexpEmailLinks.exec(href);
                return {
                    icon: 'email',
                    href,
                    title: title ? title : email,
                    clickable: false
                }
            } else {
                // unsupported
                return null;
            }

            if (!linkTitle) {
                // TODO: load the title from the file system
                console.warn('missing title for', props);
                linkTitle = href;
            }

            return {
                icon: 'subject',
                manualId: manual,
                articleId: article,
                title: linkTitle,
                clickable: true
            };
        }

        const parsedLink = parseHref(href, children ? children[0] : null);

        if (parsedLink) {
            setLink(parsedLink);
        } else {
            console.warn('unable to parse the link', props);
        }
    }, [href]);

    function getIcon(link) {
        switch(link.icon) {
            case 'email':
                return <Email/>;
            case 'subject':
                return <Subject/>;
            case 'link':
                return <Link/>;
            default:
                return null;
        }
    }

    return (
        <Tooltip title={link.title}>
            <Chip
                label={
                    <Typography noWrap component='span'>
                        {link.title}
                    </Typography>
                }
                component='span'
                className={classes.chip}
                classes={{label: classes.label}}
                onClick={handleOpen}
                variant='outlined'
                icon={getIcon(link)}
                color='primary'
                clickable={link.clickable}
            />
        </Tooltip>
    );
}

RCLinkContainer.propTypes = {
    href: PropTypes.string.isRequired,
    children: PropTypes.array
};
