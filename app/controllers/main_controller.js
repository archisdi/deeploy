const { apiResponse, customError } = require('../utils/helpers');
const ServerRepo = require('../repositories/server_repo');
const ProjectRepo = require('../repositories/project_repo');

const deployer = (project) => {

};

const MASTER_BRANCH = 'master';

exports.deploy = async (req, res, next) => {
    try {
        const branch = req.body.ref.split('/').slice(-1)[0];
        const projectName = req.body.repository.name;

        if (branch !== MASTER_BRANCH) return apiResponse(res, 'skipping app deployment, branch is not master', 200);

        const project = await ServerRepo.findOne({ server_id: req.params.serverId })
            .then((server) => {
                if (!server) return null;
                return ProjectRepo.findOne({ name: projectName, server_id: server.server_id });
            });
        if (!project) return next(customError('project not found', 404));

        await deployer(project);

        return apiResponse(res, 'app deployed', 200, project);
    } catch (error) {
        return (next(error));
    }
};

module.exports = exports;
