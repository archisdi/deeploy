const Slack = require('slack-node');
const moment = require('moment');
const { DEPLOYMENT_STATUS } = require('./constant');

const getSlackInstance = (url) => {
    const instance = new Slack();
    return instance.setWebhook(url);
};

exports.notify = async (server, project, status) => {
    const slackInstance = await getSlackInstance(project.slack_webhook);
    slackInstance.webhook({
        text: `Deployment ${status}`,
        attachments: [{
            color: status === DEPLOYMENT_STATUS.SUCCESS ? '#19A974' : '#CE5A51',
            fields: [{
                title: 'Server Name',
                value: server.name,
                short: true
            },
            {
                title: 'App Name',
                value: project.name,
                short: true
            }
            ],
            ts: moment().unix()
        }]
    }, (err, response) => {
        console.log('sent');
    });
};
