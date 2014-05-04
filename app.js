/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var HistoryRoutes = require('./routes/history');
var PlayerRoutes = require('./routes/players');
var TribeRoutes = require('./routes/tribes');
var game = require('./routes/game');
var http = require('http');
var path = require('path');
var config = require('./config');
var passport = require('passport');
var GoogleStrategy = require('passport-google').Strategy;

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser());
app.use(express.session({ secret: config.secret }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

passport.serializeUser(function (user, done) {
    done(null, '1');
});

passport.deserializeUser(function (id, done) {
    done(null, id);
});

passport.use(new GoogleStrategy({
        returnURL: 'http://localhost:3000/auth/google/return',
        realm: 'http://localhost:3000/'
    },
    function (identifier, profile, done) {
        done(null, {id: '1'});
    }
));

app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/return',
    passport.authenticate('google', { successRedirect: '/',
        failureRedirect: '/auth/google'  }));

var tribes = new TribeRoutes(config.mongoUrl);
app.get('/', routes.index);
app.get('/api/tribes', tribes.list);
app.post('/api/tribes', tribes.save);
app.post('/api/:tribeId/game', game(config.mongoUrl));

var history = new HistoryRoutes(config.mongoUrl);
var historyRoute = '/api/:tribeId/history';
app.get(historyRoute, history.list);
app.post(historyRoute, history.savePairs);
app.delete(historyRoute + '/:id', history.deleteMember);

var players = new PlayerRoutes(config.mongoUrl);

app.get('/api/:tribeId/players', players.listTribeMembers);
app.post('/api/:tribeId/players', players.savePlayer);
app.delete('/api/:tribeId/players/:playerId', players.removePlayer);

app.get('/partials/:name', routes.partials);
app.get('*', routes.index);

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
