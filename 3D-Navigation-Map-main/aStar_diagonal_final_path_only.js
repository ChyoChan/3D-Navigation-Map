let scales = 1;
let canvasWidth = 1000;
let canvasHeight = 1800;
var a = 0;
var b = 0;
var cols = 57; // number of colums of the grid
var rows = 93; // number of rows of the grid
var grid = new Array(cols);
var openSet = []; // an array contains all node that we will visit
var closedSet = []; // an array contains all node that we have visited
var start; // the starting point 
var end; // the ending point 
var w, h; // width and hieght of each grid
var path = [];
var img5f;
var img6f;
var wrongFloor;
let sameFloor = false;
let displayPath = false;
let done = true;
let threeDActive = false;
let displaythreeDpath;
let p;
let canvas;
let isMinimap = false;

const controls = { // for control the image position 
	view: { x: 0, y: 0, zoom: 1 },
	viewPos: { prevX: null, prevY: null, isDragging: false },
}

var roomSet = {
	"501": [27, 56], "502": [40, 66], "503": [40, 47]
	, "504": [40, 39], "505": [46, 32], "506": [36, 32]
	, "507": [23, 32], "508": [16, 12], "509": [16, 20]
	, "510": [16, 30], "601": [14, 56], "602": [27, 56], "603": [40, 66]
	, "604": [40, 47], "605": [40, 39], "606": [46, 32]
	, "607": [36, 32], "608": [23, 32], "609": [16, 12]
	, "610": [16, 20], "611": [16, 30], "6Escalator": [23, 37],
	"5Escalator": [27, 52], "Accessible Toilet": [17, 37], "Male Toilet": [17, 34]
	, "Female Toilet": [17, 40], "Elevator": [10, 52], "Escalator": [27, 52]
};

var roomIndex_start;
var roomIndex_end;
var current_floor;
var current_image;
var roomNum_Start;
var roomNum_End;
var autoturn = false;

function preload() {
	img5f = loadImage('map/5floor_done_75.png');
	img6f = loadImage("map/6Floor_done_75.png");
}

function run() {
	autoturn = true;
	reset();
	loop();
	checkalarm();
}

// change to 5floor 2d map and find the path
function turn5f() {
	current_floor = "5f";
	current_image = img5f;
	autoturn = false;
	reset();
	loop();

}

// change to 6floor 2d map and find the path
function turn6f() {
	current_floor = "6f";
	current_image = img6f;
	autoturn = false;
	reset();
	loop();
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

	canvas = createCanvas(canvasWidth, canvasHeight);
	canvas.mouseWheel(e => Controls.zoom(controls).worldZoom(e))
	current_image = img5f;
	current_floor = "5f"

	var mapContainer = document.getElementById('twodmapcontainer');
	canvas.parent(mapContainer); // put the canvas onto container
	w = width / cols; // width of each node 
	h = height / rows; // height of each 
	noLoop();

}

