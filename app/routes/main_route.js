const router = require('express').Router();
const MainController = require('../controllers/main_controller');

router.post('/deploy/:serverId', MainController.deploy);

module.exports = router;
