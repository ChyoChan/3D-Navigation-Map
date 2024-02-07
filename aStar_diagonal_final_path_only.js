function removeFromArray(arr, elt) {
  for (var i = arr.length - 1; i >= 0; i--) {
    if (arr[i] == elt) {
      arr.splice(i, 1);
    }
  }
}


function heuristic(nodeA, nodeB) {
  return dist(nodeA.x, nodeA.y, nodeB.x, nodeB.y);
}


var cols = 57; // number of colums of the grid
var rows = 93; // number of rows of the grid
var grid = new Array(cols);
var openSet = []; // an array contains all node that we will visit
var closedSet = []; // an array contains all node that we have visited
var start;
var end;
var w, h;
var path = [];
var img;

function setup() {
  var roomSet = {"501":[27, 56], "502":[40, 66], "503":[40, 47]
             , "504":[40, 39], "505":[46, 32], "506":[36, 32]
             , "507":[23, 32], "508":[16, 12], "509":[16, 21]
             , "510":[16, 30], "escalator":[24, 36]};
  var selectStartIndex = roomSet[document.getElementById("start").value]; 
  var selectEndIndex = roomSet[document.getElementById("end").value];
  console.log(selectStartIndex);
  console.log(selectEndIndex);


  img = loadImage('5floor_done_75.png');
  createCanvas(1144, 1866);
  w = width / cols; // width of each node 
  h = height / rows; // height of each 
  
  // Making an 2D array
  for (var i = 0; i < cols; i++) {
    grid[i] = new Array(rows);
  }
  
  // creating node for each gird
  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {
      grid[i][j] = new Node(i, j);
    }
  }
  
  // adding neighbors for every node
  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {
      grid[i][j].addNeighbors(grid);
    }
  }
  
  start = grid.at(selectStartIndex[0]).at(selectStartIndex[1]); // define the starting point
  end = grid.at(selectEndIndex[0]).at(selectEndIndex[1]); // define the ending point
  

  openSet.push(start);
}
  



function draw() { // if will self-loopping automatically by the p5.js
  var displayPath = false;
  if (openSet.length > 0) { 
    var lowestCost = 0;
    for (var i = 0; i < openSet.length; i++) { // finding a node that having a lowest f cost inside the openSet
      if (openSet[i].f < openSet[lowestCost].f) { 
        lowestCost = i;
      }
    }
    
    var current = openSet[lowestCost]; // define the current node
  
    if (current === end) {
      displayPath = true;
      console.log("DONE!");
      noLoop();
    }

    removeFromArray(openSet, current); // remove the node that we just visited from the openSet
    closedSet.push(current); // add the node that we just visited to the closedSet

    var neighbors = current.neighbors; // define all neighbors of current node 

    for (var i = 0; i < neighbors.length; i++) { // checking all neighbor
      var neighbor = neighbors[i]; // getting one of the neighbor

      if (!closedSet.includes(neighbor) && !neighbor.obstacles) { // checking the neighbor is not in the closedSet, that means the neighbor we have not handle 
        var tempG = current.g + heuristic(neighbor, current);
        var newPath = false;
        if (openSet.includes(neighbor)) {
          if (tempG < neighbor.g) {
            neighbor.g = tempG; // update the lowest g cost of neighbor
            newPath = true;
          }
        } else {
          neighbor.g = tempG; // update the lowest g cost of neighbor
          newPath = true;
          openSet.push(neighbor); // we will evaluate that neighbor
        }

        if (newPath) {
          neighbor.h = heuristic(neighbor, end); // getting the distance between the neighbor and the end 
          neighbor.f = neighbor.h + neighbor.g; // update the f cost, f(n) = g(n) + h(n)
          neighbor.previous = current; // define the previous node of nieghbor, for finding path
        }
        
      }
    }
  } else {
    console.log('no solution');
    noLoop();
    return;
  }

  background(img);
  
  // showing grid
  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {
      grid[i][j].show_grid(color(0));
    }
  }
  
  /*for (var i = 0; i < closedSet.length; i++) {
    closedSet[i].show(color(255, 0, 0));
  }

  for (var i = 0; i < openSet.length; i++) {
    openSet[i].show(color(0, 255, 0));
  }*/

  path = [];
  var temp = current;
  path.push(temp);
  while (temp.previous) { // Backtrace the path from the end point
    path.push(temp.previous);
    temp = temp.previous;
  }
  // display the path
  
  
  if (displayPath) {
    noFill();
    stroke('blue');
    strokeWeight(w / 4);
    beginShape();
    for (var i = 0; i < path.length; i++) {
      vertex(path[i].x * w + w / 2, path[i].y * h + h / 2);
    }
    endShape();
    start.show_node('green');
    end.show_node('red');
    //grid[24][36].show_node('red');
  }
}
