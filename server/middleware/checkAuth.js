exports.isLoggedIn = async function (req, res, next) {
  if (req.isAuthenticated()) {
      console.log('Authenticated user:', req.user); // Check req.user here
      return next();
  } else {
      console.log('Not authenticated, redirecting to login');
      return res.redirect('/login');
  }
};