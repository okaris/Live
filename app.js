/**
 * Live
 * Live blogging environment for WWDC 2013 Cocoaist Blog.
 *
 * Mert Dümenci 2013
 * MIT License
 */

var express = require('express'),
    http = require('http'),
    path = require('path'),
    app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    redis = require('connect-redis')(express),
    mongoose = require('mongoose');

app.configure(function(){
  app.set('port', process.env.PORT || 4128);
  app.set('post_author', 'Mert Dümenci');
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/public/uploaded_images', express.static(__dirname + "/public/uploaded_images"));
  app.use(express.bodyParser({ 
    keepExtensions: true, 
    uploadDir: __dirname + '/tmp',
    limit: '8mb'
  }));

});

app.configure('development', function(){
  app.use(express.errorHandler());
});

mongoose.connect('localhost', 'live');

///////

app.get('/', function(req, res) {
    res.render('feed');
});
app.get('/add-post', function(req, res) {
    res.render('add-post');
});

app.get('/post', function(req, res) {
  Post.find({}, function(err, posts) {
    if (err) {
      res.json({error: 'There was a problem with fetching posts from the database. ' + err});
      return;
    }
    if (posts.length==0) {
      res.json({error: 'There were no posts in the database.'});
      return;
    };
    res.json(posts);
  });
});
var fs = require('fs');
app.post('/post', checkSession, function(req, res) {
  if (!req.body.blog_text) {
    res.json({error: 'No text body, what to blog?'});
    return;
  }
  var target_path
  if (req.files.myFile) {
    // get the temporary location of the file
    var tmp_path = req.files.myFile.path;
    // set where the file should actually exists - in this case it is in the "images" directory
    target_path = 'public/uploaded_images/' + req.files.myFile.name;
    // move the file from the temporary location to the intended location
    fs.rename(tmp_path, target_path, function(err) {
        if (err) throw err;
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function() {
            if (err) throw err;
            //

        });
    });
    };
  var post = new Post({
    text: req.body.blog_text,
    author: app.get('post_author'),
    date: new Date().getTime(),
    image: target_path
  });

  post.save(function(err) {
    if (err) {
      res.json({error: 'There was a problem with saving your post to database. ' + err});
      return;
    }

    io.sockets.emit('new', {post: post});
    //res.redirect('/');
    res.json({success: 'Successfully saved post', post: post});
  });
});

app.delete('/post/:id', checkSession, function(req, res) {
  Post.findByIdAndRemove(req.params.id, function(err) {
    if (err) {
      res.json({error: 'There was a problem with deleting your post from the database. ' + err});
      return;
    }

    res.json({success: 'Successfully deleted post with id ' + req.params.id});

    io.sockets.emit('delete', {id: req.params.id});
  });
});

///////

function checkSession(req, res, next) {
    /*
      Very lame authentication system, yup.
    */

    if (req.query.secret == 'CBB1AEC6-DDD0-4C50-B409-F23AC289E825') {
      next();
    }

    else {
      res.json({error: "Not authenticated, sorry. You don't want to mess with our liveblog"});
      console.log("Not authenticated, sorry. You don't want to mess with our liveblog");
      return;
    }
}

var Post = mongoose.model('post', new mongoose.Schema({
  text: {type: String, required: true},
  author: {type: String, required: true},
  date: {type: Date, required: true},
  image: {type: String, required: false}
}));

// Wipeout Database

/*
Post.remove({}, function(err) { 
   console.log('collection removed') 
});
*/

///////

server.listen(app.get('port'), function(){
  console.log("Live listening on port " + app.get('port'));
});
