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
import WifiIcon from '@material-ui/icons/Wifi';
import DownloadIcon from '@material-ui/icons/CloudDownload';
import Typography from '@material-ui/core/Typography';

const useRawStyles = makeStyles(theme => ({
    leftIcon: {
        marginRight: theme.spacing(1)
    },
    listIcon: {
        // marginRight: theme.spacing(1)
    },
    label: {
        display: 'flex',
        width: '100%'
    },
    title: {
        flexGrow: 1
    },
    radio: {
        '&:hover': {
            backgroundColor: '#eee'
        }
    },
    labelRTL: {
        direction: 'rtl',
        display: 'flex',
        width: '100%'
    }
}));

/**
 * Renders a title with text in the correct position
 * based on the language direction.
 * @param props
 * @returns {*}
 * @constructor
 */
function LocalizedTitle(props) {
    const {title, language, direction, classes} = props;

    let displayedTitle = `${title} - ${language}`;
    if (direction === 'rtl') {
        displayedTitle = `${language} - ${title}`;
    }
    return (
        <Typography variant="body1"
                    className={classes.title}>{displayedTitle}</Typography>
    );
}

export function ConfirmationDialogRaw(props) {
    const {onClose, onUpdate, catalog, options, open, ...other} = props;
    const [value, setValue] = React.useState(null);
    const radioGroupRef = React.useRef(null);
    const classes = useRawStyles();

    function handleEntering() {
        if (radioGroupRef.current != null) {
            radioGroupRef.current.focus();
        }
    }

    function handleCancel() {
        onClose(null);
    }

    function handleOk() {
        onClose(value);
    }

    function handleChange(event) {
        setValue(event.target.value);
    }

    function handleUpdate() {
        onUpdate();
    }

    let instructions = '';
    if (options.length === 0) {
        instructions = 'You have not downloaded translationAcademy yet. Check for updates to download translationAcademy.';
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
                {instructions}
                <RadioGroup
                    ref={radioGroupRef}
                    aria-label="ringtone"
                    name="ringtone"
                    value={value}
                    onChange={handleChange}
                >
                    {options.map(option => (
                        <FormControlLabel value={option.language}
                                          key={option.language}
                                          control={<Radio/>}
                                          classes={{
                                              label: option.direction ===
                                              'rtl' ?
                                                  classes.labelRTL :
                                                  classes.label,
                                              root: classes.radio
                                          }}
                                          label={(
                                              <>
                                                  <LocalizedTitle
                                                      title={option.title}
                                                      language={option.language}
                                                      direction={option.direction}
                                                      classes={{
                                                          title: classes.title
                                                      }}/>
                                                  <DownloadIcon
                                                      visibility={option.update ?
                                                          'visible' :
                                                          'hidden'}
                                                      className={classes.listIcon}/>
                                              </>
                                          )}/>

                    ))}
                </RadioGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleUpdate} color="secondary">
                    <WifiIcon className={classes.leftIcon}/>
                    Check for updates
                </Button>
                <Button onClick={handleCancel} color="primary">
                    Cancel
                </Button>
                <Button onClick={handleOk} color="primary"
                        disabled={value === null}>
                    Ok
                </Button>
            </DialogActions>
        </Dialog>
    );
}

ConfirmationDialogRaw.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    onUpdate: PropTypes.func.isRequired,
    options: PropTypes.array.isRequired
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
    const {onClose, onUpdate, options} = props;

    // TODO: maybe perform all of the downloading here.

    return (
        <ConfirmationDialogRaw
            classes={{
                paper: classes.paper
            }}
            options={options}
            id="translation-menu"
            keepMounted
            open={props.open}
            onUpdate={onUpdate}
            onClose={onClose}
        />
    );
}

ChooseTranslationDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string.isRequired,
        direction: PropTypes.string.isRequired,
        language: PropTypes.string.isRequired
    }).isRequired),
    open: PropTypes.bool.isRequired
};
