/**
 * GET /
 * Homepage
*/
exports.homepage = async (req, res) => {
  const locals = {
    title: "NodeJs Notes",
    description: "Free NodeJS Notes App.",
  }
  res.render('index', {
    user: req.user,
    users: users,
    locals,
    layout: '../views/layouts/front-page'
  });
}