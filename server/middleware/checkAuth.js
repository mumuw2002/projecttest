// check auth middleware

exports.isLoggedIn = async function (req, res, next) {
    if (req.isAuthenticated()) {
      console.log('Authenticated user:', req.user); // ตรวจสอบว่า req.user ถูกต้อง
      return next();
    } else {
      console.log('Not authenticated, redirecting to login');
      return res.redirect('/login');
    }
  };
  