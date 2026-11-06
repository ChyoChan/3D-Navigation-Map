function removeFromArray(arr, elt) {
  for (var i = arr.length - 1; i >= 0; i--) {
    if (arr[i] == elt) {
      arr.splice(i, 1);
    }
  }
}

function heuristic(nodeA, nodeB) {
  //return dist(nodeA.x, nodeA.y, nodeB.x, nodeB.y);
  return abs(nodeA.x - nodeB.x) + abs(nodeA.y - nodeB.y)
}

var cols = 10; // number of colums of the grid
var rows = 10; // number of rows of the grid
var grid = new Array(cols);
var openSet = []; // an array contains all node that we will visit
var closedSet = []; // an array contains all node that we have visited
var start;
var end;
var w, h;
var path = [];
var noSolution = false;

function Node(x ,y){
  this.f = 0; // the f cost of the node, f(n) = g(n) + h(n)
  this.g = 0; // the g cost of the node 
  this.h = 0; // the h cost of the node
  this.x = x; // horizontal position of the node 
  this.y = y; // vertical position of the node
  this.neighbors = []; // an array of neighbors of the node 
  this.previous = undefined; // declare the previous node 
  this.obstacles = false; // declare the obstacles

  if (random(1) < 0.3) {
    this.obstacles = true; // making obstacles randomly with probability 1/10
  }

  this.show = function(color){
    fill(color);
    if (this.obstacles) {
      fill(0);
    }
    noStroke();
    rect(this.x*w, this.y*h, w - 1, h - 1);
  }
  
  // adding neighbor of each node
  this.addNeighbors = function(grid) { 
    var i = this.x; // x asis of current node 
    var j = this.y; // y asis of current node 

    if (i < cols-1){ // except the last row
      this.neighbors.push(grid[i+1][j]); // add the right node
    }

    if (i > 0){ // except the first colum
      this.neighbors.push(grid[i-1][j]); // add the left node 
    }

    if (j < rows-1){ // except the last colum
      this.neighbors.push(grid[i][j+1]); // add the bottom node
    }

    if (j > 0){ // except the first row
      this.neighbors.push(grid[i][j-1]); // add the top node
    }
  }
}

function setup() {
  createCanvas(800, 800);

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
  
  start = grid[0][0]; // define the starting point
  end = grid[cols - 1][rows - 1]; // define the ending point
  start.obstacles = false; // the starting point never be obstacles
  end.obstacles = false; // the ending point never be obstacles

  openSet.push(start);
}
  
function draw() { // if will self-loopping automatically by the p5.js
  if (openSet.length > 0) { 
    var lowestCost = 0;
    for (var i = 0; i < openSet.length; i++) { // finding a node that having a lowest f cost inside the openSet
      if (openSet[i].f < openSet[lowestCost].f) { 
        lowestCost = i;
      }
    }
    
    var current = openSet[lowestCost]; // define the current node
  
    if (current === end) {
      
      console.log("DONE!");
      noLoop();
    }

    removeFromArray(openSet, current); // remove the node that we just visited from the openSet
    closedSet.push(current); // add the node that we just visited to the closedSet

    var neighbors = current.neighbors; // define all neighbors of current node 

    for (var i = 0; i < neighbors.length; i++) { // checking all neighbor
      var neighbor = neighbors[i]; // getting one of the neighbor

      if (!closedSet.includes(neighbor) && !neighbor.obstacles) { // checking the neighbor is not in the closedSet, that means the neighbor we have not handle 
        var tempG = current.g + 1;
  
        if (openSet.includes(neighbor)) {
          if (tempG < neighbor.g) {
            neighbor.g = tempG; // update the lowest g cost of neighbor
          }
        } else {
          neighbor.g = tempG; // update the lowest g cost of neighbor
          openSet.push(neighbor); // we will evaluate that neighbor
        }

        neighbor.h = heuristic(neighbor, end); // getting the distance between the neighbor and the end 
        neighbor.f = neighbor.h + neighbor.g; // update the f cost, f(n) = g(n) + h(n)
        neighbor.previous = current; // define the previous node of nieghbor, for finding path
      }
    }
  } else {
    console.log('no solution');
    noSolution = true;
    noLoop();
    return;
  }

  background(0);
  
  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {
      grid[i][j].show(color(255));
    }
  }
  
  for (var i = 0; i < closedSet.length; i++) {
    closedSet[i].show(color(255, 0, 0));
  }

  for (var i = 0; i < openSet.length; i++) {
    openSet[i].show(color(0, 255, 0));
  }

  if (!noSolution){
    path = [];
    var temp = current;
    path.push(temp);
    while (temp.previous) { // Backtrace the path from the end point
      path.push(temp.previous);
      temp = temp.previous;
    }
  }
  // display the path
  for (var i = 0; i < path.length; i++){ 
    path[i].show(color(0, 0, 255));
  }
  
}