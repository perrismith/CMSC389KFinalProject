var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var dataUtil = require("./data-util");
var _ = require("underscore");
var logger = require('morgan');
var exphbs = require('express-handlebars');
var handlebars = exphbs.handlebars;
var moment = require('moment');
var marked = require('marked');
var app = express();
var PORT = 8000;

var http = require('http').Server(app);
var io = require('socket.io')(http);
const users = {};

var _DATA = dataUtil.loadData().blog_posts;


/// MIDDLEWARE
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('handlebars', exphbs({ defaultLayout: 'main', partialsDir: "views/partials/" }));
app.set('view engine', 'handlebars');
app.use('/public', express.static('public'));
app.use('/images', express.static('images'));
app.use('/fonts', express.static('fonts'));
app.use('/script.js', express.static('script.js'));
app.use('/socket.io/socket.io.js', express.static('socket.io/socket.io.js'));


/****************************
        HELPER FUNCTIONS
****************************/


/****************************
          WEBSITE
****************************/

app.get("/", function(req, res) {
    var tags = dataUtil.getAllTags(_DATA);
    res.render('home', {
        data: _DATA,
        tags: tags
    });
});

app.get("/album/:album_name", function(req, res) {
    var tags = dataUtil.getAllTags(_DATA);
		res.render('album', {
        data: _DATA,
        tags: tags
    });
});

app.get("/genres", function(req, res) {
    var tags = dataUtil.getAllTags(_DATA);
		res.render('genres', {
        data: _DATA,
        tags: tags
    });
});

app.get("/charts", function(req, res) {
    var tags = dataUtil.getAllTags(_DATA);
		res.render('charts', {
        data: _DATA,
        tags: tags
    });
});

app.get("/submit", function(req, res) {
    var tags = dataUtil.getAllTags(_DATA);
		res.render('submit', {
        data: _DATA,
        tags: tags
    });
});

app.get("/chat", function(req, res) {
    var tags = dataUtil.getAllTags(_DATA);
        res.render('socket', {
        data: _DATA,
        tags: tags
    });
});


app.get("/members", function(req, res) {
    var tags = dataUtil.getAllTags(_DATA);
    res.render('members', {
        data: _DATA,
        tags: tags
    });
});

app.get('/tag/:tag', function(req, res) {
    var tags = dataUtil.getAllTags(_DATA);
    var tag = req.params.tag;
    var posts = [];
    _DATA.forEach(function(post) {
        if (post.tags.includes(tag)) {
            posts.push(post);
        }
    });
    res.render('home', {
        tag: tag,
        data: posts,
        tags: tags
    });
});

/****************************
            API
****************************/

app.get("/create", function(req, res) {
    res.render('create');
});

app.post('/create', function(req, res) {
    var body = req.body;

    // Transform tags and content
    body.tags = body.tags.split(" ");
    body.content = marked(body.content);

    // Add time and preview
    body.preview = body.content.substring(0, 300);
    body.time = moment().format('MMMM Do YYYY, h:mm a');

    // Save new blog post
    _DATA.push(req.body);
    dataUtil.saveData(_DATA);
    res.redirect("/");
});

app.get('/post/:slug', function(req, res) {
    var _slug = req.params.slug;
    var blog_post = _.findWhere(_DATA, { slug: _slug });
    if (!blog_post) return res.render('404');
    res.render('post', blog_post);
});



/****************************
          RUN
****************************/

// Start listening on port PORT
//app.listen(PORT, function() {
//    console.log('Server listening on port:', PORT);
//});

// HEROKU
app.listen(process.env.PORT || 3000, function() {
    console.log('Listening!');
});

io.on('connection', socket => {
    socket.on('new-user', name => {
      users[socket.id] = name
      socket.broadcast.emit('user-connected', name)
    })
    socket.on('send-chat-message', message => {
      socket.broadcast.emit('chat-message', { message: message, name: users[socket.id] })
    })
    socket.on('disconnect', () => {
      socket.broadcast.emit('user-disconnected', users[socket.id])
      delete users[socket.id]
    })
})