var cols = 57; // number of colums of the grid
var rows = 93; // number of rows of the grid
var grid = new Array(cols);
var openSet = []; // an array contains all node that we will visit
var closedSet = []; // an array contains all node that we have visited
var start;
var end;
var w, h;
var path = [];
var img5f;
var img6f
var five = true;
var fiveFroomSet = {"501":[27, 56], "502":[40, 66], "503":[40, 47]
                    , "504":[40, 39], "505":[46, 32], "506":[36, 32]
                    , "507":[23, 32], "508":[16, 12], "509":[16, 21]
                    , "510":[16, 30], "escalator":[24, 36]
                  };

var sixFroomSet = {"601":[27, 56], "602":[40, 66], "603":[40, 47]
, "604":[40, 39], "605":[46, 32], "606":[36, 32]
, "607":[23, 32], "608":[16, 12], "609":[16, 21]
, "610":[16, 30], "escalator":[24, 36]
};

var selectStartIndex;
var selectEndIndex;
var current_floor;
var current_f
var startIn;
var endIn;

function preload(){
  img5f = loadImage('5floor_done_75.png');
  // img6f = loadImage("6Floor_done_75.png");
  img6f = loadImage("6Floor_done.png");
}


function run(){
  reset();
  loop();
}

// change to 5floor 2d map
function turn5f(){
  current_floor = "img5f";
  current_f = img5f
  image(current_f,0,0,width,height);
  reset();
  redraw();

}

// change to 6floor 2d map
function turn6f(){
  current_floor = "img6f";
  current_f = img6f
  image(current_f,0,0,width,height);
  reset();
  redraw();

}

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

function setup() {
  
  const fiveFloorBtn = select("#map_5f");
  const sixFloorBtn = select("#map_6f");

  fiveFloorBtn.mousePressed(turn5f); // if 5F button is clicked
  sixFloorBtn.mousePressed(turn6f); // if 6F button is clicked 

  selectStartIndex = fiveFroomSet[document.getElementById("start_input").value]; 
  selectEndIndex = fiveFroomSet[document.getElementById("end_input").value];

  var canvas = createCanvas(500, 900);
  current_f = img5f;
  current_floor = "img5f"

  var mapContainer = document.getElementById('mapcontainer');
  canvas.parent(mapContainer);
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
      grid[i][j].fiveFloor();
    }
  }
  
  // adding neighbors for every node
  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {
      grid[i][j].addNeighbors(grid);
    }
  }
  
  start = grid[23][37]; // define the starting point
  end = grid[23][37]; // define the ending point

  openSet.push(start);
  noLoop();
}
  
function reset(){
  openSet = []; // an array contains all node that we will visit
  closedSet = []; // an array contains all node that we have visited
  path = [];
  for (var i = 0; i < cols; i++) {
    grid[i] = new Array(rows);
  }
  
  // creating node for each gird
  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {
      grid[i][j] = new Node(i, j);
      // grid[i][j].fiveFloor();
      grid[i][j].delObstacles;
      if (current_floor == "img5f"){
        grid[i][j].fiveFloor();
      }else if (current_floor == "img6f"){
        grid[i][j].sixFloor();
      }
    }
  }
  
  // adding neighbors for every node
  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {
      grid[i][j].addNeighbors(grid);
    }
  }
  startIn = document.getElementById("start_input").value; 
  endIn = document.getElementById("end_input").value; 

  if ((startIn in fiveFroomSet || startIn in sixFroomSet) && (endIn in fiveFroomSet || endIn in sixFroomSet)){ // check the input value
    if (current_floor == "img5f"){ // user stay on 5F
      if (startIn in sixFroomSet && endIn in sixFroomSet) { // 6xx to 6xx
        // still need to do
        selectStartIndex = fiveFroomSet["escalator"]; 
        selectEndIndex = fiveFroomSet["escalator"];

      }else if (endIn in sixFroomSet){ // 5xx to 6xx
        selectStartIndex = fiveFroomSet[startIn]; 
        selectEndIndex = fiveFroomSet["escalator"];

      }else if (startIn in sixFroomSet){ // 6xx to 5xx 
        selectStartIndex = fiveFroomSet["escalator"]; 
        selectEndIndex = fiveFroomSet[endIn];

      }else{ // 5xx to 5xx
        selectStartIndex = fiveFroomSet[startIn]; 
        selectEndIndex = fiveFroomSet[endIn];

      }
    }else if (current_floor =="img6f"){ // user stay on 6F
      if (startIn in fiveFroomSet && endIn in fiveFroomSet){ // 5xx to 5xx
        // still need to do
        selectStartIndex = sixFroomSet["escalator"]; 
        selectEndIndex = sixFroomSet["escalator"];

      }else if (endIn in fiveFroomSet){ // 6xx to 5xx
        selectStartIndex = sixFroomSet[startIn]; 
        selectEndIndex = sixFroomSet["escalator"];

      }else if (startIn in fiveFroomSet){ // 5xx to 6xx 
        selectStartIndex = sixFroomSet["escalator"]; 
        selectEndIndex = sixFroomSet[endIn];

      }else{ // 6xx to 6xx
        selectStartIndex = sixFroomSet[startIn]; 
        selectEndIndex = sixFroomSet[endIn];
      }
    } 
  }else{
    console.log("error"); // change the reminder of error
    selectStartIndex = fiveFroomSet["escalator"]
    selectEndIndex = fiveFroomSet["escalator"]
  }

  // selectStartIndex = fiveFroomSet[document.getElementById("start_input").value]; 
  // selectEndIndex = fiveFroomSet[document.getElementById("end_input").value];

  start = grid.at(selectStartIndex[0]).at(selectStartIndex[1]); // define the starting point
  end = grid.at(selectEndIndex[0]).at(selectEndIndex[1]); // define the ending point
  console.log(start);
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

  image(current_f,0,0,width,height);
  
  // showing grid
  // for (var i = 0; i < cols; i++) {
  //   for (var j = 0; j < rows; j++) {
  //     grid[i][j].show_grid(color(0));
  //   }
  // }
  
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
      // console.log('x:'+path[i].x);
      // console.log(', y:'+path[i].y);
      // console.log('\n');
    }
    endShape();
    start.show_node('green');
    end.show_node('red');
    //grid[24][36].show_node('red');
  }
}
