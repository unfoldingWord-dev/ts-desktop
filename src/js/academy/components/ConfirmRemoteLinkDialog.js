import ConfirmationDialog from './ConfirmationDialog';
import PropTypes from 'prop-types';
import React from 'react';

export default function ConfirmRemoteLinkDialog(props) {
    const {href, ...other} = props;
    let message = `You are about to visit ${href} in your internet browser. Continue?`;

    return (
        <ConfirmationDialog title="Visit Website"
                            message={message} {...other} />
    );
}

ConfirmRemoteLinkDialog.propTypes = {
    href: PropTypes.string,
    open: PropTypes.bool.isRequired,
    onOk: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
};

ConfirmRemoteLinkDialog.defaultProps = {
    href: ''
};
