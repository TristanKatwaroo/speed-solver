// CONSTANTS
const ROWS = 21; // Number of rows in the maze
const COLS = 21; // Number of columns in the maze
const START_POINT = [3, 3]; // Starting position in the maze
const CARVE_CHANCE = 0.16; // Probability of carving additional paths during maze generation

// GAME STATE
let maze = []; // 2D array representing the maze structure
let playerPosition = []; // Current position of the player in the maze
let endPoint = []; // End position in the maze
let path = null; // Solution path from start to end in the maze
let playerPath = []; // Array of cells visited by the player
let isAnimating = false; // Flag to check if an animation is currently running
let moveCounter = 0; // Counter for the number of moves made by the player
let timer = 0; // Timer to track the duration of the game
let timerInterval = null; // Interval ID for the game timer
let gameStarted = false; // Flag to check if the game has started
let gameState = 'default'; // Current state of the game ('default', 'playing', 'computerTurn', 'ended')
let computerTurnMessageTimeout = null; // Timeout ID for the computer's turn message display
let currentPlayerName = ""; // Stores the player's name entered at the start

// COMPUTER OPPONENT STATE
let computerPath = []; // Array of cells that the computer will follow
let computerVisualPath = []; // Array of cells showing the computer's visual path
let computerPosition = []; // Current position of the computer in the maze
let computerMoveCounter = 0; // Counter for the number of moves made by the computer
let computerTimer = 0; // Timer for the computer's turn duration
let computerTimerInterval = null; // Interval ID for the computer's timer
let computerScore = null; // Final score for the computer

// HELPER FUNCTIONS

/**
 * Returns a random integer between the specified minimum and maximum values, inclusive.
 * This function is commonly used for generating random indices or values within a range.
 *
 * @param {number} min - The minimum integer value.
 * @param {number} max - The maximum integer value.
 * @returns {number} - A random integer between min and max, inclusive.
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffles the elements of an array in place using the Fisher-Yates (Knuth) shuffle algorithm.
 * This ensures that the array elements are randomized in an unbiased way.
 *
 * @param {Array} array - The array to be shuffled.
 * @returns {Array} - The shuffled array.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Calculates the Manhattan distance between two points in a grid.
 * Manhattan distance is the sum of the absolute differences between the coordinates of the points.
 * It is used here as a heuristic for pathfinding in grid-based mazes.
 *
 * @param {Array} point1 - The first point [row, col].
 * @param {Array} point2 - The second point [row, col].
 * @returns {number} - The Manhattan distance between the two points.
 */
function manhattanDistance(point1, point2) {
    return Math.abs(point1[0] - point2[0]) + Math.abs(point1[1] - point2[1]);
}

// MAZE GENERATION

/**
 * Generates a maze using the Depth-First Search (DFS) algorithm, with an option to randomly carve additional paths.
 * The maze is represented as a 2D array, where 1 indicates a wall and 0 indicates a path.
 * The start and end points are predefined, and the maze is carved out by recursively visiting and marking cells.
 *
 * @param {number} rows - The number of rows in the maze.
 * @param {number} cols - The number of columns in the maze.
 * @param {Array} startPoint - The starting point [row, col] in the maze.
 * @param {Array} endPoint - The end point [row, col] in the maze.
 * @param {number} carveChance - The probability of carving additional paths during maze generation.
 * @returns {Array} - A 2D array representing the generated maze.
 */
