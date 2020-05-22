const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const width = window.innerWidth;
const height = window.innerHeight;
const cellsHorizontal = 4;
const cellsVertical = 3;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
	element: document.body, //where we want to show the drawing of the world
	engine: engine,
	options: {
		wireframes: false,
		width: width,
		height: height
	}
});

Render.run(render);
Runner.run(Runner.create(), engine);

//walls
const walls = [
	Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
	Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
	Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
	Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];

World.add(world, walls);

//Maze generation
const shuffle = (arr) => {
	let counter = arr.length;
	while (counter > 0) {
		const index = Math.floor(Math.random() * counter);

		counter--;

		const temp = arr[counter];
		arr[counter] = arr[index];
		arr[index] = temp;
	}
	return arr;
};
//create an empty array with numRows elements. Replace each element with an array of numCols elements with a value of false
const grid = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1).fill(null).map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);

const startCol = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, col) => {
	//if visisted the cell at [row, col] then return
	if (grid[row][col]) {
		return;
	}
	//mark cell as being visited
	grid[row][col] = true;
	//make randomly ordered list of neighbors
	const neighbors = shuffle([
		[ row - 1, col, 'up' ],
		[ row, col + 1, 'right' ],
		[ row + 1, col, 'down' ],
		[ row, col - 1, 'left' ]
	]);

	//for each neighbor
	for (let neighbor of neighbors) {
		const [ nextRow, nextCol, direction ] = neighbor;
		//check if that neighbor is out of bounds
		if (nextRow < 0 || nextRow >= cellsVertical || nextCol < 0 || nextCol >= cellsHorizontal) {
			continue;
		}
		//if we have visited neighbor
		if (grid[nextRow][nextCol]) {
			continue;
		}
		//remove wall from horizontals or verticals array
		if (direction === 'left') {
			verticals[row][col - 1] = true;
		}
		else if (direction === 'right') {
			verticals[row][col] = true;
		}
		else if (direction === 'up') {
			horizontals[row - 1][col] = true;
		}
		else if (direction === 'down') {
			horizontals[row][col] = true;
		}
		//visit next cell
		stepThroughCell(nextRow, nextCol);
	}
};

stepThroughCell(startRow, startCol);

horizontals.forEach((row, rowIndex) => {
	row.forEach((open, colIndex) => {
		if (open) {
			return;
		}
		const wall = Bodies.rectangle(
			colIndex * unitLengthX + unitLengthX / 2,
			rowIndex * unitLengthY + unitLengthY,
			unitLengthX,
			10,
			{
				label: 'wall',
				isStatic: true,
				render: {
					fillStyle: 'white'
				}
			}
		);
		World.add(world, wall);
	});
});

verticals.forEach((row, rowIndex) => {
	row.forEach((open, colIndex) => {
		if (open) {
			return;
		}
		const wall = Bodies.rectangle(
			colIndex * unitLengthX + unitLengthX,
			rowIndex * unitLengthY + unitLengthY / 2,
			10,
			unitLengthY,
			{
				label: 'wall',
				isStatic: true,
				render: {
					fillStyle: 'white'
				}
			}
		);
		World.add(world, wall);
	});
});

//Goal
const goal = Bodies.rectangle(width - unitLengthX / 2, height - unitLengthY / 2, unitLengthX * 0.7, unitLengthY * 0.7, {
	label: 'goal',
	isStatic: true,
	render: {
		fillStyle: 'green'
	}
});
World.add(world, goal);

//Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
	label: 'ball',
	render: {
		fillStyle: 'blue'
	}
});
World.add(world, ball);

//key presses to control ball
document.addEventListener('keydown', (event) => {
	const { x, y } = ball.velocity;

	if (event.keyCode === 87) {
		Body.setVelocity(ball, { x, y: y - 5 });
	}
	else if (event.keyCode === 68) {
		Body.setVelocity(ball, { x: x + 5, y });
	}
	else if (event.keyCode === 83) {
		Body.setVelocity(ball, { x, y: y + 5 });
	}
	else if (event.keyCode === 65) {
		Body.setVelocity(ball, { x: x - 5, y });
	}
});

//win condition
Events.on(engine, 'collisionStart', (event) => {
	event.pairs.forEach((collision) => {
		const labels = [ 'ball', 'goal' ];
		//if the ball collides with the goal rectangle
		if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
			document.querySelector('.winner').classList.remove('hidden');
			//turn gravity back on
			world.gravity.y = 1;
			//for each object in the world
			world.bodies.forEach((body) => {
				//if the object is a wall
				if (body.label === 'wall') {
					//set isStatic to false so gravity affects it
					Body.setStatic(body, false);
				}
			});
		}
	});
});
