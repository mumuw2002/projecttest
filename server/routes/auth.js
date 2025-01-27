const express = require("express");
const passport = require("passport");
// Add this line to import GoogleStrategy
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const authController = require("../controllers/authController");
const router = express.Router();
const userActivityLogger = require('../middleware/userActivityLogger');

// Google OAuth authentication route
router.get("/auth/google", passport.authenticate("google", { scope: ["email", "profile"] }));
router.get("/google/callback", passport.authenticate("google", {
  failureRedirect: "/login-failure",
}), (req, res) => {
  if (req.user.role === 'admin') {
    return res.redirect('/adminPage');
  } else {
    return res.redirect('/space');
  }
});

// Login
router.get("/login", authController.loginPage);
router.post("/login", authController.login);

// Register
router.post("/user/register", authController.registerUser);
router.get("/register", authController.registerPage);

// Login failure
router.get("/login-failure", authController.loginFailure);

// Logout
router.get("/logout", authController.logout);
// Routes for forgot password
router.get('/forgot-password', authController.showForgotPassword); // ไม่เปลี่ยนแปลง
router.post('/forgot-password', authController.resendOTP);

// Route for OTP verification
router.get('/verify-otp', authController.showVerifyOTP); // ต้องมีเส้นทางนี้
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);

// Routes for reset password
router.get('/reset-password', authController.showResetPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
