import React from 'react';
import {Dialog} from "@material-ui/core";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import PropTypes from 'prop-types';
import Typography from "@material-ui/core/Typography";
import {makeStyles} from "@material-ui/styles";

const useStyles = makeStyles(theme => ({
    code: {
        padding: theme.spacing(3, 2),
        backgroundColor: '#efefef',
        borderRadius: 4,
        boxShadow: 'inset 0 0 10px #d0d0d0',
        color: '#444444',
        fontFamily: 'arial',
        fontSize: '80%',
        fontStyle: 'italic'
    }
}));

export default function ErrorDialog(props) {
    const {onClose, open, title, error} = props;
    const classes = useStyles();

    const message = error ? error.message : '';
    const errorMessage = error && error.error ? error.error.message : '';

    return (
        <Dialog open={open} onClose={onClose} onEscapeKeyDown={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Typography>{message}</Typography>
                <p className={classes.code}>{errorMessage}</p>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Ok</Button>
            </DialogActions>
        </Dialog>
    );
}

ErrorDialog.propTypes = {
    title: PropTypes.string,
    error: PropTypes.shape({
        message: PropTypes.string,
        error: PropTypes.object
    }),
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired
};

ErrorDialog.defaultProps = {
    title: '',
    error: {
        message: '',
        error: {}
    }
};
