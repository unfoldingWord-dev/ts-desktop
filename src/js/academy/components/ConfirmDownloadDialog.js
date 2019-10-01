import ConfirmationDialog from './ConfirmationDialog';
import PropTypes from 'prop-types';
import React from 'react';

export default function ConfirmDownloadDialog(props) {
    const {translation, ...other} = props;
    let message = '';
    let dialogTitle = 'Download translationAcademy';

    if(translation) {
        const {update, title, language} = translation;

        message = `Do you want to download the ${title} (${language}) translationAcademy?`;
        if (update) {
            dialogTitle = 'Update translationAcademy';
            message = `An update is available for the ${title} (${language}) translationAcademy. Would you like to download it now?`;
        }
    }

    return (
        <ConfirmationDialog title={dialogTitle}
                            message={message} {...other} />
    );
}

ConfirmDownloadDialog.propTypes = {
    translation: PropTypes.shape({
        update: PropTypes.bool.isRequired,
        title: PropTypes.string.isRequired,
        language: PropTypes.string.isRequired
    }),
    open: PropTypes.bool.isRequired,
    onOk: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
};
