// ── XO Game — app.js ────────────────────────────────────────────────────────

// ── DOM refs ──────────────────────────────────────────────────────────────────
const cells                = document.querySelectorAll('.cell');
const startMessage         = document.getElementById('start-message');
const questionContainer    = document.getElementById('question-container');
const questionLabel        = document.getElementById('question-label');
const questionArEl         = document.getElementById('question-ar');
const questionEnEl         = document.getElementById('question-en');
const options              = document.getElementById('options');
const timerDisplay         = document.getElementById('timer');
const resetButton          = document.getElementById('reset');
const currentPlayerElement = document.getElementById('current-player');
const currentPlayerBoard   = document.getElementById('current-player-board');
const scoreXEl             = document.getElementById('score-x');
const scoreOEl             = document.getElementById('score-o');

// ── Sound effects ──────────────────────────────────────────────────────────────
const timerSound        = new Audio('sounds/30sec_countdown.mp3');
const wrongAnswerSound  = new Audio('sounds/wrong_answer.mp3');
const correctAnswerSound= new Audio('sounds/correct_answer.mp3');
const startGameSound    = new Audio('sounds/change_player.mp3');
const gameWinSound      = new Audio('sounds/game_win.mp3');

// ── State ──────────────────────────────────────────────────────────────────────
let currentPlayer      = '';
let gameActive         = true;
let countdown;
let currentCellIndex   = null;
let questionActive     = false;
let isSwapMode         = false;   // true when stealing an opponent's cell
let usedIndexes        = new Set();
let scoreX             = 0;
let scoreO             = 0;

const COUNTDOWN_SOUND_AT = 5;

// ── Load config from setup.html ────────────────────────────────────────────────
const rawCfg = sessionStorage.getItem('xoGameConfig');
if (!rawCfg) { window.location.href = 'index.html'; }
const cfg               = JSON.parse(rawCfg || '{}');
const subject           = cfg.subject || '';
const questions         = Array.isArray(cfg.questions) ? cfg.questions : [];
const secondsPerQuestion= Math.max(5, Math.min(300, parseInt(cfg.secondsPerQuestion, 10) || 30));
let   timeLeft          = secondsPerQuestion;
let   countdownSoundFired = false;

document.title = `${subject} — XO Game`;

// ── Boot ───────────────────────────────────────────────────────────────────────
if (questions.length > 0) {
  decideStartingTeam();
} else {
  startMessage.textContent = 'No questions loaded. Go back and try again.';
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Returns the display symbol for a player ('✕' for X, '○' for O) */
function symbol(player) {
  return player === 'X' ? '✕' : '○';
}

/** Mark all opponent cells as swappable (pulsing red glow) */
function updateSwappableCells() {
  const opponent = currentPlayer === 'X' ? 'O' : 'X';
  cells.forEach(cell => {
    const owner = cell.dataset.owner || '';
    if (!questionActive && gameActive && owner === opponent) {
      cell.classList.add('swappable');
    } else {
      cell.classList.remove('swappable');
    }
  });
}

/** Update the board subtitle with whose turn it is */
function updateBoardHeader() {
  if (currentPlayerBoard) {
    currentPlayerBoard.textContent = gameActive
      ? `${symbol(currentPlayer)} Team ${currentPlayer}'s turn`
      : '';
  }
}

function updateScores() {
  if (scoreXEl) scoreXEl.textContent = scoreX;
  if (scoreOEl) scoreOEl.textContent = scoreO;
}

// ── Game start ─────────────────────────────────────────────────────────────────
function decideStartingTeam() {
  currentPlayer = Math.random() < 0.5 ? 'X' : 'O';
  startMessage.textContent = `Team ${currentPlayer} starts the game!`;
  startMessage.style.color = '';
  startMessage.style.textShadow = '';
  startGameSound.play();
  updateBoardHeader();
  updateSwappableCells();
}

// ── Show question ──────────────────────────────────────────────────────────────
function showQuestion(cellIndex, swapMode) {
  currentCellIndex = cellIndex;
  isSwapMode       = !!swapMode;

  // Pick an unused random question
  if (usedIndexes.size === questions.length) usedIndexes.clear();
  let randomIndex;
  do { randomIndex = Math.floor(Math.random() * questions.length); }
  while (usedIndexes.has(randomIndex));
  usedIndexes.add(randomIndex);

  const question = questions[randomIndex];
  // Bilingual display: Arabic always on right, English on left when available
  questionArEl.textContent = question.question;
  if (question.question_en) {
    questionEnEl.textContent = question.question_en;
    questionEnEl.style.display = '';
  } else {
    questionEnEl.textContent = '';
    questionEnEl.style.display = 'none';
  }

  // Style the question label differently for swap mode
  if (isSwapMode) {
    questionLabel.textContent = '🔄 SWAP CHALLENGE — Steal this cell!';
    questionLabel.classList.add('swap-mode');
    questionContainer.style.borderColor = 'rgba(239,68,68,0.45)';
  } else {
    questionLabel.textContent = '📋 Question';
    questionLabel.classList.remove('swap-mode');
    questionContainer.style.borderColor = '';
  }

  questionContainer.classList.remove('hidden');
  timerDisplay.classList.remove('hidden');
  currentPlayerElement.classList.remove('hidden');
  currentPlayerElement.textContent = `Team ${currentPlayer}'s Turn`;
  timerDisplay.classList.remove('urgent');

  // Remove swappable highlights while question is open
  cells.forEach(c => c.classList.remove('swappable'));

  startTimer();

  // ── Render answer buttons ──────────────────────────────────────────────────
  if (question.type === 'TF') {
    options.innerHTML = '';
    ['True', 'False'].forEach(label => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.addEventListener('click', () => {
        const correct = question.answer.trim().toLowerCase();
        handleAnswer(label.toLowerCase() === correct);
      });
      options.appendChild(btn);
    });

  } else {
    // MCQ
    options.innerHTML = '';
    question.options.forEach(option => {
      const btn = document.createElement('button');
      btn.textContent = option;
      btn.addEventListener('click', () => {
        handleAnswer(option.trim().toLowerCase() === question.answer.trim().toLowerCase());
      });
      options.appendChild(btn);
    });
  }
}

