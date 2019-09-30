import React from 'react';
import PropTypes from 'prop-types';
import {Dialog} from "@material-ui/core";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    progress: {
        margin: theme.spacing(2),
    },
}));


export default function LoadingDialog(props) {
    const {open, title, message, progress, ...other} = props;
    const classes = useStyles();
    const indeterminate = progress === 0 || progress === 1;

    return (
        <Dialog disableBackdropClick disableEscapeKeyDown maxWidth="sm" open={open} {...other}>
            <DialogTitle>
                {title}
            </DialogTitle>
            <DialogContent>

                <CircularProgress
                    className={classes.progress}
                    variant={indeterminate ? "indeterminate" : "determinate"}
                    value={progress * 100}
                    color="primary"
                />
                <span>
                    {message}
                </span>
            </DialogContent>
        </Dialog>
    );
}

LoadingDialog.propTypes = {
    open: PropTypes.bool,
    title: PropTypes.string,
    message: PropTypes.string,
    progress: PropTypes.number
};
LoadingDialog.defaultProps = {
    progress: 0,
    title: "Loading",
    message: "Please wait"
};
