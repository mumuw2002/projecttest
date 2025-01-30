require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const connectDB = require('./server/config/db');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./server/models/User');
const moment = require('moment');
const bodyParser = require('body-parser');
const schedule = require('node-schedule');
const SystemAnnouncement = require('./server/models/SystemAnnouncements');
const bcrypt = require('bcrypt');
const cors = require('cors');  // เพิ่ม CORS
const passport = require('./server/config/passport');

const app = express();
const port = process.env.PORT || 5001;

// Middleware สำหรับ parse body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to Database
connectDB().catch(err => {
  console.error('❌ Failed to connect to database:', err);
  process.exit(1);
});

if (!process.env.SESSION_SECRET) {
  console.error('❌ SESSION_SECRET is not defined in environment variables');
  process.exit(1);
}

const sessionSecret = process.env.SESSION_SECRET || 'fallbackSecret1234'; // Fallback

console.log('🔑 Using SESSION_SECRET:', sessionSecret ? 'Loaded' : 'Not loaded');

// CORS Configuration
app.use(cors({
  origin: "https://your-production-site.com",
  credentials: true
}));

// MongoDB Session Store
const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI,
  collectionName: 'sessions',
});

sessionStore.on('connected', () => {
  console.log('✅ MongoStore connected successfully');
});

sessionStore.on('error', (err) => {
  console.error('❌ MongoStore error:', err);
});

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // ปิด HTTPS ชั่วคราวหากมีปัญหา
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,  // อายุ session 7 วัน
  },
}));

app.set('trust proxy', 1); // สำคัญถ้าใช้ Proxy/Nginx

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'public/img')));
app.use(methodOverride('_method'));

app.use(helmet());

// Flash middleware setup
app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Middleware for logging session
app.use((req, res, next) => {
  console.log('🔍 Session ID:', req.sessionID);
  console.log('📝 Session Data:', req.session);
  console.log('👤 User from session:', req.user);
  next();
});

// Routes setup
app.use('/', require('./server/routes/auth'));
app.use('/', require('./server/routes/index'));
app.use('/', require('./server/routes/spaceRoutes'));
app.use('/', require('./server/routes/taskRou/taskPageRoutes'));
app.use('/', require('./server/routes/taskRou/taskDetailRoutes'));
app.use('/', require('./server/routes/taskRou/taskComplaintRouter'));
app.use('/', require('./server/routes/notiRoutes'));
app.use('/', require('./server/routes/subtaskRoutes'));
app.use('/', require('./server/routes/settingRoutes'));
app.use('/', require('./server/routes/userRoutes'));
app.use('/', require('./server/routes/adminRoutes'));
app.use('/', require('./server/routes/collabRoutes'));

// Handle 404 errors
app.get('*', (req, res) => {
  res.status(404).render('404');
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server listening at http://localhost:${port}`);
});
