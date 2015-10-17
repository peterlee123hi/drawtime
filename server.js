var http = require('http');
var express = require('express');
var socket_io = require('socket.io');

var app = express();
app.use(express.static('public'));

var server = http.Server(app);
var io = socket_io(server);

var usernames = new Array();
var userColors = new Array();

var positions = new Array();
var drags = new Array();
var colors = new Array();

io.on('connection', function(socket) {
  socket.on('handleUsername', function(name, color) {
    usernames.push(name);
    userColors.push(color);
    socket.username = name;
    socket.color = color;
    io.emit('handleCurrentUsers', usernames, userColors);
  });
  
  socket.on('getCurrentUsers', function() {
    socket.emit('handleCurrentUsers', usernames, userColors);
  });
  
  socket.on('getCurrentCanvas', function() {
    socket.emit('handleCurrentCanvas', positions, drags, colors);
  });

  socket.on('draw', function(position, drag, color) {
    positions.push(position);
    drags.push(drag);
    colors.push(color);
    socket.broadcast.emit('draw', position, drag, color);
  });
  
  socket.on('clearCanvas', function() {
    positions = new Array();
    drags = new Array();
    colors = new Array();
    io.emit('clearCanvas');
  });
  
  socket.on('disconnect', function() {
    if(socket.username === undefined) {
      return null;
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