function generateMaze(rows, cols, startPoint, endPoint, carveChance) {
    const maze = Array(rows).fill().map(() => Array(cols).fill(1)); // Initialize maze with walls
    maze[startPoint[0]][startPoint[1]] = 0; // Mark the start point as a path
    maze[endPoint[0]][endPoint[1]] = 0; // Mark the end point as a path

    const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]]; // Possible movement directions: up, right, down, left

    // Checks if a cell is valid (inside maze boundaries and is a wall)
    function isValidCell(row, col) {
        return row >= 0 && row < rows && col >= 0 && col < cols && maze[row][col] === 1;
    }

    // Recursive DFS function to carve paths through the maze
    function dfs(row, col) {
        maze[row][col] = 0; // Mark the current cell as a path
        const shuffledDirections = shuffleArray([...directions]); // Shuffle directions to randomize path carving

        for (const [dr, dc] of shuffledDirections) {
            const newRow = row + dr * 2;
            const newCol = col + dc * 2;
            if (isValidCell(newRow, newCol)) {
                maze[row + dr][col + dc] = 0; // Carve path between the cells
                dfs(newRow, newCol); // Recur to carve further paths
            }
            // Randomly carve additional paths based on carveChance
            if (Math.random() < carveChance) {
                if (row + dr > 0 && row + dr < rows - 1 && col + dc > 0 && col + dc < cols - 1 &&
                    (row !== startPoint[0] || col !== startPoint[1]) && (row !== endPoint[0] || col !== endPoint[1])) {
                    maze[row + dr][col + dc] = 0;
                }
            }
        }
    }

    dfs(startPoint[0], startPoint[1]); // Start DFS from the start point
    return maze; // Return the generated maze
}

/**
 * Ensures that the end point of the maze is accessible from at least one of its neighboring cells.
 * If none of the surrounding cells are accessible, one is carved out randomly to create a path to the end.
 */
function ensureEndPointAccessibility() {
    const [row, col] = endPoint;
    const surroundings = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1]
    ];

    let accessible = surroundings.some(([r, c]) => maze[r] && maze[r][c] === 0);

    // If none of the surrounding cells are accessible, carve a random one
    if (!accessible) {
        const [carveRow, carveCol] = surroundings[Math.floor(Math.random() * surroundings.length)];
        
        if (carveRow >= 0 && carveRow < ROWS && carveCol >= 0 && carveCol < COLS && maze[carveRow][carveCol] === 1) {
            maze[carveRow][carveCol] = 0;
        }
    }
}

// MAZE SOLVING

/**
 * Solves the maze using the A* search algorithm and returns the path from the start point to the end point.
 * The algorithm uses a priority queue to explore the most promising nodes first, based on cost and heuristic distance.
 *
 * @param {Array} maze - The 2D array representing the maze.
 * @param {Array} startPoint - The starting point [row, col] in the maze.
 * @param {Array} endPoint - The end point [row, col] in the maze.
 * @returns {Array|null} - The path from start to end as an array of [row, col] pairs, or null if no path is found.
 */
function solveMaze(maze, startPoint, endPoint) {
    const heap = [[0, startPoint]]; // Priority queue for A* algorithm
    const cost = { [startPoint.toString()]: 0 }; // Cost to reach each node
    const parent = { [startPoint.toString()]: null }; // Tracks the path

    // A* algorithm loop
    while (heap.length > 0) {
        const [currentCost, currentNode] = heap.shift();
        if (currentNode[0] === endPoint[0] && currentNode[1] === endPoint[1]) {
            return reconstructPath(parent, endPoint); // Return the path if endpoint is reached
        }

        for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
            const newRow = currentNode[0] + dr;
            const newCol = currentNode[1] + dc;
            const newNode = [newRow, newCol];

            // Check if the new node is within bounds and is a path
            if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && maze[newRow][newCol] === 0) {
                const newCost = cost[currentNode.toString()] + 1;
                const key = newNode.toString();

                // Update the cost and add the node to the heap if it's a better path
                if (!(key in cost) || newCost < cost[key]) {
                    cost[key] = newCost;
                    const priority = newCost + manhattanDistance(newNode, endPoint);
                    heap.push([priority, newNode]);
                    parent[key] = currentNode;
                    heap.sort((a, b) => a[0] - b[0]); // Sort heap based on priority
                }
            }
        }
    }

    return null; // Return null if no path is found
}

/**
 * Reconstructs the path from the end point to the start point using the parent map created by the solveMaze function.
 * The path is constructed by tracing back from the end point to the start point using the parent relationships.
 *
 * @param {Object} parent - The map of parent relationships generated by solveMaze.
 * @param {Array} endPoint - The end point [row, col] in the maze.
 * @returns {Array} - The reconstructed path as an array of [row, col] pairs.
 */
