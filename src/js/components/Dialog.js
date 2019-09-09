import React from 'react';
const e = React.createElement;
const makeStyles = require('@material-ui/core/styles').makeStyles;
const Modal = require('@material-ui/core/Modal').default;
const Backdrop = require('@material-ui/core/Backdrop').default;
const Fade = require('@material-ui/core/Fade').default;

const titleBarPadding = 40;

const useStyles = makeStyles(theme => ({
    modal: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        top: `${titleBarPadding}!important`
    },
    paper: {
        backgroundColor: theme.palette.background.paper,
        border: '2px solid #000',
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3),
    },
    backdrop: {
        top: titleBarPadding
    }
}));

function TransitionsModal(props) {
    const classes = useStyles();

    return e(
        Modal,
        {
            'aria-labelledby':"transition-modal-title",
            'aria-describedby':"transition-modal-description",
            className:classes.modal,
            open:props.open,
            onClose:props.onClose,
            closeAfterTransition:true,
            disableEscapeKeyDown: true,
            disableBackdropClick: true,
            BackdropComponent:Backdrop,
            BackdropProps:{
                timeout: 500,
                classes: {
                    root: classes.backdrop
                },
            }
        },
        e(
            Fade,
            { in: props.open},
            e(
                'div',
                {className: classes.paper},
                props.children
            )
        )
    );
}

module.exports = TransitionsModal;
