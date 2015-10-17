var http = require('http');
var express = require('express');
var socket_io = require('socket.io');

var app = express();
app.use(express.static('public'));

var server = http.Server(app);
var io = socket_io(server);

var usernames = new Array();
var userColors = new Array();

var history = {
  positions: new Array(),
  drags: new Array(),
  colors: new Array()
};

io.on('connection', function(socket) {
  socket.on('handleUsername', function(name, color) {
    usernames.push(name);
    userColors.push(color);
    socket.username = name;
    socket.color = color;
    socket.strokes = {
      positions: new Array(),
      drags: new Array(),
      colors: new Array()
    };
    io.emit('handleCurrentUsers', usernames, userColors);
  });
  
  socket.on('getCurrentUsers', function() {
    socket.emit('handleCurrentUsers', usernames, userColors);
  });
  
  socket.on('getCurrentCanvas', function() {
    var userStrokes = new Array();
    var scks = io.sockets.sockets;
    for(var i = 0; i < scks.length; i++) {
      if(scks[i].strokes !== undefined) {
        userStrokes.push(scks[i].strokes);
      }
    }
    userStrokes.push(history);
    socket.emit('handleCurrentCanvas', userStrokes);
  });
  
  socket.on('addClick', function(position, drag, socketColor) {
    socket.strokes.positions.push(position);
    socket.strokes.drags.push(drag);
    socket.strokes.colors.push(socketColor);
    var userStrokes = new Array();
    var scks = io.sockets.sockets;
    for(var i = 0; i < scks.length; i++) {
      if(scks[i].strokes !== undefined) {
        userStrokes.push(scks[i].strokes);
      }
    }
    userStrokes.push(history);
    io.emit('handleCurrentCanvas', userStrokes);
  });
  
  socket.on('clearCanvas', function() {
    var userStrokes = new Array();
    var scks = io.sockets.sockets;
    for(var i = 0; i < scks.length; i++) {
      scks[i].strokes = {
        positions: new Array(),
        drags: new Array(),
        colors: new Array()
      };
      userStrokes.push(scks[i].strokes);
    }
    history = {
      positions: new Array(),
      drags: new Array(),
      colors: new Array()
    };
    io.emit('handleCurrentCanvas', userStrokes);
  });
  
  socket.on('disconnect', function() {
    if(socket.username === undefined) {
      return null;
    }
    for(var i = 0; i < socket.strokes.positions.length; i++) {
      history.positions.push(socket.strokes.positions[i]);
      history.drags.push(socket.strokes.drags[i]);
      history.colors.push(socket.strokes.colors[i]);
    }
    var index = usernames.indexOf(socket.username);
    if(index > -1) {
      usernames.splice(index, 1);
      userColors.splice(index, 1);
    }
    io.emit('handleCurrentUsers', usernames, userColors);
  });
});

server.listen(8080);