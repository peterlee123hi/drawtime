var rowify = function(username) {
  return '<tr id=\'' + username + '\'><td>' + username + '</td></tr>';
};

var setupCanvas = function(socket) {
  var canvas, context;
  var paint;
  var positionsX = new Array();
  var positionsY = new Array();
  var positionsDrag = new Array();
  
  socket.emit('getCurrentCanvas');
  socket.on('handleCurrentCanvas', function(positions, drags) {
      for(var i = 0; i < positions.length; i++) {
        positionsX.push(positions[i].x);
        positionsY.push(positions[i].y);
        positionsDrag.push(drags[i]);
      }
      draw();
  });

  var draw = function() {
    context.clearRect(0, 0, canvas[0].width, canvas[0].height);
    
    // Change to color of user.
    context.strokeStyle = "#222";
    context.lineJoin = "round";
    context.lineWidth = 5;
    
    for(var i = 0; i < positionsX.length; i++) {		
      context.beginPath();
      
      if(positionsDrag[i] && i){
        context.moveTo(positionsX[i-1], positionsY[i-1]);
      } else {
        context.moveTo(positionsX[i]-1, positionsY[i]);
      }
      
      context.lineTo(positionsX[i], positionsY[i]);
      context.closePath();
      context.stroke();
    }
  };
  
  var addClick = function(x, y, drag) {
    positionsX.push(x);
    positionsY.push(y);
    positionsDrag.push(drag);
  };

  canvas = $('canvas');
  context = canvas[0].getContext('2d');
  canvas[0].width = canvas[0].offsetWidth;
  canvas[0].height = canvas[0].offsetHeight;
  
  canvas.on('mousedown', function(event) {
    var offset = canvas.offset();
    var position = {x: event.pageX - offset.left,
                    y: event.pageY - offset.top};
                    
    paint = true;
    addClick(position.x, position.y, false);
    draw();
    socket.emit('draw', position, false);
  });
  
  canvas.on('mousemove', function(event) {
    if(paint) {
      var offset = canvas.offset();
      var position = {x: event.pageX - offset.left,
                      y: event.pageY - offset.top};
      addClick(position.x, position.y, true);
      draw();
      socket.emit('draw', position, true);
    }
  });
  
  canvas.on('mouseup', function(event) {
    paint = false; 
  });
  
  canvas.on('mouseleave', function(event) {
    paint = false;
  });
  
  socket.on('draw', function(position, drag) {
    addClick(position.x, position.y, drag);
    draw();
  });
  
  var clearButton = $('button');
  
  clearButton.on('click', function() {
    socket.emit('clearCanvas');    
  });
  
  socket.on('clearCanvas', function() {
    positionsX = new Array();
    positionsY = new Array();
    positionsDrag = new Array();
    draw();
  });
};

var setupTable = function(socket) {
  socket.emit('getCurrentUsers');
  
  socket.on('handleCurrentUsers', function(users) {
    $('table tr').slice(1).remove();
    var table = $('table');
    for(var i = 0; i < users.length; i++) {
      table.append(rowify(users[i]));
    }
  });
  
  // Prompt username.
  var username = prompt('Enter your username:');
  while(username.length == 0) {
    username = prompt('Enter your username:');
  }
  
  // Set username.
  socket.username = username;
  
  // Send handleUsername to server.
  socket.emit('handleUsername', username);
};

$(document).ready(function() {
  var socket = io();
  setupCanvas(socket);
  setupTable(socket);
  
  window.onbeforeunload = function(e) {
    if(socket.hasOwnProperty('username')) {
      socket.emit('removeUser', socket.username);
    }
  };
});