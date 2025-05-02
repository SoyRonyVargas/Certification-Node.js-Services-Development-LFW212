var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var helloRouter = require('./routes/hello');
var articlesRouter = require('./routes/articles');
const stream = require('./utils/data');
const finished = require('stream').finished;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

app.use('/', indexRouter);
// app.use('/', (req,res) => {
//   res.render('me', {
//     layout: 'layout' // usará views/layouts/otro-layout.handlebars
//   })
// });

app.use('/data', (req, res, next) => {
  const streamData = stream();

  res.type('html'); // opcional: para indicar que es texto HTML

  streamData.pipe(res, { end: false });

  finished(streamData, (err) => {
    if (err) {
      return next(err);
    }
    res.end();
  });
});

app.use('/hello', helloRouter);
app.use('/articles', articlesRouter);


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
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