function reconstructPath(parent, endPoint) {
    const path = [];
    let node = endPoint;
    while (node !== null) {
        path.unshift(node); // Add nodes to the path by tracing back from the endpoint
        node = parent[node.toString()];
    }
    return path; // Return the reconstructed path
}

// RENDERING

/**
 * Renders the maze and its elements (such as the player, computer, start, end, and paths) on the webpage.
 * The maze is displayed as a grid of cells, with each cell being styled according to its type.
 * The function iterates over the maze array and assigns appropriate classes and labels to each cell.
 */
function renderMaze() {
    const mazeElement = document.getElementById('maze');
    mazeElement.innerHTML = ''; // Clear previous maze rendering
    mazeElement.style.gridTemplateColumns = `repeat(${COLS}, var(--cell-size))`; // Set grid layout

    // Loop through each cell in the maze and render it
    for (let rowIndex = 0; rowIndex < maze.length; rowIndex++) {
        for (let colIndex = 0; colIndex < maze[rowIndex].length; colIndex++) {
            const cellElement = document.createElement('div');
            cellElement.className = 'cell'; // Basic class for each cell
            cellElement.setAttribute('role', 'gridcell');

            // Determine the type of cell (start, end, player, computer, path, etc.)
            const isPlayer = rowIndex === playerPosition[0] && colIndex === playerPosition[1];
            const isComputer = rowIndex === computerPosition[0] && colIndex === computerPosition[1];
            const isEnd = rowIndex === endPoint[0] && colIndex === endPoint[1];
            const isStart = rowIndex === START_POINT[0] && colIndex === START_POINT[1];
            const isPlayerPath = playerPath.some(([r, c]) => r === rowIndex && c === colIndex);
            const isComputerPath = computerVisualPath.some(([r, c]) => r === rowIndex && c === colIndex);
            const isSolverPath = path && path.some(([r, c]) => r === rowIndex && c === colIndex);

            // Assign the appropriate class and accessibility label based on the cell type
            if (isStart) {
                cellElement.classList.add('start');
                cellElement.setAttribute('aria-label', 'Start');
            } else if (isEnd) {
                cellElement.classList.add('end');
                cellElement.setAttribute('aria-label', 'End');
            } else if (maze[rowIndex][colIndex] === 1) {
                cellElement.classList.add('wall');
                cellElement.setAttribute('aria-label', 'Wall');
            } else if (isComputer) {
                cellElement.classList.add('computer');
                cellElement.setAttribute('aria-label', 'Computer');
            } else if (isPlayer) {
                cellElement.classList.add('player');
                cellElement.setAttribute('aria-label', 'Player');
            } else if (isComputerPath) {
                cellElement.classList.add('computer-path');
                cellElement.setAttribute('aria-label', 'Computer Path');
            } else if (isPlayerPath) {
                cellElement.classList.add('path');
                cellElement.setAttribute('aria-label', 'Player Path');
            } else if (isSolverPath) {
                cellElement.classList.add('solver-path');
                cellElement.setAttribute('aria-label', 'Solver Path');
            } else {
                cellElement.setAttribute('aria-label', 'Open');
            }

            mazeElement.appendChild(cellElement); // Add the cell to the maze element
        }
    }
}

// GAME LOGIC

/**
 * Counts the number of valid movement options (up, down, left, right) from a given cell in the maze.
 * This is used to determine whether the player or computer can continue moving in a straight line or must turn.
 *
 * @param {number} row - The row index of the current cell.
 * @param {number} col - The column index of the current cell.
 * @returns {number} - The number of valid movement options from the current cell.
 */
function countMovementOptions(row, col) {
    return [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([dr, dc]) => {
        const newRow = row + dr;
        const newCol = col + dc;
        return newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && maze[newRow][newCol] === 0;
    }).length;
}

/**
 * Starts the game by initializing the game state, handling player input, and initiating the countdown before gameplay.
 * This function ensures that the player's name is entered before starting and prepares the maze for gameplay.
 */
