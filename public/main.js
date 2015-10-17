var socketUsername, socketColor;

// Converts username and color into a table row.
var rowify = function(username, color) {
  return '<tr id=\'' + username + '\'><td style=\'color: ' + color + '\'>' + username + '</td></tr>';
};

var setupCanvas = function(socket) {
  var canvas, context;
  var paint;
  var positionsX, positionsY, positionsDrag, colors;
  
  // Get drawings stored on the server.
  socket.emit('getCurrentCanvas');
  
  // Update your canvas.
  socket.on('handleCurrentCanvas', function(userStrokes) {
    positionsX = new Array();
    positionsY = new Array();
    positionsDrag = new Array();
    colors = new Array();
    for(var j = 0; j < userStrokes.length; j++) {
      var strokes = userStrokes[j];
      for(var i = 0; i < strokes.positions.length; i++) {
        positionsX.push(strokes.positions[i].x);
        positionsY.push(strokes.positions[i].y);
        positionsDrag.push(strokes.drags[i]);
        colors.push(strokes.colors[i]);
      }
    }
    draw();
  });

  // Draw strokes on canvas.
  var draw = function() {
    context.clearRect(0, 0, canvas[0].width, canvas[0].height);
    
    context.lineJoin = "round";
    context.lineWidth = 5;
    
    for(var i = 0; i < positionsX.length; i++) {		
      context.strokeStyle = colors[i];
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

  canvas = $('canvas');
  context = canvas[0].getContext('2d');
  canvas[0].width = canvas[0].offsetWidth;
  canvas[0].height = canvas[0].offsetHeight;
  
  // Mouse event handling.
  canvas.on('mousedown', function(event) {
    var offset = canvas.offset();
    var position = {x: event.pageX - offset.left,
                    y: event.pageY - offset.top};
                    
    paint = true;
    
    //Send server your strokes.
    socket.emit('addClick', position, false, socketColor);
  });
  
  canvas.on('mousemove', function(event) {
    if(paint) {
      var offset = canvas.offset();
      var position = {x: event.pageX - offset.left,
                      y: event.pageY - offset.top};
                      
      //Send server your strokes.
      socket.emit('addClick', position, true, socketColor);
    }
  });
  
  canvas.on('mouseup', function(event) {
    paint = false;
  });
  
  canvas.on('mouseleave', function(event) {
    paint = false;
  });
  
  var clearButton = $('button');
  
  clearButton.on('click', function() {
    socket.emit('clearCanvas');
  });
};

var setupTable = function(socket) {
  // Get current online users.
  socket.on('handleCurrentUsers', function(users, userColors) {
    $('table tr').slice(1).remove();
    var table = $('table');
    for(var i = 0; i < users.length; i++) {
      table.append(rowify(users[i], userColors[i]));
    }
  });
  
  // Prompt username.
  var username = prompt('Enter your username:');
  while(username.length == 0) {
    username = prompt('Enter your username:');
  }
  
  // Set username.
  socketUsername = username;
  
  // Send handleUsername to server.
  socket.emit('handleUsername', socketUsername, socketColor);
};

$(document).ready(function() {
  var socket = io();
  socketColor = '#' + Math.random().toString(16).substr(-6);
  setupCanvas(socket);
  setupTable(socket);
});