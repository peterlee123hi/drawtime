/* TODO
 * 1. Add collaborative drawing.
 * 2. Add username handling.
 * 3. Add color handling.
 */

var http = require('http');
var express = require('express');
var socket_io = require('socket.io');

var app = express();
app.use(express.static('public'));

var server = http.Server(app);
var io = socket_io(server);

var usernames = new Array();

var positions = new Array();
var drags = new Array();

io.on('connection', function(socket) {
  socket.on('handleUsername', function(name) {
    usernames.push(name);
    io.emit('handleCurrentUsers', usernames);
  });
  
  socket.on('getCurrentUsers', function() {
    socket.emit('handleCurrentUsers', usernames);
  });
  
  socket.on('getCurrentCanvas', function() {
    socket.emit('handleCurrentCanvas', positions, drags);
  });

  socket.on('draw', function(position, drag) {
    positions.push(position);
    drags.push(drag);
    socket.broadcast.emit('draw', position, drag);
  });
  
  socket.on('clearCanvas', function() {
    positions = new Array();
    drags = new Array();
    io.emit('clearCanvas');
  });
  
  socket.on('removeUser', function(name) {
    var index = usernames.indexOf(name);
    if(index > -1) {
      usernames.splice(index, 1);
    }
    io.emit('handleCurrentUsers', usernames);
  });
});

server.listen(8080);