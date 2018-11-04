'use_strict';

const childProcess = require('child_process');
const { apiResponse, customError } = require('../utils/helpers');
const ServerRepo = require('../repositories/server_repo');
const ProjectRepo = require('../repositories/project_repo');

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

const deployer = async (project, buildType) => {
    // generate commands
    const buildCommands = project.scripts[buildType].reduce((val, item) => {
        val.push(item);
        return val;
    }, [`cd ${project.app_dir}`]);
    const commands = buildCommands.concat(project.scripts.restart_server);

    // run deployment commands
    return childProcess.exec(commands.join(' && '), async (err, stdout, stderr) => {
        await ProjectRepo.update({ name: project.name }, { status: PROJECT_STATUS.IDLE });
        if (err) {
            console.error(err);
        }
        console.log(stdout);
        console.log(stderr);
    });
};

exports.deploy = async (req, res, next) => {
    try {
        const payload = req.body.payload;
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
        await deployer(project, buildType);

        return apiResponse(res, 'trigger running...', 200);
    } catch (error) {
        return (next(error));
    }
};

module.exports = exports;
