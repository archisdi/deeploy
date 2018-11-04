const router = require('express').Router();
const MainController = require('../controllers/main_controller');

router.post('/deploy/:serverId/:appId', MainController.deploy);

module.exports = router;