function startGame() {
    currentPlayerName = document.getElementById('player-name').value.trim(); // Get the player's name
    if (!currentPlayerName) {
        alert("Please enter your name before starting the game."); // Alert if name is not entered
        return;
    }

    gameState = 'countdown';
    hideElement('start-button-container');
    hideElement('game-title');
    hideElement('results');
    hideElement('reset-button-container');
    hideElement('name-input-container');
    hideElement('leaderboard');

    initializeGame(); // Generate the maze and set up the game
    showElement('maze'); // Display the maze during the countdown
    showElement('countdown');

    let countdown = 3;
    const countdownElement = document.getElementById('countdown');
    countdownElement.textContent = countdown;

    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            countdownElement.textContent = countdown;
        } else {
            clearInterval(countdownInterval);
            startPlaying(); // Start the game after the countdown
        }
    }, 1000);
}

/**
 * Begins the main gameplay, setting up the timer, enabling player input, and managing the game's state.
 * This function also prepares the interface by hiding unnecessary elements and showing the controls.
 */
function startPlaying() {
    gameState = 'playing';
    hideElement('countdown');
    hideElement('move-counter');
    hideElement('timer');
    showElement('controls');

    moveCounter = 0;
    timer = 0;

    computerMoveCounter = 0;
    computerTimer = 0;
    computerScore = null;

    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timerInterval = setInterval(() => { timer++; }, 1000); // Start the game timer
    gameStarted = true;

    document.addEventListener('keydown', handleKeydown); // Enable keyboard input for player movement
}

/**
 * Handles player movement based on keydown events, moving the player in the appropriate direction
 * if a valid key is pressed (WASD or arrow keys). The function also provides visual feedback on key presses.
 *
 * @param {KeyboardEvent} event - The keydown event triggered by the player.
 */
function handleKeydown(event) {
    if (gameState !== 'playing') return;

    let button;
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            handleMove(-1, 0); // Move up
            button = document.querySelector('#controls button:nth-child(1)');
            break;
        case 'ArrowDown':
        case 's':
            handleMove(1, 0); // Move down
            button = document.querySelector('#controls button:nth-child(3)');
            break;
        case 'ArrowLeft':
        case 'a':
            handleMove(0, -1); // Move left
            button = document.querySelector('#controls button:nth-child(2)');
            break;
        case 'ArrowRight':
        case 'd':
            handleMove(0, 1); // Move right
            button = document.querySelector('#controls button:nth-child(4)');
            break;
    }

    if (button) {
        button.classList.add('pressed'); // Visual feedback for button press
    }
}

/**
 * Handles keyup events to reset button states after pressing, ensuring that the visual feedback for button presses
 * (such as moving down visually) is removed when the key is released.
 *
 * @param {KeyboardEvent} event - The keyup event triggered by the player.
 */
function handleKeyup(event) {
    let button;
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            button = document.querySelector('#controls button:nth-child(1)');
            break;
        case 'ArrowDown':
        case 's':
            button = document.querySelector('#controls button:nth-child(3)');
            break;
        case 'ArrowLeft':
        case 'a':
            button = document.querySelector('#controls button:nth-child(2)');
            break;
        case 'ArrowRight':
        case 'd':
            button = document.querySelector('#controls button:nth-child(4)');
            break;
    }

    if (button) {
        button.classList.remove('pressed'); // Remove visual feedback after key release
    }
}

// Attach a keyup event listener to the entire document for providing visual feedback when keys are released.
// This is used primarily to ensure that the visual 'pressed' state of buttons is cleared when the keys are released.
document.addEventListener('keyup', handleKeyup);

