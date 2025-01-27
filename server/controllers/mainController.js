/**
 * GET /
 * Homepage
*/
exports.homepage = async (req, res) => {
  try {
    const users = await User.find({}); // ดึงข้อมูลผู้ใช้ทั้งหมดจากฐานข้อมูล

    const locals = {
      title: "NodeJs Notes",
      description: "Free NodeJS Notes App.",
    };
    console.log(users); 
    res.render('index', {
      user: req.user,
      users: users, // ส่งข้อมูลผู้ใช้ไปยัง view
      locals,
      layout: '../views/layouts/front-page'
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์');
  }
};