
const difficulty = document.getElementById("difficulty");
const rangeText = document.getElementById("rangeText");
const guessForm = document.getElementById("guessForm");
const guessInput = document.getElementById("guessInput");
const guessButton = document.getElementById("guessButton");
const feedback = document.getElementById("feedback");
const feedbackText = document.getElementById("feedbackText");
const attemptText = document.getElementById("attemptText");
const progressBar = document.getElementById("progressBar");
const guessCount = document.getElementById("guessCount");
const scoreDisplay = document.getElementById("score");
const bestScoreDisplay = document.getElementById("bestScore");
const history = document.getElementById("history");
const historyCount = document.getElementById("historyCount");
const hintButton = document.getElementById("hintButton");
const newGameButton = document.getElementById("newGameButton");
const gameCard = document.querySelector(".game-card");

const levels = {
  easy: { max: 50, attempts: 10 },
  medium: { max: 100, attempts: 10 },
  hard: { max: 500, attempts: 12 }
};

let secretNumber;
let maxNumber;
let maxAttempts;
let attemptsUsed;
let currentScore;
let gameOver;
let hintUsed;
let previousGuesses;

// Restore the best score saved in this browser.
let bestScore = Number(localStorage.getItem("guessQuestBest")) || 0;

bestScoreDisplay.textContent = bestScore;

// Start or restart the game.
function startGame() {
  const level = levels[difficulty.value];

  maxNumber = level.max;
  maxAttempts = level.attempts;
  secretNumber = Math.floor(Math.random() * maxNumber) + 1;

  attemptsUsed = 0;
  currentScore = 0;
  gameOver = false;
  hintUsed = false;
  previousGuesses = [];

  rangeText.textContent =
    `01 — ${String(maxNumber).padStart(3, "0")}`;

  guessInput.min = 1;
  guessInput.max = maxNumber;
  guessInput.value = "";
  guessInput.disabled = false;
  guessButton.disabled = false;
  hintButton.disabled = false;
  guessInput.placeholder = `Enter 1–${maxNumber}`;

  guessCount.textContent = "0";
  scoreDisplay.textContent = "0";
  attemptText.textContent = `0 / ${maxAttempts}`;
  progressBar.style.width = "0%";

  history.innerHTML =
    '<p class="empty-history">Your guesses will appear here.</p>';

  historyCount.textContent = "0 guesses";
  gameCard.classList.remove("celebrate");

  showFeedback("Make your first guess to begin!", "normal");
  guessInput.focus();
}

// Display feedback to the player.
function showFeedback(message, type = "normal") {
  feedback.className = "feedback";

  if (type === "success") {
    feedback.classList.add("success");
    feedback.querySelector(".feedback-icon").textContent = "✓";
  } else if (type === "error") {
    feedback.classList.add("error");
    feedback.querySelector(".feedback-icon").textContent = "!";
  } else {
    feedback.querySelector(".feedback-icon").textContent = "✦";
  }

  feedbackText.textContent = message;
}

// Update the attempts counter and progress bar.
function updateAttempts() {
  attemptText.textContent = `${attemptsUsed} / ${maxAttempts}`;

  const percentage = (attemptsUsed / maxAttempts) * 100;
  progressBar.style.width = `${percentage}%`;

  guessCount.textContent = attemptsUsed;
}

// Add each guess to the history.
function addToHistory(number, result) {
  if (previousGuesses.length === 0) {
    history.innerHTML = "";
  }

  previousGuesses.push(number);

  const item = document.createElement("div");
  item.className = `history-item ${result}`;

  let label = "↑ Too high";
  if (result === "low") label = "↓ Too low";
  if (result === "correct") label = "✓ Correct";

  const numberLabel = document.createElement("strong");
  numberLabel.textContent = number;

  const resultLabel = document.createElement("span");
  resultLabel.textContent = label;

  item.append(numberLabel, resultLabel);
  history.prepend(item);

  historyCount.textContent =
    `${previousGuesses.length} ${previousGuesses.length === 1 ? "guess" : "guesses"}`;
}

