const BRANCH = {
    MASTER: 'master'
};

const SCRIPT = {
    BUILD: 'build',
    CLEAN_BUILD: 'clean-build'
};

const STATUS = {
    ACTIVE: true,
    DEACTIVE: false
};

const PROJECT_STATUS = {
    IDLE: 'idle',
    DEPLOYING: 'deploying'
};

const DEPLOYMENT_STATUS = {
    FAIL: 'fail',
    SUCCESS: 'success'
};

const SOURCE = {
    GITHUB: 'github',
    BITBUCKET: 'bitbucket',
    GITLAB: 'gitlab',
    MANUAL: 'manual'
};

module.exports = {
    BRANCH, SCRIPT, STATUS, PROJECT_STATUS, DEPLOYMENT_STATUS, SOURCE
};
