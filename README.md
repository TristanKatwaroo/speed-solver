# Speed Solver

Welcome to **Speed Solver**, a maze game where you compete against the computer to solve mazes efficiently and quickly. This guide will help you set up and run the project on your local machine.

## Table of Contents
- [Game Mechanics](#game-mechanics)
- [Getting Started](#getting-started)
- [Running the Game](#running-the-game)
  - [Option 1: Play Online](#option-1-play-online)
  - [Option 2: Run Locally](#option-2-run-locally)
- [Running the Express Server](#running-the-express-server)

## Game Mechanics

- **Controls**: `Space`, `Enter`, or the on-screen buttons to start or reset the game. You can use `WASD`, arrow keys, or the on-screen buttons to navigate the maze.
- **Objective**: Solve the maze faster and more efficiently than the computer.
- **Scoring**: Your score is calculated based on your time and path length relative to the computer's performance. Faster times and shorter paths yield higher scores.
- **Leaderboard**: The top scores are displayed on the leaderboard. When the server is running, scores are stored server-side; otherwise, they are saved in your browser's local storage.

## Getting Started

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/en/download/) (v12 or later)

Clone the repository to your local machine:

```bash
git clone https://github.com/TristanKatwaroo/speed-solver.git
```

Navigate to the project directory:

```bash
cd speed-solver
```

## Running the Game

You have two options to play the game:

#### Option 1: Play Online

Simply visit the hosted version of the game at: [https://speed-solver.pages.dev/](https://speed-solver.pages.dev/)

#### Option 2: Run Locally

1. Open the `index.html` file located in the project root directory with your preferred web browser.

   - **Note**: Some browsers may have restrictions when running local files. If you encounter any issues, consider using a local server or proceed to run the Express server as described below.

## Running the Express Server

For an enhanced experience with server-side leaderboard functionalities, follow these steps:

1. Navigate to the server directory:

   ```bash
   cd server
   ```

2. Install the necessary dependencies:

   ```bash
   npm install
   ```

3. Start the Express server:

   ```bash
   node server.js
   ```

   The server will start on [http://localhost:5000](http://localhost:5000).

4. Open your web browser and navigate to [http://localhost:5000](http://localhost:5000) to play the game with server-side support.

   - **Note**: If the Express server is not running, it will save your data in your browser's local storage as a fallback.

Enjoy the game and happy maze-solving!