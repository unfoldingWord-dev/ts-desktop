import React from 'react';
import PropTypes from 'prop-types';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';

/**
 * Displays a simple confirmation dialog
 * @param props
 * @returns {*}
 * @constructor
 */
export default function ConfirmationDialog(props) {
    const {open, title, message, onOk, onCancel, ...other} = props;
    const closeButtonRef = React.useRef(null);

    function handleEntering() {
        if(closeButtonRef.current != null) {
            closeButtonRef.current.focus();
        }
    }

    return (
        <Dialog disableBackdropClick
                disableEscapeKeyDown
                maxWidth="xs"
                onEntering={handleEntering}
                open={open}
                {...other}
        >
            <DialogTitle>
                {title}
            </DialogTitle>
            <DialogContent>
                {message}
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="primary">
                    Cancel
                </Button>
                <Button onClick={onOk} color="primary">
                    Ok
                </Button>
            </DialogActions>
        </Dialog>
    );
}

ConfirmationDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    onOk: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
};
