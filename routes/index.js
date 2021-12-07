var express = require('express');
const passport = require('passport');
const users = require('./users');
var router = express.Router();
const {v4:uuidv4}=require('uuid')
var userModel=require('./users')
var mailer=require('./nodemailer')
var productModel=require('./product')
const multer  = require('multer')

const localStrategy = require('passport-local');
const { Passport, session } = require('passport');
const { set } = require('mongoose');

passport.use(new localStrategy(userModel.authenticate()));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/upload')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null,uniqueSuffix+file.originalname)
  }
})

const upload = multer({ storage: storage })

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/aluser',function(req,res){
  res.render('login')
})

router.post('/register',function(req,res ,next){
  var newUser = new userModel({
    username : req.body.username,
    name:req.body.name,
    email:req.body.email
  })
  userModel.register(newUser , req.body.password )
  .then(function(u){
    passport.authenticate('local')(req,res,function(){
      res.redirect('/profile')
    })
  }).catch(function(e){
    res.send(e);
  })
})

router.post('/login',passport.authenticate('local',{
  successRedirect:'/profile',
  failureRedirect:'/'
}),function(req,res,next){})

router.get('/logout' , function(req, res){
  req.logout();
  res.render('login');
});

router.get('/profile',isLoggedIn,function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(b){
    productModel.find()
    .then(function(a){
      res.render('profile',{a:a,b:b})
  })
})  
})
router.get('/user',isLoggedIn,function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .populate('products')
  .then(function(a){
    res.render('userpro',{a:a})
})  
})
router.post('/upload',isLoggedIn,upload.single('image'),function(req,res){
  userModel.findOneAndUpdate({username:req.session.passport.user},{profilepic:req.file.filename})
  .then(function(i){
    res.redirect('/user')
  })
})

router.get('/delete/:p',function(req,res){
  productModel.findOneAndDelete({_id:req.params.p})
  .then(function(a){
    res.redirect('/profile')
  })
})

router.get('/deletecart/:p',function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(a){
    a.item.forEach(function(i,index){
      if(i._id==req.params.p){
        a.item.splice(index,1)
        a.save()
      }
    })
    res.redirect('/cart')
  })
})

router.get('/deleteuser/:p',function(req,res){
  userModel.findOneAndDelete({_id:req.params.p})
  .then(function(a){
    res.redirect('/')
  })
})

router.get('/addproduct',function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(a){
    res.render('addpro',{a:a})

  })
})

router.get('/cart',isLoggedIn,function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(a){
    res.render('cart',{a:a})
  })
  
})

router.post('/submit',isLoggedIn,function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(us){
    productModel.create({
      name:req.body.name,
      price:req.body.price,
      dis:req.body.dis,
      imgurl:req.body.imgurl,
      user:us,
      username:us.username
    })
    .then(function(u){
      u.populate('product')
      us.products.push(u._id)
      us.save()
    })
    .then(function(cu){
      res.redirect('/profile')
    })
  })
})

router.get('/like/:p',isLoggedIn,function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(j){
    productModel.findOne({_id:req.params.p})
    .then(function(i){
      if(i.like.indexOf(j._id)==-1){
        i.like.push(j._id)
      }
      else{
        i.like.pop(j._id)
      }
      i.save()
      .then(function(cs){
        res.redirect('/profile')
      })
  })
  })
})

router.get('/addcart/:p',function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .populate('products')
  .then(function(j){
    productModel.findOne({_id:req.params.p})
    .then(function(i){
      if(j.item.indexOf(i)==-1){
        j.item.push(i)
      }
      else{
        j.item.pop(i)
      }
      j.save()
      .then(function(cs){
        res.redirect('/profile')
      })
  })
  })
})

router.get('/forgot',function(req,res){
  res.render('forgot')
})

router.post('/password',function(req,res){
  userModel.findOne({email:req.body.email})
  .then(function(v){
    var x=uuidv4()
    v.s=x
    v.save()
    var new1=`https://app-retailshop.herokuapp.com/cretep/${v._id}/${x}`
    mailer(req.body.email,new1)
    res.send("done")
    
  })
})

router.get('/cretep/:id/:a',function(req,res){
  userModel.findOne({_id:req.params.id})
  .then(function(i){
    var j=req.params.id
    if(i.s==req.params.a){
      res.render('setpass',{j})
    }
    else{
      res.send("not done")
    }
  })
})

router.post('/setpass/:id',function(req,res){
  userModel.findOne({_id:req.params.id})
  .then(function(a){
    if(req.body.password1==req.body.password2){
      a.setPassword(req.body.password1,function(err){
        a.save(function(err){
          console.log(err)
          res.redirect('/login')
        })
      })
    }else{
      res.send("enter same password in both field")
    }
  })
})

function isLoggedIn(req,res,next){
  if (req.isAuthenticated()){
    return next();
  }
  else{
    res.redirect('/');
  }
}

module.exports = router;
