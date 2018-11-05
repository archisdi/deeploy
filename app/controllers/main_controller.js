'use_strict';

const Promise = require('bluebird');
const childProcess = require('child_process');
const { apiResponse, customError } = require('../utils/helpers');
const ServerRepo = require('../repositories/server_repo');
const ProjectRepo = require('../repositories/project_repo');
const LogRepo = require('../repositories/log_repo');
const LogTransformer = require('../utils/transformers/log_transformer');
const slack = require('../utils/slack');
const {
    BRANCH, STATUS, DEPLOYMENT_STATUS, PROJECT_STATUS, SCRIPT, SOURCE
} = require('../utils/constant');

const deployer = async (project, server, buildType, source, trigger) => {
    // concat commands
    const commands = [`cd ${project.app_dir}`];
    commands.push(...project.scripts.pre);
    commands.push(...project.scripts[buildType]);
    commands.push(...project.scripts.post);

    // run deployment commands
    return childProcess.exec(commands.join(' && '), async (error, stdout, stderr) => {
        await ProjectRepo.update({ name: project.name }, { status: PROJECT_STATUS.IDLE });

        let log;
        let slackNotif;
        let deployStatus;
        if (error) {
            deployStatus = DEPLOYMENT_STATUS.FAIL;
            log = LogRepo.create(LogTransformer(server, project, source, { error, std: stderr }, deployStatus));
        } else {
            deployStatus = DEPLOYMENT_STATUS.SUCCESS;
            log = LogRepo.create(LogTransformer(server, project, source, stdout, deployStatus));
        }

        // create slack promise if exsist
        if (project.slack_webhook) slackNotif = slack.notify(server, project, source, trigger, deployStatus);

        return Promise.join(log, slackNotif);
    });
};

exports.deploy = async (req, res, next) => {
    try {
        const { params, query, body } = req;
        const buildType = query.build_type === 'clean' ? SCRIPT.CLEAN_BUILD : SCRIPT.BUILD;
        const source = params.source;

        if (process.env.debug === 'true') console.log({ params, query, body });

        let projectName;
        let trigger;
        switch (source) {
        case SOURCE.GITHUB: {
            const payload = JSON.parse(body.payload);
            if ('zen' in payload) {
                return apiResponse(res, payload.zen, 200);
            }

            const branch = payload.ref.split('/').slice(-1)[0];
            if (branch !== BRANCH.MASTER) {
                return apiResponse(res, 'skipping app deployment, branch is not master', 200);
            }

            projectName = payload.repository.name;
            trigger = payload.pusher.name;
            break;
        }

        case SOURCE.BITBUCKET: {
            const branch = body.push.changes[0].new.name;
            if (branch !== BRANCH.MASTER) {
                return apiResponse(res, 'skipping app deployment, branch is not master', 200);
            }

            projectName = body.repository.name;
            trigger = body.actor.display_name;
            break;
        }

        case SOURCE.GITLAB: {
            return next(customError('source not yet supported', 403));
        }

        case SOURCE.MANUAL: {
            projectName = body.project_name;
            trigger = '-';
            break;
        }

        default:
            return next(customError('source not recognized', 422));
        }

        // get server
        const server = await ServerRepo.findOne({ server_id: req.params.serverId, is_active: STATUS.ACTIVE });
        if (!server) return next(customError('server not found', 404));

        // get project
        const project = await ProjectRepo.findOne({
            name: projectName, server_id: server.server_id, is_active: STATUS.ACTIVE
        });
        if (!project) return next(customError('project not found', 404));
        if (project.status === PROJECT_STATUS.DEPLOYING) return next(customError('project already deploying', 403));

        // mark project as deploying
        await ProjectRepo.update({ name: projectName }, { status: PROJECT_STATUS.DEPLOYING });

        // deploy project
        await deployer(project, server, buildType, source, trigger);

        return apiResponse(res, 'trigger running...', 200);
    } catch (error) {
        return (next(error));
    }
};

module.exports = exports;