// ── Timer ──────────────────────────────────────────────────────────────────────
function startTimer() {
  timeLeft = secondsPerQuestion;
  countdownSoundFired = false;
  timerDisplay.textContent = `⏱ ${timeLeft}s`;
  clearInterval(countdown);

  countdown = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `⏱ ${timeLeft}s`;

    if (timeLeft <= COUNTDOWN_SOUND_AT && !countdownSoundFired) {
      countdownSoundFired = true;
      timerSound.currentTime = Math.max(0, 30 - COUNTDOWN_SOUND_AT);
      timerSound.play().catch(() => {});
    }
    if (timeLeft <= 5) {
      timerDisplay.classList.add('urgent');
    }
    if (timeLeft <= 0) {
      clearInterval(countdown);
      if (!questionContainer.classList.contains('hidden')) handleAnswer(false);
    }
  }, 1000);
}

// ── Handle answer ──────────────────────────────────────────────────────────────
function handleAnswer(isCorrect) {
  clearInterval(countdown);
  timerSound.pause();
  timerSound.currentTime = 0;

  questionContainer.classList.add('hidden');
  timerDisplay.classList.add('hidden');
  timerDisplay.classList.remove('urgent');
  currentPlayerElement.classList.add('hidden');
  questionActive = false;

  const cell = cells[currentCellIndex];

  if (isCorrect) {
    correctAnswerSound.play();

    if (isSwapMode) {
      // ── Steal: flip opponent's cell to current player ──────────────────────
      cell.textContent   = symbol(currentPlayer);
      cell.dataset.owner = currentPlayer;
      cell.classList.remove('cell-x', 'cell-o', 'swappable', 'just-placed', 'just-swapped');
      cell.classList.add(currentPlayer === 'X' ? 'cell-x' : 'cell-o');
      void cell.offsetWidth; // force reflow for animation restart
      cell.classList.add('just-swapped');

      startMessage.textContent = `🔄 Stolen! Team ${currentPlayer} took the cell!`;
      startMessage.classList.add('big-message', 'correct-message');
    } else {
      // ── Normal: place symbol on empty cell ────────────────────────────────
      cell.textContent   = symbol(currentPlayer);
      cell.dataset.owner = currentPlayer;
      cell.classList.remove('empty', 'swappable');
      cell.classList.add(currentPlayer === 'X' ? 'cell-x' : 'cell-o');
      void cell.offsetWidth;
      cell.classList.add('just-placed');

      startMessage.textContent = `✓ Correct! Team ${currentPlayer} claims the cell.`;
      startMessage.classList.add('big-message', 'correct-message');
    }

    startMessage.style.color      = '';
    startMessage.style.textShadow = '';
    checkWin();

  } else {
    wrongAnswerSound.play();
    startMessage.textContent = isSwapMode
      ? `✗ Wrong! The cell stays with Team ${currentPlayer === 'X' ? 'O' : 'X'}.`
      : '✗ Wrong Answer!';
    startMessage.classList.add('big-message', 'wrong-message');
    startMessage.style.color      = '';
    startMessage.style.textShadow = '';
  }

  // Switch player after a short delay
  setTimeout(() => {
    if (gameActive) {
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      startMessage.classList.remove('big-message', 'correct-message', 'wrong-message');
      startMessage.textContent      = `Team ${currentPlayer}'s turn`;
      startMessage.style.color      = '#FCAD0F';
      startMessage.style.textShadow = '0 0 10px rgba(252,173,15,0.4)';
      updateBoardHeader();
      updateSwappableCells();
    }
    questionActive = false;
    isSwapMode     = false;
  }, 1600);
}