// Set up event listeners for each control button (↑, ←, ↓, →) to handle player movement and visual feedback.
// The following block of code iterates through all buttons within the 'controls' section and attaches the necessary event listeners.
document.querySelectorAll('.controls button').forEach(button => {

    // Add a click event listener to each button to trigger the player's movement in the direction corresponding to the button's label.
    button.addEventListener('click', () => {
        const direction = button.textContent;
        switch (direction) {
            case '↑': handleMove(-1, 0, button); break;  // Move up
            case '←': handleMove(0, -1, button); break;  // Move left
            case '↓': handleMove(1, 0, button); break;   // Move down
            case '→': handleMove(0, 1, button); break;   // Move right
        }
    });

    // Add a mousedown event listener to each button to visually indicate that the button is being pressed.
    button.addEventListener('mousedown', () => {
        button.classList.add('pressed');  // Add the 'pressed' class to change the button's appearance
    });

    // Add a mouseup event listener to each button to revert the visual state once the button is released.
    button.addEventListener('mouseup', () => {
        button.classList.remove('pressed');  // Remove the 'pressed' class to reset the button's appearance
    });

    // Add a mouseleave event listener to each button to ensure that the 'pressed' state is removed if the cursor leaves the button while it is still pressed.
    button.addEventListener('mouseleave', () => {
        button.classList.remove('pressed');  // Ensure the button does not stay in the 'pressed' state
    });
});

// Enable keyboard navigation for the start and reset buttons by setting their 'tabindex' attributes.
// This makes the buttons focusable and allows users to trigger them using the keyboard (e.g., by pressing Enter or Space).
document.getElementById('start-button').setAttribute('tabindex', '0');
document.getElementById('reset-button').setAttribute('tabindex', '0');

// Attach a keydown event listener to the entire document to listen for the Space or Enter keys being pressed.
// This listener triggers the start or reset of the game depending on the current game state.
document.addEventListener('keydown', function(event) {
    // console.log(`Key pressed: ${event.key}`);
    
    // Check if the key pressed is either Space (' ') or Enter
    if (event.key === ' ' || event.key === 'Enter') {
        // If the game is in the 'default' state and hasn't started, trigger the start of the game.
        if (gameState === 'default' && !gameStarted) {
            event.preventDefault();  // Prevent default action, like scrolling the page
            startGame();  // Start the game
        } 
        // If the game has ended, trigger the reset of the game to start a new round.
        else if (gameState === 'ended') {
            event.preventDefault();  // Prevent default action
            resetGame();  // Reset the game
        }
    }
});

/**
 * Ends the player's game by stopping the timer, disabling input, and transitioning to the computer's turn.
 * The function ensures that the player's input is no longer active, and the computer begins solving the maze.
 */
function endGame() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    gameStarted = false;

    document.removeEventListener('keydown', handleKeydown);

    startComputerTurn(); // Start the computer's turn after the player finishes
}

/**
 * Initiates the computer's turn, where the computer solves the maze using the A* algorithm.
 * The computer's movements are animated, and its performance is tracked and displayed after it completes the maze.
 */
function startComputerTurn() {
    gameState = 'computerTurn';
    hideElement('controls');
    showElement('computer-turn-message');

    const fullPath = solveMaze(maze, START_POINT, endPoint); // Get the computer's solution path
    computerPath = fullPath.slice();
    computerPosition = [...START_POINT];
    computerMoveCounter = 0;
    computerTimer = 0;
    computerVisualPath = [];

    computerTimerInterval = setInterval(() => {
        computerTimer++;
    }, 1000);

    computerMoveStep(); // Start the computer's movement step by step
}

/**
 * Handles player movement in the maze, ensuring valid moves and updating the player's position and path.
 * This function also checks for collisions with walls and determines if the player has reached the endpoint.
 *
 * @param {number} dr - The change in the row index (delta row).
 * @param {number} dc - The change in the column index (delta column).
 * @param {HTMLElement|null} buttonElement - The button element associated with the move (if any).
 */
