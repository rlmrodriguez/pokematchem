const pokeAPIBaseUrl = "https://pokeapi.co/api/v2/pokemon/";
const board = document.querySelector("#board");
const resetBtn = document.querySelector("#resetBtn");
const selectedLevelText = document.querySelector("#selectedLevel");
const settingsMenu = document.querySelector("#settings");
const okayBtn = document.querySelector("#okayBtn");
const howToStart = document.querySelector(".how-to-start");
const buttons = document.querySelector(".buttons");
const winnerDisplay = document.querySelector(".win");
const tileScore = document.querySelector("#tileScore");
const timeScore = document.querySelector("#timeScore");
const moveScore = document.querySelector("#moveScore");
const totalScore = document.querySelector("#totalScore");
const topScores = document.querySelector("#topScores");
const hiScoresBtn = document.querySelector("#hiScoresBtn");
const moveCount = document.querySelector("#numOfMoves");
const clearBtn = document.querySelector("#clearBtn");
const timer = document.querySelector("#totalTime");
const playBtn = document.querySelector("#playBtn");
const pauseBtn = document.querySelector("#pauseBtn");
const settingsBtn = document.querySelector("#settingsBtn");

let firstPick;
let isPaused = true;
let matches;
let boardSize;
let checkedID;
let [seconds, minutes] = [0, 0];
let setTimer = null;
let isExecuted = false;
let score;
let moves;
let maxMoves;
let movesScore;
let timeElapsed;
let tilesMatchedScore;
let levelTopScores = {
  "LEVEL 1": 0,
  "LEVEL 2": 0,
  "LEVEL 3": 0,
};

const colors = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

const loadPokemon = async () => {
  const randomIds = new Set();
  while (randomIds.size < boardSize) {
    const randomNumber = Math.ceil(Math.random() * 649);
    randomIds.add(randomNumber);
  }
  const pokePromises = [...randomIds].map((id) => fetch(pokeAPIBaseUrl + id));
  const results = await Promise.all(pokePromises);
  return await Promise.all(results.map((res) => res.json()));
};

const startTime = () => {
  seconds += 1;
  if (seconds === 60) {
    seconds = 0;
    minutes++;
  }
  let mins = minutes < 10 ? "0" + minutes : minutes;
  let secs = seconds < 10 ? "0" + seconds : seconds;
  timer.innerHTML = `${mins}:${secs}`;
};

const getStoredValue = (key, initialValue) => {
  return localStorage.getItem(key) !== null
    ? +localStorage.getItem(key)
    : initialValue;
};

const displayHiScores = (el, level) => {
  document.querySelector(el).innerText = JSON.parse(
    localStorage.getItem("levelTopScores")
  )[level];
};

const adjustGridCols = () => {
  const smallWidth = window.matchMedia("(min-width: 320px)");
  const tabletWidth = window.matchMedia("(min-width: 768px)");

  if (smallWidth.matches && boardSize === 6) {
    board.style.gridTemplateColumns = "repeat(3, minmax(64px, 140px))";
  } else {
    board.style.gridTemplateColumns = "repeat(4, minmax(64px, 140px))";
  }

  if (tabletWidth.matches) {
    if (boardSize === 6) {
      board.style.gridTemplateColumns = "repeat(3, minmax(64px, 140px))";
    } else if (boardSize === 10) {
      board.style.gridTemplateColumns = "repeat(5, minmax(64px, 140px))";
    } else {
      board.style.gridTemplateColumns = "repeat(4, minmax(64px, 140px))";
    }
  }
};

const resetElValues = () => {
  const radioBtns = document.querySelectorAll("input[type='radio']");
  radioBtns.forEach((btn) => {
    if (btn.id === localStorage.getItem("checkedID")) {
      btn.checked = true;
    }
  });

  board.innerHTML = `<div class="loader"><img src="./images/loader.gif"><span class="loading">LOADING</span></div>`;
  isPaused = true;
  firstPick = null;
  score = 0;
  matches = 0;
  moves = 0;
  clearInterval(setTimer);
  isExecuted = false;
  [seconds, minutes, hours] = [0, 0, 0];
  timeElapsed = 0;
  tilesMatchedScore = 0;

  timer.innerHTML = "00:00";
  tileScore.innerText = "00";
  timeScore.innerText = "00";
  moveScore.innerText = "00";
  moveCount.innerText = "000";
};

