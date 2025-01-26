const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // ปรับเส้นทางให้ถูกต้อง

passport.use(
  new GoogleStrategy(
    {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google OAuth Login');
        console.log('Google Email:', profile.emails[0].value); // แสดง email
        console.log('Google Profile:', profile); // แสดงข้อมูลโปรไฟล์ทั้งหมด
        
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
            role: profile.emails[0].value === process.env.ADMIN_EMAIL ? 'admin' : 'user',
            profileImage: profile.photos[0]?.value || '',
        });
        await user.save();
      } else {
          // ถ้ามีผู้ใช้แล้ว อัปเดตข้อมูล
          if (profile.emails[0].value === process.env.ADMIN_EMAIL) {
          user.role = 'admin';
                await user.save();
          }
      }

      return done(null, user);
    } catch (err) {
      console.error(err);
      return done(err, null);
    }
  }
  )
);


// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id); // serialize ด้วย user ID
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); // deserialize user จาก database
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
