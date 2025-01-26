// check auth middleware

exports.isLoggedIn = async function (req, res, next) {
    console.log('Checking authentication...');
    if (req.isAuthenticated()) {
      console.log('Authenticated user:', req.user);
      return next();
    } else {
      console.log('Not authenticated, redirecting to login');
      return res.redirect('/login');
    }
  };