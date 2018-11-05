const router = require('express').Router();
const MainController = require('../controllers/main_controller');

router.post('/deploy/github/:serverId', MainController.github);
router.post('/deploy/:serverId/:projectName', MainController.manual);

module.exports = router;
