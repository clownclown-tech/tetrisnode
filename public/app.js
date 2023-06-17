// load Audio in Variables
var themeAudio = new Audio('assets/folksong.mp3');
var rotateAudio = new Audio('assets/sfx_tetris_blockrotate.ogg');
var blockmoveAudio = new Audio('assets/sfx_tetris_blockmove.ogg');
let lineclearAudio = new Audio('assets/sfx_tetris_lineclear.ogg');

// Get the elements that will display the score, lines, and level
const scoreElement = document.getElementById("score");
const linesElement = document.getElementById("lines");
const levelElement = document.getElementById("level");

var score = 0;
var lines = 0;
var level = 0;

// Update the score, lines, and level based on the current game state
function updateGameInfo(score, lines, level) {
  scoreElement.textContent = score;
  linesElement.textContent = lines;
  levelElement.textContent = level;
}

function loadHighscores() {
  $.ajax({
    url: '/highscores',
    type: 'GET',
    success: function(response) {
      var highscores = response;

      // Clear existing highscores
      $('#highscoresList').empty();
      let counter = 1

      // Add each highscore to the list
      highscores.forEach(function(score) {
        if (counter < 11) {
          var listItem = $('<li>')
            .text("#" + counter + " " + score.playerName)
            .css('display', 'flex')
            .css('justify-content', 'space-between');

          var scoreSpan = $('<span>')
            .text(score.score)
            .css('margin-left', '60px'); // Adjust the width as needed

          listItem.append(scoreSpan);




        // listItem.css('text-align-last', 'justify');

        $('#highscoresList').append(listItem);
        counter++;
        }
      });
    },

    error: function(error) {
      console.error(error);
    }
  });
}

function submitHighScore(score) {
  const name = prompt('Please enter your name (max. 7 letters) and your highscore will be saved on our server:');
  if (name && name.length <= 7) {
    const highscore = {
      playerName: name,
      score: score
    };

    $.ajax({
      url: '/highscore',
      type: 'POST',
      data: JSON.stringify(highscore),
      contentType: 'application/json',
      success: function(response) {
        console.log(response);
        loadHighscores();
      },
      error: function(error) {
        console.error(error);
      }
    });
  }
}

// Update the game info when a line is cleared
function changeScores() {
  lines++;
  score += 10;
  level = Math.floor(lines / 10) + 1;
  updateGameInfo(score, lines, level);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// generate a new tetromino sequence
function generateSequence() {
  const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z','I', 'J', 'L', 'O', 'S', 'T', 'Z','I', 'J', 'L', 'O', 'S', 'T', 'Z','I', 'J', 'L', 'O', 'S', 'T', 'Z','I', 'J', 'L', 'O', 'S', 'T', 'Z'];

  while (sequence.length) {
    const rand = getRandomInt(0, sequence.length - 1);
    const name = sequence.splice(rand, 1)[0];
    tetrominoSequence.push(name);
  }
}

// get the next tetromino in the sequence
function getNextTetromino() {
  if (tetrominoSequence.length === 0) {
    generateSequence();
  }

  const name = tetrominoSequence.pop();
  const matrix = tetrominos[name];

  // I and O start centered, all others start in left-middle
  const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);

  // I starts on row 21 (-1), all others start on row 22 (-2)
  const row = name === 'I' ? -1 : -2;

  var container = document.getElementById("tetromino-container");
  container.innerHTML = "";
  const tetromino = tetrominos[tetrominoSequence[tetrominoSequence.length - 1]];
  const numRows = tetromino.length;
  const numCols = tetromino[0].length;

  if (tetrominoSequence.length !== 0) {
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        if (tetromino[row][col] === 1) {
          const tetrominoDiv = document.createElement('div');
          tetrominoDiv.className = 'tetromino';
          tetrominoDiv.style.top = row * 25 + 'px';
          tetrominoDiv.style.left = col * 25 + 'px';
          container.appendChild(tetrominoDiv);
        } else {

          const blackDiv = document.createElement('div');
          blackDiv.className = 'black';
          blackDiv.style.top = row * 25 + 'px';
          blackDiv.style.left = col * 25 + 'px';
          container.appendChild(blackDiv);
        }
      }
    }
  } else {
    for (let i = 0; i < 16; i++) {

      const blackDiv = document.createElement('div');
      blackDiv.className = 'black';
      blackDiv.style.top = i * 25 + 'px';
      blackDiv.style.left = '0px';
      container.appendChild(blackDiv);
    }
  }


  return {
    name: name,      // name of the piece (L, O, etc.)
    matrix: matrix,  // the current rotation matrix
    row: row,        // current row (starts offscreen)
    col: col         // current col
  };
}




// rotate an NxN matrix 90deg
function rotate(matrix) {
  const N = matrix.length - 1;
  const result = matrix.map((row, i) =>
    row.map((val, j) => matrix[N - j][i])
  );

  return result;
}

// check to see if the new matrix/row/col is valid
function isValidMove(matrix, cellRow, cellCol) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col] && (
          // outside the game bounds
          cellCol + col < 0 ||
          cellCol + col >= playfield[0].length ||
          cellRow + row >= playfield.length ||
          // collides with another piece
          playfield[cellRow + row][cellCol + col])
        ) {
        return false;
      }
    }
  }

  return true;
}

