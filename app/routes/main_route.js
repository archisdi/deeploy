const router = require('express').Router();
const MainController = require('../controllers/main_controller');

router.post('/', MainController.deploy);

module.exports = router;
