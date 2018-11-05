'use_strict';

const childProcess = require('child_process');
const { apiResponse, customError } = require('../utils/helpers');
const ServerRepo = require('../repositories/server_repo');
const ProjectRepo = require('../repositories/project_repo');
const LogRepo = require('../repositories/log_repo');
const LogTransformer = require('../utils/transformers/log_transformer');

const MASTER_BRANCH = 'master';
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

const deployer = async (project, server, buildType, source) => {
    // generate commands
    const buildCommands = project.scripts[buildType].reduce((val, item) => {
        val.push(item);
        return val;
    }, [`cd ${project.app_dir}`]);
    const commands = buildCommands.concat(project.scripts.restart_server);

    // run deployment commands
    return childProcess.exec(commands.join(' && '), async (error, stdout, stderr) => {
        await ProjectRepo.update({ name: project.name }, { status: PROJECT_STATUS.IDLE });

        if (error) return LogRepo.create(LogTransformer(server, project, source, { error, std: stderr }, 'fail'));

        return LogRepo.create(LogTransformer(server, project, source, stdout, 'success'));
    });
};

exports.github = async (req, res, next) => {
    try {
        const payload = JSON.parse(req.body.payload);
        if ('zen' in payload) return apiResponse(res, payload.zen, 200);

        const branch = payload.ref.split('/').slice(-1)[0];
        const projectName = payload.repository.name;
        const buildType = req.query.build_type === 'clean' ? SCRIPT.CLEAN_BUILD : SCRIPT.BUILD;

        // check if push event is from master branch
        if (branch !== MASTER_BRANCH) return apiResponse(res, 'skipping app deployment, branch is not master', 200);

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
        await deployer(project, server, buildType, 'github');

        return apiResponse(res, 'trigger running...', 200);
    } catch (error) {
        return (next(error));
    }
};

exports.manual = async (req, res, next) => {
    try {
        const { params } = req;
        const projectName = params.projectName;
        const buildType = req.query.build_type === 'clean' ? SCRIPT.CLEAN_BUILD : SCRIPT.BUILD;

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
        await deployer(project, server, buildType, 'manual');

        return apiResponse(res, 'trigger running...', 200);
    } catch (error) {
        return (next(error));
    }
};

module.exports = exports;
