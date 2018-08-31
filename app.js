var createError = require('http-errors');
var express = require('express'); //生成一个express实例
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var routes = require('./routes/index');
//var usersRouter = require('./routes/users');
var settings=require('./settings'); //引入数据库
var flash=require('connect-flash');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var multer=require('multer')
var upload=multer({dest:'./public/images'})
var app = express();
// view engine setup


app.set('views', path.join(__dirname, 'views')); //设置view文件夹为存放视图文件的目录
//dirname为全局变量，存储当前正在执行的脚本所在的目录
app.set('view engine', 'ejs'); //设置试图模板引擎ejs
app.use(flash());

app.use(logger('dev')); //加载日志中间件
app.use(express.json()); //加载解析JSON的中间件
app.use(express.urlencoded({ extended: false })); //加载解析urlencoded请求体的中间件
app.use(cookieParser()); //加载解析cookie的中间件
app.use(express.static(path.join(__dirname, 'public'))); //设置public文件夹为存放静态文件的目录

app.use(session({
  secret: settings.cookieSecret, //防止篡改cookie，key值为cookie名字
  key: settings.db,//cookie name
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days，通过设置maxAge来设置cookie生存期
  store: new MongoStore({
    db: settings.db,
    host: settings.host,
    port: settings.port,
    url: 'mongodb://localhost/blog'

  }) //设置store参数为mongostore实例，吧会话信息存储在数据库中，以避免丢失。
    //后面可以通过req.session获取当前用户的会话对象，获取用户的相关信息
}));  //先声明session  在使用router
// app.use(multer({
//   dest:'./public/images', //上传的文件所在的目录
//   rename:function(fieldname,filename){
//     return filename
//   } //rename函数用来修改上传后的文件名字，这里设置为保持原来的文件名
// }))
routes(app);
//usersRouter(app);//路由控制器


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  //生产环境下的错误
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