function handleMove(dr, dc, buttonElement = null) {
    if (isAnimating || !gameStarted) return;

    if (buttonElement) {
        buttonElement.classList.add('pressed');
        setTimeout(() => {
            buttonElement.classList.remove('pressed');
        }, 100);
    }

    let newRow = playerPosition[0];
    let newCol = playerPosition[1];
    let newPath = [];

    while (true) {
        const nextRow = newRow + dr;
        const nextCol = newCol + dc;

        if (nextRow < 0 || nextRow >= ROWS || nextCol < 0 || nextCol >= COLS || maze[nextRow][nextCol] === 1) {
            break;
        }

        newRow = nextRow;
        newCol = nextCol;
        newPath.push([newRow, newCol]);

        if (countMovementOptions(newRow, newCol) >= 3) {
            break;
        }

        if (newRow === endPoint[0] && newCol === endPoint[1]) {
            break;
        }
    }

    if (newPath.length > 0) {
        animateMovement(newPath, 'player');

        if (newRow === endPoint[0] && newCol === endPoint[1]) {
            setTimeout(endGame, 500);
        }
    }
}

/**
 * Animates the movement of either the player or the computer along a specified path.
 * The animation is smooth, using easing functions, and is designed to be responsive to user or computer inputs.
 *
 * @param {Array} newPath - The array of [row, col] pairs representing the path to animate along.
 * @param {string} entity - The entity that is being animated ('player' or 'computer').
 */
function animateMovement(newPath, entity) {
    if (isAnimating) return;
    isAnimating = true;

    const totalDuration = 500; // Animation duration in milliseconds
    const fps = 60; // Frames per second for the animation
    const totalFrames = totalDuration / 1000 * fps; // Total number of frames in the animation

    let currentFrame = 0;
    let lastVisitedIndex = -1;

    // Easing function for smooth animation
    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function animate() {
        if (currentFrame >= totalFrames) {
            if (entity === 'player') {
                playerPosition = newPath[newPath.length - 1];
                playerPath = playerPath.concat(newPath);
            } else if (entity === 'computer') {
                computerPosition = newPath[newPath.length - 1];
                computerVisualPath = computerVisualPath.concat(newPath);
            }
            renderMaze();
            isAnimating = false;

            if (entity === 'computer') {
                computerMoveStep();
            }
            return;
        }

        const progress = easeInOutQuad(currentFrame / totalFrames);
        const currentIndex = Math.min(Math.floor(progress * newPath.length), newPath.length - 1);

        if (currentIndex !== lastVisitedIndex) {
            if (entity === 'player') {
                playerPath.push([...playerPosition]);
                playerPosition = newPath[currentIndex];
                moveCounter++;
            } else if (entity === 'computer') {
                computerVisualPath.push([...computerPosition]);
                computerPosition = newPath[currentIndex];
                computerMoveCounter++;
            }
            lastVisitedIndex = currentIndex;
        }

        renderMaze();
        currentFrame++;
        requestAnimationFrame(animate);
    }

    animate();
}

/**
 * Initializes the game by generating the maze, setting up the player's starting position,
 * and ensuring that the end point is accessible. This function prepares the maze for gameplay.
 */
function initializeGame() {
    endPoint = [ROWS - (START_POINT[0] + getRandomInt(0, 5)), COLS - (START_POINT[1] + getRandomInt(0, 5))];
    maze = generateMaze(ROWS, COLS, START_POINT, endPoint, CARVE_CHANCE);
    ensureEndPointAccessibility();
    playerPosition = [...START_POINT];
    playerPath = [playerPosition];
    computerVisualPath = [];
    path = null;
    renderMaze();
}

/**
 * Manages the computer's movement along its calculated solution path, determining the next step
 * based on its current position and the remaining path. This function animates the computer's movement.
 */
