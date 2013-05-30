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
  app.set('port', process.env.PORT || 3000);
  app.set('post_author', 'Mert Dümenci');
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

mongoose.connect('localhost', 'live');

///////

app.get('/', function(req, res) {
    res.render('feed');
});

app.get('/post', function(req, res) {
  Post.find({}, function(err, posts) {
    if (err) {
      res.json({error: 'There was a problem with fetching posts from the database. ' + err});
      return;
    }

    res.json(posts);
  });
});

app.post('/post', checkSession, function(req, res) {
  if (!req.body.text) {
    res.json({error: 'No text body, what to blog?'});
    return;
  }

  var post = new Post({
    text: req.body.text,
    author: app.get('post_author'),
    date: new Date().getTime()
  });

  post.save(function(err) {
    if (err) {
      res.json({error: 'There was a problem with saving your post to database. ' + err});
      return;
    }

    io.sockets.emit('new', {post: post});

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
      return;
    }
}

var Post = mongoose.model('post', new mongoose.Schema({
  text: {type: String, required: true},
  author: {type: String, required: true},
  date: {type: Date, required: true}
}));

///////

server.listen(app.get('port'), function(){
  console.log("Live listening on port " + app.get('port'));
});
