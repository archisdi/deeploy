const moment = require('moment');

module.exports = (project, server, source, meta, status) => ({
    server: server.name,
    project: project.name,
    source,
    meta,
    status,
    date: moment().format()
});