const resetGame = async () => {
  boardSize = getStoredValue("boardSize", 6);
  checkedID = getStoredValue("checkedID", "6");
  maxMoves = getStoredValue("maxMoves", 16);
  tryScore = getStoredValue("tryScore", 8);
  maxTime = getStoredValue("maxTime", 25);

  selectedLevelText.innerText = localStorage.getItem("levelText")
    ? localStorage.getItem("levelText")
    : "LEVEL 1";

  if (!localStorage.getItem("levelTopScores")) {
    localStorage.setItem("levelTopScores", JSON.stringify(levelTopScores));
  }

  displayHiScores("#lvl1TopScore", "LEVEL 1");
  displayHiScores("#lvl2TopScore", "LEVEL 2");
  displayHiScores("#lvl3TopScore", "LEVEL 3");

  adjustGridCols();
  resetElValues();

  setTimeout(async () => {
    const loadedPokemon = await loadPokemon();
    displayPokemon([...loadedPokemon, ...loadedPokemon]);
    isPaused = false;
  }, 400);

  howToStart.style.bottom = "1rem";
  winnerDisplay.classList.remove("show");
  buttons.style.zIndex = "3";
  buttons.style.bottom = "-5rem";
};

const displayPokemon = (pokemon) => {
  pokemon.sort((_) => Math.random() - 0.5);
  const pokemonHTML = pokemon
    .map((pokemon) => {
      const type = pokemon.types[0]?.type?.name;
      const color = colors[type] || "#F5F5F5";
      return `
          <div class="card" onclick="clickCard(event)" data-pokename="${pokemon.name}" style="background-color:${color};">
            <div class="front">
            </div>
            <div class="back rotated" style="background-color:${color};">
              <img src="${pokemon.sprites.versions["generation-v"]["black-white"].animated.front_default}" alt="${pokemon.name}"  />
            </div>
        </div>
    `;
    })
    .join("");
  board.innerHTML = pokemonHTML;
};

const displayWinText = (score) => {
  const rating = document.querySelector("#rating");
  const winText = document.querySelector("#winText");
  const winImg = document.querySelector("#winImg");

  if (score < 60) {
    rating.innerText = "D";
    winText.innerText = "TRY HARDER!";
    winImg.src = "./images/win-d.gif";
  } else if (score >= 60 && score <= 69) {
    rating.innerText = "C";
    winText.innerText = "GOOD JOB!";
    winImg.src = "./images/win-c.gif";
  } else if (score >= 70 && score <= 79) {
    rating.innerText = "B";
    winText.innerText = "GREAT JOB!";
    winImg.src = "./images/win-b.gif";
  } else if (score >= 80 && score <= 89) {
    rating.innerText = "A";
    winText.innerText = "AWESOME!";
    winImg.src = "./images/win-a.gif";
  } else if (score >= 90 && score <= 99) {
    rating.innerText = "S";
    winText.innerText = "AMAZING!";
    winImg.src = "./images/win-s.gif";
  } else {
    rating.innerText = "S+";
    winText.innerText = "EXCELLENT!";
    winImg.src = "./images/win-s+.gif";
  }
};

const calcScore = () => {
  timeElapsed = seconds + minutes * 60;
  const timeDiff = maxTime - timeElapsed;
  if (timeDiff > 0) {
    score += timeDiff * 2;
    timeScore.innerText = timeDiff * 2 < 10 ? "0" + timeDiff * 2 : timeDiff * 2;
  }
  if (maxMoves - moves > 0) {
    score += (maxMoves - moves) * tryScore;
    moveScore.innerText =
      (maxMoves - moves) * tryScore < 10
        ? "0" + (maxMoves - moves) * tryScore
        : (maxMoves - moves) * tryScore;
  }
  tilesMatchedScore += boardSize * 4;
  tileScore.innerText =
    tilesMatchedScore < 10 ? "0" + tilesMatchedScore : tilesMatchedScore;
  score += tilesMatchedScore;

  return score;
};

const clickCard = (e) => {
  howToStart.style.bottom = "-5rem";
  buttons.style.bottom = "-0.5rem";

  if (!isExecuted) {
    setTimer = setInterval(startTime, 1000);
    isExecuted = true;
  }

  const pokemonCard = e.currentTarget;
  const [front, back] = getFrontAndBackFromCard(pokemonCard);
  if (front.classList.contains("rotated") || isPaused) {
    return;
  }
  isPaused = true;
  rotateElements([front, back]);
  if (!firstPick) {
    firstPick = pokemonCard;
    isPaused = false;
  } else {
    const secondPokemonName = pokemonCard.dataset.pokename;
    const firstPokemonName = firstPick.dataset.pokename;
    if (firstPokemonName !== secondPokemonName) {
      const [firstFront, firstBack] = getFrontAndBackFromCard(firstPick);
      setTimeout(() => {
        rotateElements([front, back, firstFront, firstBack]);
        firstPick = null;
        isPaused = false;
      }, 300);
      moves++;
      moveCount.innerText =
        moves < 10 ? "00" + moves : moves < 100 ? "0" + moves : moves;
    } else {
      matches++;
      moves++;
      moveCount.innerText =
        moves < 10 ? "00" + moves : moves < 100 ? "0" + moves : moves;

      if (matches === +boardSize) {
        clearInterval(setTimer);
        document.querySelector(".container").classList.toggle("overlay");

        totalScore.innerText = calcScore();

        const savedScores = localStorage.getItem("levelTopScores");
        const parsed = JSON.parse(savedScores);

        if (!localStorage.getItem("levelText")) {
          parsed["LEVEL 1"] =
            parsed["LEVEL 1"] < score ? score : parsed["LEVEL 1"];
          localStorage.setItem("levelTopScores", JSON.stringify(parsed));
        }

        if (parsed[`${localStorage.getItem("levelText")}`] < score) {
          parsed[`${localStorage.getItem("levelText")}`] = score;
          localStorage.setItem("levelTopScores", JSON.stringify(parsed));
        }

        displayWinText(score);
        winnerDisplay.classList.toggle("show");
        buttons.style.zIndex = "-1";
      }
      firstPick = null;
      isPaused = false;
    }
  }
};

