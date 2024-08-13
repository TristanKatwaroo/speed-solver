// Constants
const ROWS = 21;
const COLS = 21;
const START_POINT = [3, 3];
const CARVE_CHANCE = 0.16;

// Game state
let maze = [];
let playerPosition = [];
let endPoint = [];
let path = null;
let playerPath = [];
let isAnimating = false;
let moveCounter = 0;
let timer = 0;
let timerInterval = null;
let gameStarted = false;
let gameState = 'default';
let computerTurnMessageTimeout = null;
let currentPlayerName = "";

// Computer opponent state
let computerPath = [];
let computerVisualPath = [];
let computerPosition = [];
let computerMoveCounter = 0;
let computerTimer = 0;
let computerTimerInterval = null;
let computerScore = null;

// Helper functions
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function manhattanDistance(point1, point2) {
    return Math.abs(point1[0] - point2[0]) + Math.abs(point1[1] - point2[1]);
}

// Maze generation
function generateMaze(rows, cols, startPoint, endPoint, carveChance) {
    const maze = Array(rows).fill().map(() => Array(cols).fill(1));
    maze[startPoint[0]][startPoint[1]] = 0;
    maze[endPoint[0]][endPoint[1]] = 0;

    const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];

    function isValidCell(row, col) {
        return row >= 0 && row < rows && col >= 0 && col < cols && maze[row][col] === 1;
    }

    function dfs(row, col) {
        maze[row][col] = 0;
        const shuffledDirections = shuffleArray([...directions]);

        for (const [dr, dc] of shuffledDirections) {
            const newRow = row + dr * 2;
            const newCol = col + dc * 2;
            if (isValidCell(newRow, newCol)) {
                maze[row + dr][col + dc] = 0;
                dfs(newRow, newCol);
            }
            if (Math.random() < carveChance) {
                if (row + dr > 0 && row + dr < rows - 1 && col + dc > 0 && col + dc < cols - 1 &&
                    (row !== startPoint[0] || col !== startPoint[1]) && (row !== endPoint[0] || col !== endPoint[1])) {
                    maze[row + dr][col + dc] = 0;
                }
            }
        }
    }

    dfs(startPoint[0], startPoint[1]);
    return maze;
}

function ensureEndPointAccessibility() {
    const [row, col] = endPoint;
    const surroundings = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1]
    ];

    let accessible = surroundings.some(([r, c]) => maze[r] && maze[r][c] === 0);

    if (!accessible) {
        const [carveRow, carveCol] = surroundings[Math.floor(Math.random() * surroundings.length)];
        
        if (carveRow >= 0 && carveRow < ROWS && carveCol >= 0 && carveCol < COLS && maze[carveRow][carveCol] === 1) {
            maze[carveRow][carveCol] = 0;
        }
    }
}

// Maze solving
function solveMaze(maze, startPoint, endPoint) {
    const heap = [[0, startPoint]];
    const cost = { [startPoint.toString()]: 0 };
    const parent = { [startPoint.toString()]: null };

    while (heap.length > 0) {
        const [currentCost, currentNode] = heap.shift();
        if (currentNode[0] === endPoint[0] && currentNode[1] === endPoint[1]) {
            return reconstructPath(parent, endPoint);
        }

        for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
            const newRow = currentNode[0] + dr;
            const newCol = currentNode[1] + dc;
            const newNode = [newRow, newCol];

            if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && maze[newRow][newCol] === 0) {
                const newCost = cost[currentNode.toString()] + 1;
                const key = newNode.toString();

                if (!(key in cost) || newCost < cost[key]) {
                    cost[key] = newCost;
                    const priority = newCost + manhattanDistance(newNode, endPoint);
                    heap.push([priority, newNode]);
                    parent[key] = currentNode;
                    heap.sort((a, b) => a[0] - b[0]);
                }
            }
        }
    }

    return null;
}

function reconstructPath(parent, endPoint) {
    const path = [];
    let node = endPoint;
    while (node !== null) {
        path.unshift(node);
        node = parent[node.toString()];
    }
    return path;
}

// Rendering
function renderMaze() {
    const mazeElement = document.getElementById('maze');
    mazeElement.innerHTML = '';
    mazeElement.style.gridTemplateColumns = `repeat(${COLS}, var(--cell-size))`;

    for (let rowIndex = 0; rowIndex < maze.length; rowIndex++) {
        for (let colIndex = 0; colIndex < maze[rowIndex].length; colIndex++) {
            const cellElement = document.createElement('div');
            cellElement.className = 'cell';
            cellElement.setAttribute('role', 'gridcell');

            const isPlayer = rowIndex === playerPosition[0] && colIndex === playerPosition[1];
            const isComputer = rowIndex === computerPosition[0] && colIndex === computerPosition[1];
            const isEnd = rowIndex === endPoint[0] && colIndex === endPoint[1];
            const isStart = rowIndex === START_POINT[0] && colIndex === START_POINT[1];
            const isPlayerPath = playerPath.some(([r, c]) => r === rowIndex && c === colIndex);
            const isComputerPath = computerVisualPath.some(([r, c]) => r === rowIndex && c === colIndex);
            const isSolverPath = path && path.some(([r, c]) => r === rowIndex && c === colIndex);

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

            mazeElement.appendChild(cellElement);
        }
    }
}

// Game logic
function countMovementOptions(row, col) {
    return [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([dr, dc]) => {
        const newRow = row + dr;
        const newCol = col + dc;
        return newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && maze[newRow][newCol] === 0;
    }).length;
}