function computerMoveStep() {
    if (computerPosition[0] === endPoint[0] && computerPosition[1] === endPoint[1]) {
        clearInterval(computerTimerInterval);
        endComputerTurn();
        return;
    }

    let dr = 0, dc = 0;

    const nextNode = computerPath[computerMoveCounter + 1];
    if (nextNode) {
        dr = nextNode[0] - computerPosition[0];
        dc = nextNode[1] - computerPosition[1];
    }

    let newRow = computerPosition[0];
    let newCol = computerPosition[1];
    let newPath = [];

    let isStraightPath = true;
    let stepsAhead = 3;

    for (let i = 0; i < stepsAhead; i++) {
        const nextRow = newRow + dr;
        const nextCol = newCol + dc;

        if (nextRow === endPoint[0] && nextCol === endPoint[1]) {
            newPath.push([nextRow, nextCol]);
            newRow = nextRow;
            newCol = nextCol;
            break;
        }

        if (nextRow < 0 || nextRow >= ROWS || nextCol < 0 || nextCol >= COLS || maze[nextRow][nextCol] === 1) {
            isStraightPath = false;
            break;
        }

        newRow = nextRow;
        newCol = nextCol;
        newPath.push([newRow, newCol]);

        if (countMovementOptions(newRow, newCol) > 2 || (newRow === endPoint[0] && newCol === endPoint[1])) {
            isStraightPath = false;
            break;
        }
    }

    if (newPath.length > 0) {
        const optionsCount = countMovementOptions(newRow, newCol);

        let baseDelay = 0;
        let additionalDelay = 5 * Math.pow(6, optionsCount - 1);
        additionalDelay += getRandomInt(0, 8 * Math.pow(3, optionsCount - 1));

        if (isStraightPath) {
            additionalDelay *= 0.5;
        }

        let pauseTime = baseDelay + additionalDelay;

        setTimeout(() => {
            animateMovement(newPath, 'computer');
        }, pauseTime);
    }
}

/**
 * Ends the computer's turn and then calculates the player's score based on the player's performance
 * relative to the computer's moves and time. It then displays the results on the screen.
 */
function endComputerTurn() {
    hideElement('computer-turn-message');
    displayResults();
}

/**
 * Calculates the final score based on the number of moves and the time taken.
 * Both the time and path length have a greater impact on the score.
 *
 * @param {number} playerMoves - The number of moves made by the player.
 * @param {number} playerTime - The time taken by the player in seconds.
 * @param {number} computerMoves - The number of moves made by the computer.
 * @param {number} computerTime - The time taken by the computer in seconds.
 * @returns {number} - The calculated score.
 */
function calculateScore(playerMoves, playerTime, computerMoves, computerTime) {
    // Calculate the time ratio (how much faster the player is compared to the computer)
    const timeRatio = computerTime / playerTime;
    
    // Calculate the move ratio (how much shorter the player's path is compared to the computer's)
    const moveRatio = computerMoves / playerMoves;

    // Apply a multiplier to both the time ratio and the move ratio
    const timeImpact = Math.pow(timeRatio, 2);
    const moveImpact = Math.pow(moveRatio, 2);

    // Calculate the final score, emphasizing both time and move impacts
    const score = 1000 * timeImpact * moveImpact;

    return Math.max(0, Math.round(score)); // Ensure the score is not negative and round it
}

/**
 * Displays the results of the game, comparing the player's performance relative to the computer's.
 * The player's score is calculated based on how their moves and time compare to the computer's.
 */
function displayResults() {
    const pathDifference = ((moveCounter - computerMoveCounter) / computerMoveCounter) * 100;
    const timeDifference = ((timer - computerTimer) / computerTimer) * 100;

    let pathMessage = "";
    let timeMessage = "";

    if (Math.abs(pathDifference) < 1) {
        pathMessage = "Your path was the same length as the computer.";
    } else if (pathDifference > 0) {
        pathMessage = `Your path was ${Math.abs(pathDifference.toFixed(1))}% longer than the computer.`;
    } else {
        pathMessage = `Your path was ${Math.abs(pathDifference.toFixed(1))}% shorter than the computer.`;
    }

    if (Math.abs(timeDifference) < 1) {
        timeMessage = "You solved the maze at the same speed as the computer.";
    } else if (timeDifference > 0) {
        timeMessage = `You solved the maze ${Math.abs(timeDifference.toFixed(1))}% slower than the computer.`;
    } else {
        timeMessage = `You solved the maze ${Math.abs(timeDifference.toFixed(1))}% faster than the computer.`;
    }

    const playerScore = calculateScore(moveCounter, timer, computerMoveCounter, computerTimer);

    const resultElement = document.getElementById('results');
    resultElement.innerHTML = `
        <strong>Your Score:</strong> ${playerScore}<br><br>
        <strong>Path Length:</strong><br>
        Your Path: ${moveCounter} cells<br>
        Computer's Path: ${computerMoveCounter} cells<br><br>
        <strong>Time Taken:</strong><br>
        Your Time: ${timer}s<br>
        Computer's Time: ${computerTimer}s<br><br>
        ${pathMessage}<br>
        ${timeMessage}<br><br>
    `;

    saveToLeaderboard(currentPlayerName, playerScore);

    showElement('results');
    showElement('reset-button-container');
    hideElement('controls');
    gameState = 'ended';
}