const getFrontAndBackFromCard = (card) => {
  const front = card.querySelector(".front");
  const back = card.querySelector(".back");
  return [front, back];
};

const rotateElements = (elements) => {
  if (typeof elements !== "object" || !elements.length) return;
  elements.forEach((element) => element.classList.toggle("rotated"));
};

settingsBtn.addEventListener("click", () => {
  settingsBtn.classList.toggle("rotate");
  settingsMenu.classList.toggle("hide-menu");
  document.querySelector(".container").classList.toggle("overlay");

  if (!settings.classList.contains("hide-menu")) {
    hiScoresBtn.disabled = true;
    document.querySelector("#hiScoresBtn i").style.color = "gray";
    resetBtn.disabled = true;
    document.querySelector("#resetBtn i").style.color = "gray";
  } else {
    hiScoresBtn.disabled = false;
    document.querySelector("#hiScoresBtn i").style.color = "#f5c732";
    resetBtn.disabled = false;
    document.querySelector("#resetBtn i").style.color = "#f5c732";
  }
});

okayBtn.addEventListener("click", () => {
  const selectedLevel = document.querySelector('input[name="level"]:checked');
  settingsBtn.classList.toggle("rotate");
  settingsMenu.classList.toggle("hide-menu");
  hiScoresBtn.disabled = false;
  document.querySelector("#hiScoresBtn i").style.color = "#f5c732";
  resetBtn.disabled = false;
  document.querySelector("#resetBtn i").style.color = "#f5c732";
  selectedLevelText.innerText = selectedLevel.value;
  boardSize = +selectedLevel.getAttribute("id");
  localStorage.setItem("levelText", selectedLevel.value);
  localStorage.setItem("boardSize", boardSize);
  localStorage.setItem("checkedID", selectedLevel.id);
  localStorage.setItem("tryScore", selectedLevel.dataset.tryScore);
  localStorage.setItem("maxTime", selectedLevel.dataset.maxTime);
  localStorage.setItem("maxMoves", selectedLevel.dataset.maxMoves);
  document.querySelector(".container").classList.toggle("overlay");
  resetGame();
});

playBtn.addEventListener("click", () => {
  document.querySelector(".container").classList.toggle("overlay");
  resetGame();
});

hiScoresBtn.addEventListener("click", () => {
  topScores.classList.toggle("show");
  document.querySelector(".container").classList.toggle("overlay");
  if (topScores.classList.contains("show")) {
    settingsBtn.disabled = true;
    document.querySelector("#settingsBtn i").style.color = "gray";
    resetBtn.disabled = true;
    document.querySelector("#resetBtn i").style.color = "gray";
  } else {
    settingsBtn.disabled = false;
    document.querySelector("#settingsBtn i").style.color = "#f5c732";
    resetBtn.disabled = false;
    document.querySelector("#resetBtn i").style.color = "#f5c732";
  }
});

clearBtn.addEventListener("click", () => {
  clearBtn.classList.toggle("hide");
  document.querySelector(".questions").classList.toggle("hide");
});

document.querySelector("#yesBtn").addEventListener("click", () => {
  localStorage.removeItem("levelTopScores");
  clearBtn.classList.toggle("hide");
  document.querySelector(".questions").classList.toggle("hide");
  localStorage.setItem("levelTopScores", JSON.stringify(levelTopScores));
  document.querySelector("#lvl1TopScore").innerText = "0";
  document.querySelector("#lvl2TopScore").innerText = "0";
  document.querySelector("#lvl3TopScore").innerText = "0";
});

document.querySelector("#noBtn").addEventListener("click", () => {
  clearBtn.classList.toggle("hide");
  document.querySelector(".questions").classList.toggle("hide");
});

resetBtn.addEventListener("click", resetGame);
resetGame();