// Calculate points based on the difficulty and remaining attempts.
function calculateScore() {
  const difficultyBonus = {
    easy: 10,
    medium: 20,
    hard: 50
  };

  const base = difficultyBonus[difficulty.value];
  const remaining = maxAttempts - attemptsUsed;

  return base * 100 + remaining * 50;
}

// Handle a submitted guess.
guessForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (gameOver) return;

  const guess = Number(guessInput.value);

  if (
    guessInput.value.trim() === "" ||
    !Number.isInteger(guess) ||
    guess < 1 ||
    guess > maxNumber
  ) {
    showFeedback(
      `Enter a whole number between 1 and ${maxNumber}.`,
      "error"
    );
    return;
  }

  // Do not allow the same number twice.
  if (previousGuesses.includes(guess)) {
    showFeedback("You already tried that number. Try another!", "error");
    return;
  }

  attemptsUsed++;

  if (guess === secretNumber) {
    addToHistory(guess, "correct");
    updateAttempts();

    currentScore = calculateScore();
    scoreDisplay.textContent = currentScore;

    showFeedback(
      `Amazing! ${secretNumber} was correct. You cracked the code!`,
      "success"
    );

    // Save a new personal best.
    if (currentScore > bestScore) {
      bestScore = currentScore;
      localStorage.setItem("guessQuestBest", bestScore);
      bestScoreDisplay.textContent = bestScore;
      showFeedback(
        `New personal best! You found ${secretNumber}!`,
        "success"
      );
    }

    endGame(true);
  } else {
    const result = guess > secretNumber ? "high" : "low";
    addToHistory(guess, result);
    updateAttempts();

    if (attemptsUsed >= maxAttempts) {
      showFeedback(
        `Game over! The secret number was ${secretNumber}.`,
        "error"
      );
      endGame(false);
    } else if (result === "high") {
      showFeedback("Too high! Try a smaller number.", "error");
    } else {
      showFeedback("Too low! Try a bigger number.", "normal");
    }
  }

  if (!gameOver) {
    guessInput.value = "";
    guessInput.focus();
  }
});

// Give a hint without revealing the secret number.
hintButton.addEventListener("click", function () {
  if (gameOver) return;

  if (hintUsed) {
    showFeedback("You've already used your hint this round.", "error");
    return;
  }

  hintUsed = true;
  hintButton.disabled = true;

  const midpoint = Math.floor(maxNumber / 2);
  const parity = secretNumber % 2 === 0 ? "even" : "odd";

  let hintMessage =
    `Hint: The number is ${parity}.`;

  if (secretNumber <= midpoint) {
    hintMessage += ` It is between 1 and ${midpoint}.`;
  } else {
    hintMessage += ` It is between ${midpoint + 1} and ${maxNumber}.`;
  }

  showFeedback(hintMessage);
});

// End the round and disable further guesses.
function endGame(won) {
  gameOver = true;
  guessInput.disabled = true;
  guessButton.disabled = true;
  hintButton.disabled = true;

  if (won) {
    gameCard.classList.remove("celebrate");
    void gameCard.offsetWidth;
    gameCard.classList.add("celebrate");
  }
}

// Change difficulty and start a fresh round.
difficulty.addEventListener("change", startGame);

// Start a new game whenever the player clicks the button.
newGameButton.addEventListener("click", startGame);

// Start the first game.
startGame();

/* How to Play popup */
const helpButton = document.getElementById("helpButton");
const helpModal = document.getElementById("helpModal");
const closeHelpButton = document.getElementById("closeHelpButton");
const gotItButton = document.getElementById("gotItButton");

function openHelp() {
  helpModal.hidden = false;
  document.body.style.overflow = "hidden";
  closeHelpButton.focus();
}

function closeHelp() {
  helpModal.hidden = true;
  document.body.style.overflow = "";
  helpButton.focus();
}

helpButton.addEventListener("click", openHelp);
closeHelpButton.addEventListener("click", closeHelp);
gotItButton.addEventListener("click", closeHelp);

// Close the popup by clicking outside the card.
helpModal.addEventListener("click", function (event) {
  if (event.target === helpModal) {
    closeHelp();
  }
});

// Close the popup with the Escape key.
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !helpModal.hidden) {
    closeHelp();
  }
});