function startGame() {
    currentPlayerName = document.getElementById('player-name').value.trim();
    if (!currentPlayerName) {
        alert("Please enter your name before starting the game.");
        return;
    }

    gameState = 'countdown';
    hideElement('start-button-container');
    hideElement('game-title');
    hideElement('results');
    hideElement('reset-button-container');
    hideElement('name-input-container');
    hideElement('leaderboard');

    initializeGame();
    showElement('maze');
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
            startPlaying();
        }
    }, 1000);
}

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
    timerInterval = setInterval(updateTimer, 1000);
    gameStarted = true;

    document.addEventListener('keydown', handleKeydown);
}

function handleKeydown(event) {
    if (gameState !== 'playing') return;

    let button;
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            handleMove(-1, 0);
            button = document.querySelector('#controls button:nth-child(1)');
            break;
        case 'ArrowDown':
        case 's':
            handleMove(1, 0);
            button = document.querySelector('#controls button:nth-child(3)');
            break;
        case 'ArrowLeft':
        case 'a':
            handleMove(0, -1);
            button = document.querySelector('#controls button:nth-child(2)');
            break;
        case 'ArrowRight':
        case 'd':
            handleMove(0, 1);
            button = document.querySelector('#controls button:nth-child(4)');
            break;
    }

    if (button) {
        button.classList.add('pressed');
    }
}

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
        button.classList.remove('pressed');
    }
}

document.addEventListener('keyup', handleKeyup);

document.querySelectorAll('.controls button').forEach(button => {
    button.addEventListener('click', () => {
        const direction = button.textContent;
        switch (direction) {
            case '↑': handleMove(-1, 0, button); break;
            case '←': handleMove(0, -1, button); break;
            case '↓': handleMove(1, 0, button); break;
            case '→': handleMove(0, 1, button); break;
        }
    });

    button.addEventListener('mousedown', () => {
        button.classList.add('pressed');
    });

    button.addEventListener('mouseup', () => {
        button.classList.remove('pressed');
    });

    button.addEventListener('mouseleave', () => {
        button.classList.remove('pressed');
    });
});

function endGame() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    gameStarted = false;

    document.removeEventListener('keydown', handleKeydown);

    startComputerTurn();
}

function startComputerTurn() {
    gameState = 'computerTurn';
    hideElement('controls');
    showElement('computer-turn-message');

    const fullPath = solveMaze(maze, START_POINT, endPoint);
    computerPath = fullPath.slice();
    computerPosition = [...START_POINT];
    computerMoveCounter = 0;
    computerTimer = 0;
    computerVisualPath = [];

    computerTimerInterval = setInterval(() => {
        computerTimer++;
    }, 1000);

    computerMoveStep();
}

function updateTimer() {
    timer++;
}

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

function animateMovement(newPath, entity) {
    if (isAnimating) return;
    isAnimating = true;

    const totalDuration = 500;
    const fps = 60;
    const totalFrames = totalDuration / 1000 * fps;

    let currentFrame = 0;
    let lastVisitedIndex = -1;

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
        additionalDelay += getRandomInt(0, 10 * Math.pow(3, optionsCount - 1));

        if (isStraightPath) {
            additionalDelay *= 0.5;
        }

        let pauseTime = baseDelay + additionalDelay;

        setTimeout(() => {
            animateMovement(newPath, 'computer');
        }, pauseTime);
    }
}

function endComputerTurn() {
    hideElement('computer-turn-message');
    computerScore = calculateScore(computerMoveCounter, computerTimer);
    displayResults();
}

function calculateScore(moves, time) {
    return time + moves * 2;
}

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

    const resultElement = document.getElementById('results');
    resultElement.innerHTML = `
        <strong>Path Length:</strong><br>
        Your Path: ${moveCounter} cells<br>
        Computer's Path: ${computerMoveCounter} cells<br><br>
        <strong>Time Taken:</strong><br>
        Your Time: ${timer}s<br>
        Computer's Time: ${computerTimer}s<br><br>
        ${pathMessage}<br>
        ${timeMessage}
    `;

    saveToLeaderboard(currentPlayerName, timer);

    showElement('results');
    showElement('reset-button-container');
    hideElement('controls');
    gameState = 'ended';
}

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

    loadLeaderboard();
}

function showElement(id) {
    document.getElementById(id).style.display = 'grid';
}

function hideElement(id) {
    document.getElementById(id).style.display = 'none';
}

// Leaderboard functions
function saveToLeaderboard(name, time) {
    fetch('http://localhost:3000/leaderboard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, time }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Leaderboard updated on server:', data);
        loadLeaderboard(); // Reload leaderboard after update
    })
    .catch(() => {
        console.log('Server unavailable, saving to local storage.');
        saveToLocalStorage(name, time);
    });
}

function saveToLocalStorage(name, time) {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    
    const existingPlayer = leaderboard.find(entry => entry.name === name);
    if (existingPlayer) {
        // Update the score only if the new score is better
        if (time < existingPlayer.time) {
            existingPlayer.time = time;
        }
    } else {
        // Add new player to the leaderboard
        leaderboard.push({ name, time });
    }

    // Sort the leaderboard and keep only the top 10
    leaderboard.sort((a, b) => a.time - b.time);
    leaderboard = leaderboard.slice(0, 10);

    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    loadLeaderboard(); // Reload leaderboard after update
}

function loadLeaderboard() {
    fetch('http://localhost:3000/leaderboard')
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

function updateLeaderboardDisplay(leaderboard) {
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    leaderboard.forEach(entry => {
        const listItem = document.createElement('li');
        listItem.textContent = `${entry.name}: ${entry.time}s`;
        leaderboardList.appendChild(listItem);
    });
}

// Initialize the game in default state
resetGame();