function reset() {
	done = false
	wrongFloor = false;
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
			if (current_floor == "5f") {
				grid[i][j].fiveFloor();
			} else if (current_floor == "6f") {
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
	document.getElementById("errormessage").style.visibility = "hidden";
	document.getElementById("errormessage").textContent = "";
	roomNum_Start = document.getElementById("start_input").value;
	roomNum_End = document.getElementById("end_input").value;
	sameFloor = false;
	if ((roomNum_Start in roomSet) && (roomNum_End in roomSet)) { // check the input value
		if (current_floor == "5f") { // user staying on 5F
			if (roomNum_Start[0] == "6" && roomNum_End[0] == "6") { // 6xx to 6xx
				wrongFloor = true;
				sameFloor = true;
				if (autoturn) {
					turn6f();
					return;
				}

			} else if (roomNum_End[0] == "6") { // 5xx to 6xx
				roomIndex_start = roomSet[roomNum_Start];
				roomIndex_end = roomSet["5Escalator"];

			} else if (roomNum_Start[0] == "6") { // 6xx to 5xx 
				roomIndex_start = roomSet["5Escalator"];
				roomIndex_end = roomSet[roomNum_End];
				if (autoturn) {
					turn6f();
				}

			} else { // 5xx to 5xx
				sameFloor = true;
				roomIndex_start = roomSet[roomNum_Start];
				roomIndex_end = roomSet[roomNum_End];


			}
		} else if (current_floor == "6f") { // user stay on 6F
			if (roomNum_Start[0] == "5" && roomNum_End[0] == "5") { // 5xx to 5xx
				wrongFloor = true;
				sameFloor = true;

				if (autoturn) {
					turn5f();
					return;
				}

			} else if (roomNum_End[0] == "5") { // 6xx to 5xx
				roomIndex_start = roomSet[roomNum_Start];
				roomIndex_end = roomSet["6Escalator"];

			} else if (roomNum_Start[0] == "5") { // 5xx to 6xx 
				roomIndex_start = roomSet["6Escalator"];
				roomIndex_end = roomSet[roomNum_End];

				if (autoturn) {
					turn5f();
				}

			} else { // 6xx to 6xx
				if (roomNum_End == "Escalator") {
					roomNum_End = "6Escalator"
				}
				sameFloor = true;
				roomIndex_start = roomSet[roomNum_Start];
				roomIndex_end = roomSet[roomNum_End];

			}
		}
		start = grid.at(roomIndex_start[0]).at(roomIndex_start[1]); // define the starting point
		end = grid.at(roomIndex_end[0]).at(roomIndex_end[1]); // define the ending point
		openSet.push(start);

	} else {
		noLoop();
	}
}

function draw() { // if will self-loopping automatically by the p5.jsxs
	clear();
	image(current_image, controls.view.x, controls.view.y, width, height);

	displayPath = false;
	if (wrongFloor) {
		console.log("not useful")
		noLoop();
	}
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

	w = width / cols;
	h = height / rows;

	// showing grid
	for (var i = 0; i < cols; i++) {
	   for (var j = 0; j < rows; j++) {
	     grid[i][j].show_grid(color(0), controls.view.x, controls.view.y);
	   }
	}

	path = [];
	var temp = current;
	path.push(temp);
	while (temp.previous) { // Backtrace the path from the end point
		path.push(temp.previous);
		temp = temp.previous;
	}

	// display the path
	if (displayPath) {
		if (threeDActive) {
			p = displaythreeDpath();
		}
		if (!done && roomIndex_end == roomSet["5Escalator"] && threeDActive) {
			turn6f();
		}
		else if (!done && roomIndex_end == roomSet["6Escalator"] && threeDActive) {
			turn5f();
		}
		noFill();
		stroke('blue');
		strokeWeight(w / 4);
		beginShape();
		for (var i = 0; i < path.length; i++) {
			vertex(path[i].x * w + w / 2 + controls.view.x, path[i].y * h + h / 2 + controls.view.y);
			// console.log('x:'+path[i].x);
			// console.log(', y:'+path[i].y);
			// console.log('\n');
		}
		endShape();
		start.show_node('green', controls.view.x, controls.view.y);
		end.show_node('red', controls.view.x, controls.view.y);
		//grid[24][36].show_node('red');
	}
}

// zoomin and out 
function zoomin() {
	scales = 1;
	scales *= 1.05;
	canvasWidth *= scales;
	canvasHeight *= scales;
	resizeCanvas(canvasWidth, canvasHeight);
	reset();
	loop();
};
function zoomout() {
	scales = 1;
	scales *= 0.95;
	canvasWidth *= scales;
	canvasHeight *= scales;
	resizeCanvas(canvasWidth, canvasHeight);
	reset();
	loop();
};

function hidebox() {
	document.getElementById("errormessage").style.visibility = 'hidden';
}

if (!threeDActive){
window.mousePressed = e => Controls.move(controls).mousePressed(e);
window.mouseDragged = e => Controls.move(controls).mouseDragged(e);
window.mouseReleased = e => Controls.move(controls).mouseReleased(e);
}

class Controls {
	static move(controls) {
		function mousePressed(e) {
			controls.viewPos.isDragging = true;
			controls.viewPos.prevX = e.clientX;
			controls.viewPos.prevY = e.clientY;
		}

		function mouseDragged(e) {
			const { prevX, prevY, isDragging } = controls.viewPos;
			if (!isDragging) return;

			const pos = { x: e.clientX, y: e.clientY };
			const dx = pos.x - prevX;
			const dy = pos.y - prevY;
			//   console.log(dx +", "+ dy)

			var checkX = controls.view.x + dx;
			var checkY = controls.view.y + dy;

			//   if((prevX || prevY) &&checkX <0 && checkY<0 && checkX>-100 && checkY>-100) {
			if ((prevX || prevY)) {

				controls.view.x += dx;
				controls.view.y += dy;

				// console.log(controls.view.x,controls.view.y)
				controls.viewPos.prevX = pos.x, controls.viewPos.prevY = pos.y

			}
			reset();
			loop();

		}

		function mouseReleased(e) {
			controls.viewPos.isDragging = false;
			controls.viewPos.prevX = null;
			controls.viewPos.prevY = null;

		}

		return {
			mousePressed,
			mouseDragged,
			mouseReleased
		}
	}
}

function checkalarm(){
	if ((roomNum_Start in roomSet) && (roomNum_End in roomSet)){
		document.getElementById("errormessage").style.visibility = "hidden";
	} else {
		document.getElementById("errormessage").style.visibility = "visible";
		document.getElementById("errormessage").textContent = "There no such destination, please enter again.";
	}
}
function minimap(){
	document.getElementById("switchmap").addEventListener("click", function () {
		canvas.parent('minimapContainer');
		canvasWidth = 250;
		canvasHeight = 450;
		resizeCanvas(canvasWidth, canvasHeight);
		reset();
		loop();
		isMinimap = true;
	});
}
minimap();

function canvasmap(){
	document.getElementById("switch2d").addEventListener("click", function () {
		canvas.parent('twodmapcontainer');
		canvasWidth = 1000;
		canvasHeight = 1800;
		resizeCanvas(canvasWidth, canvasHeight);
		run();
		hidebox();
		isMinimap = false;
	});
}
canvasmap();