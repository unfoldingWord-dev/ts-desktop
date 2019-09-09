import React from 'react';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import FormControlLabel from '@material-ui/core/FormControlLabel';

const options = [
    'English',
    'Croatian',
    'French'
];

export function ConfirmationDialogRaw(props) {
    const {onClose, open, ...other} = props;
    const [value, setValue] = React.useState(null);
    const radioGroupRef = React.useRef(null);

    function handleEntering() {
        if (radioGroupRef.current != null) {
            radioGroupRef.current.focus();
        }
    }

    function handleCancel() {
        onClose();
    }

    function handleOk() {
        onClose(value);
    }

    function handleChange(event) {
        setValue(event.target.value);
    }

    return (
        <Dialog
            disableBackdropClick
            disableEscapeKeyDown
            maxWidth="xs"
            onEntering={handleEntering}
            aria-labelledby="confirmation-dialog-title"
            open={open}
            {...other}
        >
            <DialogTitle id="confirmation-dialog-title">
                translationAcademy Translation
            </DialogTitle>
            <DialogContent dividers>
                <RadioGroup
                    ref={radioGroupRef}
                    aria-label="ringtone"
                    name="ringtone"
                    value={value}
                    onChange={handleChange}
                >
                    {options.map(option => (
                        <FormControlLabel value={option} key={option}
                                          control={<Radio/>} label={option}/>
                    ))}
                </RadioGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel} color="primary">
                    Cancel
                </Button>
                <Button onClick={handleOk} color="primary">
                    Ok
                </Button>
            </DialogActions>
        </Dialog>
    );
}

ConfirmationDialogRaw.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired
};

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: theme.palette.background.paper
    },
    paper: {
        width: '80%',
        maxHeight: 435
    }
}));

export default function ChooseTranslationDialog(props) {
    const classes = useStyles();
    const {onClose} = props;

    return (
        <ConfirmationDialogRaw
            classes={{
                paper: classes.paper
            }}
            id="translation-menu"
            keepMounted
            open={props.open}
            onClose={onClose}
        />
    );
}

ChooseTranslationDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};
