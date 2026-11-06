function Node(x ,y){
    this.f = 0; // the f cost of the node, f(n) = g(n) + h(n)
    this.g = 0; // the g cost of the node 
    this.h = 0; // the h cost of the node
    this.x = x; // horizontal position of the node 
    this.y = y; // vertical position of the node
    this.neighbors = []; // an array of neighbors of the node 
    this.previous = undefined; // declare the previous node 
    this.obstacles = false; // declare the obstacles
    this.room = undefined;
    this.fiveFloor = function(){
      if (x >= 18 && y <= 11) {
        this.obstacles = true;
    }

    if (y >=3 && y <=40) { // left rect
      if (x >=2 && x <=15) {
        this.obstacles = true;
      } else if (x == 16 && y >= 32) {
        this.obstacles = true;
      } 
    } 
  
    if (x >= 5 && x <= 16 && y >=41 && y <=51) { // left mid rect
        this.obstacles = true;
    }
  
    if (x >= 2 && x <= 15 && y >= 58 && y <= 70) { // left bottom rect
        this.obstacles = true;
    } 
    
    if (x >= 21) { // mid top & bottom rect
      if (y <= 31){
        this.obstacles = true;
      } else if (y==32) {
        if (x == 21 || x == 22 || x == 34 || x == 35 || x == 39 || x == 40 || x >52) {
            this.obstacles = true;
        }
      }
    }

    if (x >= 21 && x <= 33) { // mid mid 
        if (y <= 51 && y >=40) {
            this.obstacles = true;
        } else if ((x >= 23) && (y >= 37 && y <= 39)) {
            this.obstacles = true;
        }
    }

    if (y == 57 || y == 56){ // mid bottom small wall
      if (x == 16 || x == 15){
        this.obstacles = true;
      } else if (x == 21 || x == 22) {
        this.obstacles = true;
      } else if (x >= 33 && x <= 35) {
        this .obstacles = true;
      }
    }

    if (x >= 26 && x <= 36 && y >= 58 && y <= 68) { // mid bottom need to change maybe
        this.obstacles = true;
    } else if (x >= 30 && x <= 38 && y >= 69 && y <= 77) {
        this.obstacles = true;
    }

    

    if (y >= 37 && x >= 41) { // right rect
        this.obstacles = true; 
    }

    if (x == 40) { // right samll
        if ((y == 37 || y == 38) || (y == 50 || y == 51) || (y == 57 || y == 56)) {
            this.obstacles = true;
        }
    }
    }
    

    
    
    this.show_grid = function(color){
      fill(0, 0, 0, 0);
      if (this.obstacles){
        fill(0, 255, 255, 0);
      }
      stroke(color);
      rect(this.x*w, this.y*h, w - 1, h - 1);
    }
    
    this.show_node = function(color) {
      fill(color);
      noStroke();
      ellipse(this.x*w + w / 2, this.y*h + h / 2, w, w);
      //rect(this.x*w, this.y*h, w - 1, h - 1);
    }
  
    // adding neighbor of each node
    this.addNeighbors = function(grid) { 
      var i = this.x; // x asis of current node 
      var j = this.y; // y asis of current node 
  
      if (i < cols - 1){ // except the last row
        this.neighbors.push(grid[i + 1][j]); // add the right neighbors
      }
      if (i > 0){ // except the first colum
        this.neighbors.push(grid[i - 1][j]); // add the left neighbors 
      }
      if (j < rows - 1){ // except the last colum
        this.neighbors.push(grid[i][j + 1]); // add the bottom neighbors
      }
      if (j > 0){ // except the first row
        this.neighbors.push(grid[i][j - 1]); // add the top neighbors
      }
      if (i > 0 && j > 0) {
        this.neighbors.push(grid[i - 1][j - 1]); // add the upper left neighbors
      }
      if (i < cols - 1 && j > 0) {
        this.neighbors.push(grid[i + 1][j - 1]); // add the upper right neighbors
      }
      if (i > 0 && j < rows - 1) {
        this.neighbors.push(grid[i - 1][j + 1]); // add the lower left neighbors
      }
      if (i < cols - 1 && j < rows - 1) {
        this.neighbors.push(grid[i + 1][j + 1]); // add the lower right neighbors
      }
    }
  }