// place the tetromino on the playfield
function placeTetromino() {
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col]) {
        // game over if piece has any part offscreen
        if (tetromino.row + row < 0) {
          return showGameOver();
        }

        playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
      }
    }
  }

  // check for line clears starting from the bottom and working our way up
  for (let row = playfield.length - 1; row >= 0; ) {
    if (playfield[row].every(cell => !!cell)) {
      changeScores();
      // drop every row above this one
      for (let r = row; r >= 0; r--) {
        for (let c = 0; c < playfield[r].length; c++) {
          playfield[r][c] = playfield[r-1][c];
          lineclearAudio.play();
        }
      }
    }
    else {
      row--;
    }
  }

  tetromino = getNextTetromino();
}

// show the game over screen
function showGameOver() {
  cancelAnimationFrame(rAF);
  gameOver = true;

  context.fillStyle = '';
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);

  context.globalAlpha = 1;
  context.fillStyle = 'green';
  context.font = '36px slkscr';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
  themeAudio.pause();
  submitHighScore(score);
}

const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 32;
const tetrominoSequence = [];

// keep track of what is in every cell of the game using a 2d array
// tetris playfield is 10x20, with a few rows offscreen
const playfield = [];

// populate the empty state
for (let row = -2; row < 20; row++) {
  playfield[row] = [];

  for (let col = 0; col < 10; col++) {
    playfield[row][col] = 0;
  }
}

// how to draw each tetromino
const tetrominos = {
  'I': [
    [0,0,0,0],
    [1,1,1,1],
    [0,0,0,0],
    [0,0,0,0]
  ],
  'J': [
    [1,0,0],
    [1,1,1],
    [0,0,0],
  ],
  'L': [
    [0,0,1],
    [1,1,1],
    [0,0,0],
  ],
  'O': [
    [1,1],
    [1,1],
  ],
  'S': [
    [0,1,1],
    [1,1,0],
    [0,0,0],
  ],
  'Z': [
    [1,1,0],
    [0,1,1],
    [0,0,0],
  ],
  'T': [
    [0,1,0],
    [1,1,1],
    [0,0,0],
  ]
};

// color of each tetromino
const colors = {
  'I': '#0f380f',
  'O': '#0f380f',
  'T': '#0f380f',
  'S': '#0f380f',
  'Z': '#0f380f',
  'J': '#0f380f',
  'L': '#0f380f'
};

// gameboy colors
// #0f380f	(15,56,15)
// #306230	(48,98,48)

let count = 0;
let tetromino = getNextTetromino();
let rAF = null;  // keep track of the animation frame so we can cancel it
let gameOver = false;

// game loop
function loop() {
  rAF = requestAnimationFrame(loop);
  context.clearRect(0,0,canvas.width,canvas.height);
  themeAudio.play();
  loadHighscores();


  // draw the playfield
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 10; col++) {
      if (playfield[row][col]) {
        const name = playfield[row][col];
        context.fillStyle = colors[name];

        // drawing 1 px smaller than the grid creates a grid effect
        context.fillRect(col * grid, row * grid, grid-1, grid-1);
      }
    }
  }

  // draw the active tetromino
  if (tetromino) {

    // tetromino falls every 35 frames
    if (++count > 40) {
      tetromino.row++;
      count = 0;

      // place piece if it runs into anything
      if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
        tetromino.row--;
        blockmoveAudio.play();
        console.log("DROP");
        placeTetromino();
      }
    }

    context.fillStyle = colors[tetromino.name];

    for (let row = 0; row < tetromino.matrix.length; row++) {
      for (let col = 0; col < tetromino.matrix[row].length; col++) {
        if (tetromino.matrix[row][col]) {

          // drawing 1 px smaller than the grid creates a grid effect
          context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid-1, grid-1);
        }
      }
    }
  }
}

// listen to keyboard events to move the active tetromino
document.addEventListener('keydown', function(e) {
  if (gameOver) return;

  // left and right arrow keys (move)
  if (e.which === 37 || e.which === 39) {
    const col = e.which === 37
      ? tetromino.col - 1
      : tetromino.col + 1;

    if (isValidMove(tetromino.matrix, tetromino.row, col)) {
      tetromino.col = col;
      blockmoveAudio.playbackRate = 2;
      blockmoveAudio.play();
    }
  }

  // up arrow key (rotate)
  if (e.which === 38) {
    const matrix = rotate(tetromino.matrix);
    if (isValidMove(matrix, tetromino.row, tetromino.col)) {
      tetromino.matrix = matrix;
      rotateAudio.playbackRate = 2;
      rotateAudio.play();
    }
  }

  // down arrow key (drop)
  if(e.which === 40) {
    const row = tetromino.row + 1;

    if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
      tetromino.row = row - 1;
      placeTetromino();
      blockmoveAudio.play();
      return;
    }

    tetromino.row = row;
  }
});

// start the game
rAF = requestAnimationFrame(loop);
