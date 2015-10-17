var socketUsername, socketColor;

// Converts username and color into a table row.
var rowify = function(username, color) {
  return '<tr id=\'' + username + '\'><td style=\'color: ' + color + '\'>' + username + '</td></tr>';
};

var setupCanvas = function(socket) {
  var canvas, context;
  var paint;
  var positionsX = new Array();
  var positionsY = new Array();
  var positionsDrag = new Array();
  var colors = new Array();
  
  // Get drawings stored on the server.
  socket.emit('getCurrentCanvas');
  socket.on('handleCurrentCanvas', function(positions, drags, clrs) {
      for(var i = 0; i < positions.length; i++) {
        positionsX.push(positions[i].x);
        positionsY.push(positions[i].y);
        positionsDrag.push(drags[i]);
        colors.push(clrs[i]);
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
  
  // Add a stroke for the draw function to draw.
  var addClick = function(x, y, drag, c) {
    positionsX.push(x);
    positionsY.push(y);
    positionsDrag.push(drag);
    colors.push(c);
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
    addClick(position.x, position.y, false, socketColor);
    draw();
    socket.emit('draw', position, false, socketColor);
  });
  
  canvas.on('mousemove', function(event) {
    if(paint) {
      var offset = canvas.offset();
      var position = {x: event.pageX - offset.left,
                      y: event.pageY - offset.top};
      addClick(position.x, position.y, true, socketColor);
      draw();
      socket.emit('draw', position, true, socketColor);
    }
  });
  
  canvas.on('mouseup', function(event) {
    paint = false; 
  });
  
  canvas.on('mouseleave', function(event) {
    paint = false;
  });
  
  // Draw the strokes of other users.
  socket.on('draw', function(position, drag, color) {
    addClick(position.x, position.y, drag, color);
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
    colors = new Array();
    draw();
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