/**
 * Resets the game to its initial state, clearing the current game data and preparing for a new game.
 * This function also reloads the leaderboard data and resets the visual elements on the page.
 */
function resetGame() {
    gameState = 'default';
    hideElement('maze');
    hideElement('move-counter');
    hideElement('timer');
    hideElement('results');
    hideElement('reset-button-container');
    hideElement('countdown');
    hideElement('computer-turn-message');
    showElement('start-button-container');
    showElement('game-title');
    showElement('name-input-container');
    showElement('leaderboard');

    playerPath = [];
    computerVisualPath = [];
    computerPath = [];
    computerPosition = [...START_POINT];
    computerMoveCounter = 0;
    computerTimer = 0;
    computerScore = null;

    loadLeaderboard(); // Load leaderboard data from storage or server
}

// Shows an HTML element by its ID
function showElement(id) {
    document.getElementById(id).style.display = 'grid';
}

// Hides an HTML element by its ID
function hideElement(id) {
    document.getElementById(id).style.display = 'none';
}

// LEADERBOARD FUNCTIONS

/**
 * Saves the player's score to the leaderboard. If the server is available, the score is sent to the server.
 * Otherwise, the score is saved to local storage.
 *
 * @param {string} name - The player's name.
 * @param {number} score - The player's calculated score.
 */
function saveToLeaderboard(name, score) {
    const playerData = { name, score };
    fetch('http://localhost:5000/leaderboard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        loadLeaderboard();
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        saveToLocalStorage(name, score);
        console.log('Server unavailable, saving to local storage.');
    });
}

/**
 * Saves the player's score to local storage if the server is unavailable.
 * The function ensures that only the best score for each player is kept and updates the leaderboard accordingly.
 *
 * @param {string} name - The player's name.
 * @param {number} score - The player's score.
 */
function saveToLocalStorage(name, score) {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    const existingPlayer = leaderboard.find(entry => entry.name === name);

    if (existingPlayer) {
        if (score > existingPlayer.score) {
            existingPlayer.score = score;
        }
    } else {
        leaderboard.push({ name, score });
    }

    leaderboard.sort((a, b) => b.score - a.score);

    leaderboard.splice(5);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    loadLeaderboard();
}

/**
 * Loads the leaderboard data, attempting to fetch it from the server first.
 * If the server is unavailable, it falls back to loading the leaderboard from local storage.
 */
function loadLeaderboard() {
    fetch('http://localhost:5000/leaderboard')
    .then(response => response.json())
    .then(data => {
        updateLeaderboardDisplay(data);
    })
    .catch(() => {
        console.log('Server unavailable, loading leaderboard from local storage.');
        const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
        updateLeaderboardDisplay(leaderboard);
    });
}

/**
 * Updates the leaderboard display on the webpage by populating it with the latest data.
 * This function creates list items for each entry in the leaderboard and appends them to the leaderboard element.
 * The list items are numbered to indicate their ranking.
 *
 * @param {Array} leaderboard - The array of leaderboard entries to display.
 */
function updateLeaderboardDisplay(leaderboard) {
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    
    // Loop through the leaderboard entries and create a numbered list
    leaderboard.forEach((entry, index) => {
        const listItem = document.createElement('li');
        
        // Create the text for each list item, including the rank number
        listItem.textContent = `${index + 1}. ${entry.name} — ${entry.score.toFixed(2)}`;
        
        leaderboardList.appendChild(listItem);
    });
}

// Initialize the game in the default state when the script is loaded
resetGame();
