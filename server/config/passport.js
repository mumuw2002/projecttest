const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

// Google OAuth Strategy
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
        console.log('Google Email:', profile.emails[0].value);
        console.log('Google Profile:', profile);

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


// Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'googleEmail',
      passwordField: 'password',
    },
    async (googleEmail, password, done) => {
      try {
        const user = await User.findOne({ googleEmail });
        if (!user) {
          return done(null, false, { message: 'Incorrect email.' });
        }
        const isValidPassword = await user.verifyPassword(password);
        if (!isValidPassword) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    console.log('Deserializing user with id:', id);
    const user = await User.findById(id);
    if (!user) {
      console.error('User not found during deserialization');
      return done(null, false);
    }
    console.log('User found during deserialization:', user);
    done(null, user);
  } catch (err) {
    console.error('Deserialization error:', err);
    done(err, null);
  }
});

module.exports = passport;