import ConfirmationDialog from './ConfirmationDialog';
import PropTypes from 'prop-types';
import React from 'react';

export default function ConfirmDownloadDialog(props) {
    const {translation, ...other} = props;

    let message = 'Do you want to download translationAcademy?';
    if(translation && translation.update) {
        message = 'An update is available. Would you like to download it now?';
    }

    return (
        <ConfirmationDialog title="Download translationAcademy"
                            message={message} {...other} />
    );
}

ConfirmDownloadDialog.propTypes = {
    translation: PropTypes.shape({
        update: PropTypes.bool.isRequired
    }),
    open: PropTypes.bool.isRequired,
    onOk: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
};
