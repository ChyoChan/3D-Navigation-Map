function Node(x, y) {
	this.f = 0; // the f cost of the node, f(n) = g(n) + h(n)
	this.g = 0; // the g cost of the node 
	this.h = 0; // the h cost of the node
	this.x = x; // horizontal position of the node 
	this.y = y; // vertical position of the node
	this.neighbors = []; // an array of neighbors of the node 
	this.previous = undefined; // declare the previous node 
	this.obstacles = false; // declare the obstacles

	this.fiveFloor = function () {

		if (x >= 0 && y >= 0) {
			this.obstacles = true;
		}

		if (x == 18 && y >= 12) { // for first col road 
			this.obstacles = false;
		}

		if ((x == 16 || x == 17) && (y == 12 || y == 20 || y == 30)) { // for 508, 509 and 510
			this.obstacles = false;
		}

		if (x >= 18 && x <= 46 && y == 34) { // for first row road
			this.obstacles = false
		}

		if ((x == 23 || x == 36 || x == 46) & (y >= 32 && y <= 34)) { // for 507, 506 and 505
			this.obstacles = false
		}

		if (x == 38 && y >= 35) { // for the second col road
			this.obstacles = false;
		}

		if ((x == 39 || x == 40) && (y == 39 || y == 47 || y == 66)) { // for 504, 503 and 502
			this.obstacles = false;
		}

		if (x >= 18 && x <= 38 && y == 55) { // for second row road
			this.obstacles = false;
		}

		if (x == 27 && y >= 52 && y <= 56) { // for 501
			this.obstacles = false;
		}
		if (x == 17 && (y == 34 || y == 40 || y == 37)){ // for toilets
			this.obstacles = false;
		}
		if (x >= 10 && x <=18 && y == 52){ // for elevator
			this.obstacles = false;
		}
	}

	this.sixFloor = function () {


		if (x >= 0 && y >= 0) {
			this.obstacles = true;
		}

		if (x == 18 && y >= 12) { // for first col road 
			this.obstacles = false;
		}

		if ((x == 16 || x == 17) && (y == 12 || y == 20 || y == 30)) { // for 609, 610,611
			this.obstacles = false;
		}

		if (x >= 18 && x <= 46 && y == 34) { // for first row road
			this.obstacles = false
		}

		if ((x == 23 || x == 36 || x == 46) & (y >= 32 && y <= 34)) { // for 608, 607 and 606
			this.obstacles = false
		}

		if (x == 38 && y >= 35) { // for the second col road
			this.obstacles = false;
		}

		if ((x == 39 || x == 40) && (y == 39 || y == 47 || y == 66)) { // for 605, 604 and 603
			this.obstacles = false;
		}

		if (x >= 18 && x <= 38 && y == 55) { // for second row road
			this.obstacles = false;
		}
		if (x == 23 & (y == 35 || y == 36)){ // for escalator 
			this.obstacles = false;
		}
		if (x == 27 && y == 56) { // for 602
			this.obstacles = false;
		}

		if ((x == 23 || x == 24) && y == 37) { // for escalator 
			this.obstacles = false;
		}
		if (x == 17 && (y == 34 || y == 40 || y == 37)){ // for toilets
			this.obstacles = false;
		}
		if (x >= 10 && x <=18 && y == 52){ // for elevator 
			this.obstacles = false;
		}
		if ((x >= 4 && x <= 18 && y == 55) || (x == 4 && y == 56)){ //for 601
			this.obstacles = false;
		}

		if (x == 10 && (y==53||y==54)){ // for connect 601 and elevator
			this.obstacles = false;
		}


	}

	this.show_grid = function (color,changeX,changeY) {
		fill(0, 0, 0, 0);
		stroke(color);
		if (this.obstacles) {
			fill(255, 255, 255, 1);
			stroke("lightblue")
		}
		rect(this.x * w+changeX, this.y * h+changeY, w - 1, h - 1);
	}

	this.show_node = function (color,changeX,changeY) {
		fill(color);
		noStroke();
		ellipse(this.x * w + w / 2+changeX, this.y * h + h / 2+changeY, w, w);
		// rect(this.x*w, this.y*h, w - 1, h - 1);
	}

	// adding neighbor of each node
	this.addNeighbors = function (grid) {
		var i = this.x; // x asis of current node 
		var j = this.y; // y asis of current node 

		if (i < cols - 1) { // except the last row
			this.neighbors.push(grid[i + 1][j]); // add the right neighbors
		}
		if (i > 0) { // except the first colum
			this.neighbors.push(grid[i - 1][j]); // add the left neighbors 
		}
		if (j < rows - 1) { // except the last colum
			this.neighbors.push(grid[i][j + 1]); // add the bottom neighbors
		}
		if (j > 0) { // except the first row
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
