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
const crypto = require('crypto');
const passport = require('./server/config/passport');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5001;

// Middleware สำหรับ parse body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to Database
connectDB().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET is not defined in environment variables');
  process.exit(1);
}

// ตั้งค่าการลบประกาศที่หมดอายุทุกวันเวลาเที่ยงคืน
schedule.scheduleJob('0 0 * * *', async () => {
  try {
    const now = new Date();
    const result = await SystemAnnouncement.updateMany(
      { expirationDate: { $lt: now }, isDeleted: { $ne: true } },
      { isDeleted: true, updatedAt: now }
    );
    console.log(`${result.nModified} ประกาศที่หมดอายุถูกย้ายไปที่ history เรียบร้อยแล้ว`);
  } catch (error) {
    console.error('Error moving expired announcements to history:', error);
  }
});

// เรียกใช้งานฟังก์ชันหลังเชื่อมต่อฐานข้อมูล
connectDB()
  .then(() => {
    console.log('Connected to database');
  })
  .catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });

passport.use(User.createStrategy());

const sessionSecret = process.env.SESSION_SECRET || 'fallbackSecret1234';

console.log('🔑 Using SESSION_SECRET:', sessionSecret ? 'Loaded' : 'Not loaded');

app.use(cors({
  origin: "https://your-production-site.com",
  credentials: true
}));

if (!sessionSecret) {
  console.error('SESSION_SECRET is not defined in environment variables');
  process.exit(1);
}

console.log('Using SESSION_SECRET:', sessionSecret ? 'Loaded' : 'Not loaded');


const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI,
  collectionName: 'sessions',
});

sessionStore.on('connected', () => {
  console.log('MongoStore connected successfully');
});

sessionStore.on('error', (err) => {
  console.error('MongoStore connection error:', err);
});

console.log("SESSION_SECRET:", process.env.SESSION_SECRET);

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // HTTPS ใน production เท่านั้น
    httpOnly: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,  // อายุ session 7 วัน
  },
}));

app.set('trust proxy', 1);

console.log("MongoDB Session Store Connected");

app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  console.log('User from session:', req.session.passport?.user);
  console.log('User from session:', req.user);
  next();
});

console.log('Session middleware initialized');
console.log('MongoDB URI:', process.env.MONGODB_URI);
console.log('Session secret:', process.env.SESSION_SECRET ? 'Set' : 'Not set');

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'public/img')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/docUploads', express.static(path.join(__dirname, 'docUploads')));
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

// Middleware to handle due date validation and formatting
app.use((req, res, next) => {
  if (req.body.dueDate) {
    const dueDate = moment(req.body.dueDate, moment.ISO_8601, true);
    if (!dueDate.isValid()) {
      console.error('Invalid date format:', req.body.dueDate);
      req.flash('error', 'Invalid date format');
      return res.redirect('back');
    }
    req.body.dueDate = dueDate.toISOString();
  }
  next();
});

// Middleware to update lastActive on each request
app.use(async (req, res, next) => {
  if (req.isAuthenticated()) {
    try {
      req.user.lastActive = Date.now();
      await req.user.save();
    } catch (error) {
      console.error('Error updating lastActive:', error);
    }
  }
  next();
});

// Templating Engine setup
app.use(expressLayouts);
app.set('layout', './layouts/main');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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
  console.log(`Server listening at http://localhost:${port}`);
});