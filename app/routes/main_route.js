const router = require('express').Router();
const MainController = require('../controllers/main_controller');

router.post('/deploy/:source/:serverId', MainController.deploy);

module.exports = router;
