// check auth middleware
const Subject = require('../models/Subject'); // Adjust the path as needed
const User = require('../models/User');

exports.isLoggedIn = async function (req, res, next) {
    console.log('Checking if user is authenticated');
    console.log('Request URL:', req.originalUrl);
    console.log('Authenticated:', req.isAuthenticated());
    console.log('Session ID:', req.sessionID);
    console.log('User in session:', req.session.passport?.user);
    console.log('User in session:', req.session.passport?.user); 

    if (req.isAuthenticated()) {
        console.log('User is authenticated, proceeding to next middleware');
        if (req.originalUrl.startsWith('/subject')) {
            const subjectId = req.params.id || req.body.subjectId;
            if (subjectId) {
                try {
                    const subject = await Subject.findById(subjectId);
                    if (!subject ||
                        (!subject.user.equals(req.user._id) &&
                            !subject.collaborators.includes(req.user._id))) {
                        console.log('Subject not found or unauthorized');
                        return res.status(404).send("Subject not found");
                    }
                } catch (error) {
                    console.error('Error finding subject:', error);
                    return res.status(500).send("Internal Server Error");
                }
            }
        }
        console.log('User is authenticated, proceeding to next middleware');
        return next();
    } else {
        console.log('User is not authenticated, redirecting to /login');
        res.redirect('/login');
    }
};