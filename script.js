
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
  
  // 
  if (text === '') {
    shakeInput();
    return;
  }
  
  if (text.length > 50) {
    alert('Option too long! Keep it under 50 characters.');
    return;
  }
  
  //  duplicates
  if (options.some(opt => opt.text.toLowerCase() === text.toLowerCase())) {
    alert('This option already exists!');
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
    decideBtn.textContent = ` DECIDE FOR ME (${options.length} options)`;
  } else {
    decideBtn.disabled = true;
    if (options.length === 0) {
      decideBtn.textContent = ' DECIDE FOR ME';
    } else if (options.length === 1) {
      decideBtn.textContent = 'Add at least one more option';
    }
  }
}


function handleDecide() {
  if (options.length < 2 || isAnimating) return;
  
  isAnimating = true;
  decideBtn.disabled = true;
  decideBtn.textContent = ' Deciding...';
  
  //  pick randomly after a delay
  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * options.length);
    const winner = options[randomIndex];
    showResult(winner.text);
    isAnimating = false;
    updateDecideButton();
  }, 1000);
}


function showResult(choice) {
  finalChoiceEl.textContent = choice;
  resultSection.classList.remove('hidden');
}

function hideResult() {
  resultSection.classList.add('hidden');
}


function saveToLocalStorage() {
  try {
    localStorage.setItem('pickforme_options', JSON.stringify(options));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('pickforme_options');
    if (saved) {
      options = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
    options = [];
  }
}


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