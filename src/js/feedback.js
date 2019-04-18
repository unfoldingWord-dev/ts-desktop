const os = require('os');
const appPackage = require('../../package');
const axios = require('axios');
const stringify = require('json-stringify-safe');

/**
 * Submits a new support ticket.
 * If the response is 401 the user is not registered and you should supply
 * a `name` in order to create the account.
 *
 * @param {string} category - the support category
 * @param {string} message - the user's feedback
 * @param {string} [name] - the user's name. Only use this if you need to create a new support account.
 * @param {string} email - the email opening this ticket
 * @param {object} [state] - the application state. If this is set both the state and system information will be submitted.
 * @return {AxiosPromise}
 */
const submitFeedback = ({category, message, name, email, state, helpdeskToken, helpdeskEmail}) => {
    const osInfo = {
        arch: os.arch(),
        cpus: os.cpus(),
        memory: os.totalmem(),
        type: os.type(),
        networkInterfaces: os.networkInterfaces(),
        loadavg: os.loadavg(),
        eol: os.EOL,
        userInfo: os.userInfo(),
        homedir: os.homedir(),
        platform: os.platform(),
        release: os.release()
    };

    let fromContact = {
        email: helpdeskEmail,
        name: 'Help Desk'
    };
    if (email) {
        fromContact = {
            email,
            name: name ? name : email
        };
    }

    let fullMessage = `${message}\n\nApp Version:\n${appPackage.version} (${appPackage.build})`;
    if (name) {
        fullMessage += `\n\nName: ${name}`;
    }
    if (email) {
        fullMessage += `\n\nEmail: ${email}`;
    }
    if (state) {
        const stateString = stringifySafe(state, '[error loading state]');
        const osString = stringifySafe(osInfo,
            '[error loading system information]');
        fullMessage += `\n\nSystem Information:\n${osString}\n\nApp State:\n${stateString}`;
    }

    const request = {
        method: 'POST',
        url: 'https://api.sendgrid.com/v3/mail/send',
        headers: {
            Authorization: `Bearer ${helpdeskToken}`
        },
        data: {
            'personalizations': [
                {
                    'to': [
                        {
                            email: helpdeskEmail,
                            name: 'Help Desk'
                        }
                    ],
                    subject: `tS: ${category}`
                }
            ],
            'from': fromContact,
            'reply_to': fromContact,
            'content': [
                {type: 'text/plain', value: fullMessage},
                {type: 'text/html', value: fullMessage.replace(/\n/g, '<br>')}
            ]
        }
    };
    //
    // if (name) {
    //   request.data.user_name = name;
    // }

    try {
        return axios(request);
    } catch (e) {
        return Promise.reject(e);
    }
};

/**
 * Safely converts a json object to a string.
 * This will handle circular object as well
 * @param json
 * @param error
 * @return {string}
 */
const stringifySafe = (json, error = null) => {
    try {
        return stringify(json);
    } catch (e) {
        if (error) {
            return error;
        } else {
            return e.message;
        }
    }
};

module.exports.submitFeedback = submitFeedback;
