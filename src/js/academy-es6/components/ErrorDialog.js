import React from 'react';
import {Dialog} from "@material-ui/core";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import PropTypes from 'prop-types';

export default function ErrorDialog(props) {
    const {onClose, open, title, message} = props;

    return (
        <Dialog open={open} onClose={onClose} onEscapeKeyDown={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>{message}</DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Ok</Button>
            </DialogActions>
        </Dialog>
    );
}

ErrorDialog.propTypes = {
    title: PropTypes.string,
    message: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired
};

ErrorDialog.defaultProps = {
    title: '',
    message: ''
};
