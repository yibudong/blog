var express = require('express');
var router = express.Router();
var crypto = require('crypto'),
  User = require('../models/user.js'),
  Post = require('../models/post.js'),
  Comment = require('../models/comment.js');

var multer = require('multer')
var upload = multer({
  dest: './public/images',
  rename: function (fieldname, filename) {
    return filename
  }
})

/* GET home page. */


module.exports = function (router) {
  router.get('/', function (req, res, next) {
    Post.getAll(null, function (err, posts) {
      if (err) {
        posts = [];
      }
      res.render('index', {
        title: '主页',
        user: req.session.user,
        posts: posts,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      })
    })
  });


  router.get('/login', checkNotLogin);
  router.get('/login', function (req, res, next) {
    res.render('login', {
      title: '登录',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  router.post('/login', checkNotLogin);
  router.post('/login', function (req, res, next) {
    var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    User.get(req.body.name, function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在!');
        return res.redirect('/login');//用户不存在则跳转到登录页
      }
      //检查密码是否一致
      if (user.password != password) {
        req.flash('error', '密码错误!');
        return res.redirect('/login');//密码错误则跳转到登录页
      }
      //用户名密码都匹配后，将用户信息存入 session
      req.session.user = user;
      req.flash('success', '登陆成功!');
      res.redirect('/');//登陆成功后跳转到主页
    });
  });



  router.get('/reg', checkNotLogin);
  router.get('/reg', function (req, res, next) {
    res.render('reg', {
      title: '注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  router.post('/reg', checkNotLogin);
  router.post('/reg', function (req, res, next) {
    var name = req.body.name,
      password = req.body.password,
      password_re = req.body['password-repeat'];
    // //检验用户两次输入的密码是否一致
    if (password_re != password) {
      req.flash('error', '两次输入的密码不一致!');
      return res.redirect('/reg');//返回注册页
    }
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
      name: name,
      password: password,
      email: req.body.email
    });
    //检查用户名是否已经存在 
    User.get(newUser.name, function (err, user) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      if (user) {
        req.flash('error', '用户已存在!');
        return res.redirect('/reg');//返回注册页
      }
      //如果不存在则新增用户
      newUser.save(function (err, user) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/reg');//注册失败返回主册页
        }
        req.session.user = user.ops[0];//用户信息存入 session，以后可以通过req.seeion.user读取用户信息
        req.flash('success', '注册成功!');
        res.redirect('/');//注册成功后返回主页
      });
    });
  });




  router.get('/post', checkLogin);
  router.get('/post', function (req, res, next) {
    res.render('post', {
      title: '发表文章',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  router.post('/post', checkLogin);
  router.post('/post', function (req, res, next) {
    var currentUser = req.session.user,
      post = new Post(currentUser.name, req.body.title, req.body.post);
    post.save(function (err) {
      if (err) {
        req.flash('errror', err);
        return res.redirect('/');
      }
      req.flash('success', '发布成功')
      res.redirect('/')
    })
  });





  router.get('/logout', checkLogin);
  router.get('/logout', function (req, res, next) {
    req.session.user = null;
    req.flash('success', '登出成功!');
    res.redirect('/');//登出成功后跳转到主页
  });
  router.get('/upload', checkLogin);
  router.get('/upload', function (req, res) {
    res.render('upload', {
      title: '文件上传',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  router.post('/upload', checkLogin);
  router.post('/upload', upload.fields([
    { name: 'file1' },
    { name: 'file2' },
    { name: 'file3' },
    { name: 'file4' },
    { name: 'file5' },
  ]), function (req, res, next) {
    for (var i in req.files) {
      console.log(req.files[i])
    }
    req.flash('success', '文件上传成功!');
    res.redirect('/upload');
  });

  router.get('/u/:name', function (req, res) {
    User.get(req.params.name, function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在')
      }
      Post.getAll(user.name, function (err, posts) {
        if (err) {
          req.flash('error', err)
          return res.redirect('/')
        }
        res.render('user', {
          title: user.name,
          posts: posts,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        })
      })
    })
  })
  router.get('/u/:name/:day/:title', function (req, res) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
      if (err) {
        req.flash('error', err)
        return res.redirect('/')
      }
      console.log('xiaokeai')
      console.log(post)
      res.render('article', {
        title: req.params.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      })
    })
  })
  router.post('/u/:name/:day/:title',function(req,res){
    var date=new Date(),
    time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
             date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var comment = {
      name: req.body.name,
      email: req.body.email,
      website: req.body.website,
      time: time,
      content: req.body.content
    };
    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
    newComment.save(function (err) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('back');
      }
      req.flash('success', '留言成功!');
      res.redirect('back');
    });
  })

  router.get('/edit/:name/:day/:title', checkLogin)
  router.get('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user
    Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
      if (err) {
        req.flash('error', err)
        return res.redirect('back')
      }
      res.render('edit', {
        title: '编辑',
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      })
    })
  })
  router.post('/edit/:name/:day/:title', checkLogin)
  router.post('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user

    Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
      var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title)
      if (err) {
        req.flash('error', err)
        return res.redirect(url)
      }
      console.log('啦啦啦')
      req.flash('success', '修改成功')
      res.redirect(url)
    })
  })
  router.get('/remove/:name/:day/:title', checkLogin);
  router.get('/remove/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('back');
      }
      req.flash('success', '删除成功!');
      res.redirect('/');
    });
  });


};
//app.get和app.post两个，两个参数，第一个是请求路径，第二个是处理请求的回调函数，回调函数的参数是req,res,

function checkLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', '未登录!');
    res.redirect('/login');
  }
  next();
}

function checkNotLogin(req, res, next) {
  if (req.session.user) {
    req.flash('error', '已登录!');
    res.redirect('back');//返回之前的页面
  }
  next();
}