// ── Check win / draw ───────────────────────────────────────────────────────────
function checkWin() {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (const [a, b, c] of combos) {
    const oa = cells[a].dataset.owner;
    const ob = cells[b].dataset.owner;
    const oc = cells[c].dataset.owner;
    if (oa && oa === ob && oa === oc) {
      gameActive = false;
      [cells[a], cells[b], cells[c]].forEach(c => c.classList.add('win-cell'));

      startMessage.textContent      = `🏆 Team ${currentPlayer} wins!`;
      startMessage.style.color      = '#FCAD0F';
      startMessage.style.textShadow = '0 0 20px rgba(252,173,15,0.7)';
      startMessage.classList.add('big-message');
      gameWinSound.play();

      if (currentPlayer === 'X') scoreX++;
      else scoreO++;
      updateScores();

      cells.forEach(c => c.classList.remove('swappable'));
      if (currentPlayerBoard) currentPlayerBoard.textContent = '';
      return;
    }
  }

  if ([...cells].every(cell => cell.dataset.owner)) {
    gameActive = false;
    startMessage.textContent      = "🤝 It's a draw!";
    startMessage.style.color      = 'rgba(255,255,255,0.7)';
    startMessage.style.textShadow = 'none';
    startMessage.classList.add('big-message');
    cells.forEach(c => c.classList.remove('swappable'));
    if (currentPlayerBoard) currentPlayerBoard.textContent = '';
  }
}

// ── Reset ──────────────────────────────────────────────────────────────────────
resetButton.addEventListener('click', () => {
  questionActive = false;
  isSwapMode     = false;
  clearInterval(countdown);
  timerSound.pause();
  timerSound.currentTime = 0;

  cells.forEach(cell => {
    cell.textContent   = '';
    cell.dataset.owner = '';
    cell.className     = 'cell empty';
  });

  gameActive = true;
  usedIndexes.clear();

  questionContainer.classList.add('hidden');
  timerDisplay.classList.add('hidden');
  timerDisplay.classList.remove('urgent');
  currentPlayerElement.classList.add('hidden');
  startMessage.style.color      = '';
  startMessage.style.textShadow = '';
  startMessage.classList.remove('big-message', 'correct-message', 'wrong-message');

  decideStartingTeam();
});

// ── Cell click handler ─────────────────────────────────────────────────────────
cells.forEach((cell, index) => {
  cell.addEventListener('click', () => {
    if (!gameActive || questionActive) return;

    const owner    = cell.dataset.owner || '';
    const opponent = currentPlayer === 'X' ? 'O' : 'X';

    if (!owner) {
      // ── Empty cell: normal question ───────────────────────────────────────
      questionActive = true;
      startMessage.textContent = '';
      startMessage.classList.remove('big-message', 'correct-message', 'wrong-message');
      showQuestion(index, false);

    } else if (owner === opponent) {
      // ── Opponent's cell: swap challenge ───────────────────────────────────
      questionActive = true;
      startMessage.textContent = '';
      startMessage.classList.remove('big-message', 'correct-message', 'wrong-message');
      showQuestion(index, true);

    }
    // Own cell: ignore
  });
});
