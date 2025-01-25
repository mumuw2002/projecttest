// Space routes
const { Router } = require('express');
const router = Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const spaceController = require('../controllers/spaceController');
const userActivityLogger = require('../middleware/userActivityLogger');

router.get('/space', isLoggedIn, userActivityLogger, (req, res, next) => {
    console.log('Accessing /space route');
    console.log('User role:', req.user?.role);
    console.log('User ID:', req.user?._id);
    spaceController.SpaceDashboard(req, res, next);
});
router.post('/createSpace', isLoggedIn, userActivityLogger, spaceController.createSpace);
router.delete('/space/delete/:id', isLoggedIn, spaceController.deleteSpace);
router.put('/space/:id/recover', isLoggedIn, spaceController.recoverSpace);
router.get('/subject/recover', isLoggedIn, spaceController.ShowRecover);

router.post('/updateSpacePicture/:id', isLoggedIn, spaceController.edit_Update_SpacePicture);
router.post('/updateSpaceName/:id', isLoggedIn, spaceController.edit_Update_SpaceName);
module.exports = router;