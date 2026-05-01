let options = [];
let isAnimating = false;

const optionInput = document.getElementById('optionInput');
const addBtn = document.getElementById('addBtn');
const optionsList = document.getElementById('optionsList');

const emptyState = document.getElementById('emptyState');

const decideBtn = document.getElementById('decideBtn');
const resultSection = document.getElementById('resultSection');
const finalChoiceEl = document.getElementById('finalChoice');

const tryAgainBtn = document.getElementById('tryAgainBtn');

function init() {
  loadFromLocalStorage();

  attachEventListeners();

  renderOptions();
  updateDecideButton();

  initSoundToggle();
}


function attachEventListeners() {

  addBtn.addEventListener('click', handleAddOption);
  
  optionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {

      handleAddOption();
    }
  });


  
  decideBtn.addEventListener('click', handleDecide);

  tryAgainBtn.addEventListener('click', hideResult);
}

function handleAddOption() {
  const text = optionInput.value.trim();
  
  if (text === '') {
    shakeInput();
    return;
  }
  
  if (text.length > 50) {


    alert('too long ! 50 chars max');

    return;

  }
  
  if (options.some(opt => opt.text.toLowerCase() === text.toLowerCase())) {

    alert('gurl, we already got that one!');

    shakeInput();
    return;
  }
  
  const newOption = {

    id: Date.now(),
    text: text
  };
  
  options.push(newOption);
  
  optionInput.value = '';
  optionInput.focus();
  renderOptions();

  updateDecideButton();
  saveToLocalStorage();
  
  flashAddButton();
}

function removeOption(id) {
  options = options.filter(opt => opt.id !== id);

  renderOptions();
  updateDecideButton();

  saveToLocalStorage();
}

function renderOptions() {
  const existingOptions = optionsList.querySelectorAll('.option-card');

  existingOptions.forEach(card => card.remove());
  
  if (options.length === 0) {

    emptyState.style.display = 'block';
    return;

  } else {
    emptyState.style.display = 'none';
  }
  
  options.forEach((option, index) => {
    const card = createOptionCard(option, index);

    optionsList.appendChild(card);
  });

}

//optionss animation

function createOptionCard(option, index) {
  const card = document.createElement('div');

  card.className = 'option-card';
  card.dataset.id = option.id;
  
  card.style.animation = `slideIn 0.3s ease forwards`;

  card.style.animationDelay = `${index * 0.05}s`;
  card.style.opacity = '0';
  
  card.innerHTML = `
    <span class="option-text">${escapeHtml(option.text)}</span>
    <button class="btn-remove" onclick="removeOption(${option.id})" title="Remove">×</button>
  `;
  
  return card;
}

function updateDecideButton() {
  if (options.length >= 2 && !isAnimating) {

    decideBtn.disabled = false;
    decideBtn.textContent = `DECIDE NOW (${options.length})`;
  } else {
    decideBtn.disabled = true;
    if (options.length === 0) {
      decideBtn.textContent = 'DECIDE NOW';

    } else if (options.length === 1) {
      decideBtn.textContent = 'NEED MORE OPTIONS';
    }
  }
}


//pickig
function handleDecide() {
  if (options.length < 2 || isAnimating) return;
  
  isAnimating = true;
  decideBtn.disabled = true;

  decideBtn.textContent = 'DECIDING...';
  
  const randomIndex = Math.floor(Math.random() * options.length);
  const winner = options[randomIndex];
  
  animateSelection(winner);
}



function animateSelection(winner) {

  const cards = document.querySelectorAll('.option-card');
  
  if (cards.length === 0) return;
  
  let currentIndex = 0;
  let speed = 80;
  let cycles = 0;
  const minCycles = 15;

  const maxCycles = 25;
  const totalCycles = minCycles + Math.floor(Math.random() * (maxCycles - minCycles));
  
  const winnerIndex = options.findIndex(opt => opt.id === winner.id);
  
  let intervalId;
  
  function highlight() {
    cards.forEach(card => {

      card.classList.remove('highlighted');
    });
    

    cards[currentIndex].classList.add('highlighted');
    
    playTickSound();
    
    currentIndex = (currentIndex + 1) % cards.length;
    cycles++;
    
    if (cycles > minCycles) {

      speed += 25;
      clearInterval(intervalId);

      intervalId = setInterval(highlight, speed);
    }
    
    if (cycles >= totalCycles) {

      clearInterval(intervalId);

      landOnWinner(cards, winnerIndex, winner);
    }
  }
  
  intervalId = setInterval(highlight, speed);
}

//

function landOnWinner(cards, winnerIndex, winner) {

  cards.forEach(card => card.classList.remove('highlighted'));
  
  let finalHighlights = 0;

  const finalInterval = setInterval(() => {

    cards.forEach(card => card.classList.remove('highlighted'));
    
    if (finalHighlights % 2 === 0) {
      cards[winnerIndex].classList.add('highlighted', 'winner-pulse');
    }
    
    finalHighlights++;
    
    if (finalHighlights >= 6) {

      clearInterval(finalInterval);
      
      cards[winnerIndex].classList.add('highlighted', 'winner-glow');
      
      playWinnerSound();
      
      setTimeout(() => {
        showResult(winner.text);
        
        setTimeout(() => {
          cards.forEach(card => {

            card.classList.remove('highlighted', 'winner-pulse', 'winner-glow');
          });
          isAnimating = false;

          updateDecideButton();
        }, 500);
      }, 800);
    }
  }, 200);
}

function showResult(choice) {

  finalChoiceEl.textContent = choice;

  resultSection.classList.remove('hidden');
  
  if (typeof confetti !== 'undefined') {
    setTimeout(() => {
      confetti({
        particleCount: 150,

        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff00ff', '#00ffff', '#ffff00']
      });
    }, 200);
  }
}


function hideResult() {
  resultSection.classList.add('hidden');
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('pickforme_options', JSON.stringify(options));
  } catch (e) {
    console.error('save failed:', e);
  }
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('pickforme_options');
    if (saved) {
      options = JSON.parse(saved);
    }
  } catch (e) {
    console.error('load failed:', e);
    options = [];
  }
}
//sounds


let audioContext;
let tickSoundEnabled = true;

function initAudio() {


  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTickSound() {
  if (!tickSoundEnabled || !audioContext) return;
  
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  } catch (e) {
  }

}



function playWinnerSound() {
  if (!tickSoundEnabled || !audioContext) return;
  
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
  }
}


document.addEventListener('click', () => {
  initAudio();
}, { once: true });

function initSoundToggle() {
  const soundToggle = document.getElementById('soundToggle');
  const soundIcon = document.getElementById('soundIcon');
  
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      tickSoundEnabled = !tickSoundEnabled;
      soundIcon.textContent = tickSoundEnabled ? '🔊' : '🔇';
      soundToggle.classList.toggle('muted');
      
      localStorage.setItem('pickforme_sound', tickSoundEnabled);
    });
    
    const savedSound = localStorage.getItem('pickforme_sound');
    if (savedSound !== null) {
      tickSoundEnabled = savedSound === 'true';
      soundIcon.textContent = tickSoundEnabled ? '🔊' : '🔇';
      if (!tickSoundEnabled) {
        soundToggle.classList.add('muted');
      }
    }
  }
}

//flash ani



function shakeInput() {
  optionInput.classList.add('shake');
  setTimeout(() => {
    optionInput.classList.remove('shake');
  }, 500);
}

function flashAddButton() {
  addBtn.classList.add('flash');
  setTimeout(() => {
    addBtn.classList.remove('flash');
  }, 300);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

init();