import './style.css';
import { transitionScenarios } from './scenarios/transition.js';
import { SimulationEngine } from './engine.js';

// Initialisation de l'état de l'application
const engine = new SimulationEngine();
let activeScenario = null;
let activeUserMsgNode = null; // Référence vers le dernier message utilisateur envoyé

// Sélectionneurs d'éléments DOM
const sidebar = document.getElementById('sidebar');
const statsPanel = document.getElementById('stats-panel');
const currentScoreVal = document.getElementById('current-score-val');
const progressVal = document.getElementById('progress-val');
const attemptsVal = document.getElementById('attempts-val');
const sessionProgressBar = document.getElementById('session-progress-bar');
const scenarioList = document.getElementById('scenario-list');

// Écrans
const screens = {
  welcome: document.getElementById('screen-welcome'),
  briefing: document.getElementById('screen-briefing'),
  chat: document.getElementById('screen-chat'),
  debriefing: document.getElementById('screen-debriefing')
};

// Grille d'accueil
const welcomeScenariosGrid = document.getElementById('welcome-scenarios-grid');

// Briefing Elements
const briefProspectAvatar = document.getElementById('brief-prospect-avatar');
const briefProspectName = document.getElementById('brief-prospect-name');
const briefProspectTitle = document.getElementById('brief-prospect-title');
const briefMetricSize = document.getElementById('brief-metric-size');
const briefMetricCrm = document.getElementById('brief-metric-crm');
const briefMetricDiff = document.getElementById('brief-metric-diff');
const briefProspectDetails = document.getElementById('brief-prospect-details');
const briefCoachDirective = document.getElementById('brief-coach-directive');
const btnStartSimulation = document.getElementById('btn-start-simulation');
const btnBackWelcome1 = document.getElementById('btn-back-welcome-1');

// Chat Elements
const btnMobileBack = document.getElementById('btn-mobile-back');
const btnAbortChat = document.getElementById('btn-abort-chat');
const chatProspectAvatar = document.getElementById('chat-prospect-avatar');
const chatProspectName = document.getElementById('chat-prospect-name');
const chatMessagesContainer = document.getElementById('chat-messages-container');
const inputGuideline = document.getElementById('input-guideline');
const chatInputForm = document.getElementById('chat-input-form');
const chatTextarea = document.getElementById('chat-textarea');
const btnSendMessage = document.getElementById('btn-send-message');

// Coaching Panel (ATTY)
const attyStateObservation = document.getElementById('atty-state-observation');
const attyStateFeedback = document.getElementById('atty-state-feedback');
const feedbackRatingBadge = document.getElementById('feedback-rating-badge');
const attyScoreNum = document.getElementById('atty-score-num');
const attyFeedbackText = document.getElementById('atty-feedback-text');
const btnAttyRetry = document.getElementById('btn-atty-retry');
const btnAttyContinue = document.getElementById('btn-atty-continue');

// Modal Elements
const btnToggleContext = document.getElementById('btn-toggle-context');
const contextModal = document.getElementById('context-modal');
const btnCloseContextModal = document.getElementById('btn-close-context-modal');
const modalProspectAvatar = document.getElementById('modal-prospect-avatar');
const modalProspectName = document.getElementById('modal-prospect-name');
const modalProspectTitle = document.getElementById('modal-prospect-title');
const modalMetricSize = document.getElementById('modal-metric-size');
const modalMetricCrm = document.getElementById('modal-metric-crm');
const modalProspectDetails = document.getElementById('modal-prospect-details');
const modalCoachDirective = document.getElementById('modal-coach-directive');

// Debriefing Elements
const debriefGradeBadge = document.getElementById('debrief-grade-badge');
const finalScoreVal = document.getElementById('final-score-val');
const debriefSummaryText = document.getElementById('debrief-summary-text');
const debriefStepsList = document.getElementById('debrief-steps-list');
const btnRetryScenario = document.getElementById('btn-retry-scenario');
const btnBackWelcome2 = document.getElementById('btn-back-welcome-2');

// --- FONCTIONS DE NAVIGATION ---

function showScreen(screenKey) {
  Object.values(screens).forEach(screen => screen.classList.remove('active'));
  screens[screenKey].classList.add('active');
  
  if (screenKey === 'chat' || screenKey === 'debriefing') {
    statsPanel.style.display = 'block';
  } else {
    statsPanel.style.display = 'none';
  }
  
  sidebar.classList.remove('mobile-open');
}

// Rendu des listes et des cartes
function renderScenarios() {
  scenarioList.innerHTML = '';
  welcomeScenariosGrid.innerHTML = '';
  
  transitionScenarios.forEach((scenario, index) => {
    // 1. Sidebar list
    const listItem = document.createElement('li');
    listItem.className = `scenario-item ${activeScenario?.id === scenario.id ? 'active' : ''}`;
    listItem.innerHTML = `
      <span class="scenario-name">${scenario.title}</span>
      <div class="scenario-meta">
        <span class="difficulty-badge ${scenario.difficultyClass}">${scenario.difficulty}</span>
        <span class="turns-count">${scenario.turns.length} étapes</span>
      </div>
    `;
    listItem.addEventListener('click', () => selectScenario(scenario));
    scenarioList.appendChild(listItem);
    
    // 2. Welcome grid cards
    const card = document.createElement('div');
    card.className = 'scenario-card';
    card.innerHTML = `
      <div class="scenario-card-header">
        <h3>${scenario.title}</h3>
        <span class="difficulty-badge ${scenario.difficultyClass}">${scenario.difficulty}</span>
      </div>
      <p>${scenario.shortDescription}</p>
      <div class="scenario-card-footer">
        <span class="card-stat">${scenario.turns.length} échanges • Coach ATTY</span>
        <button class="btn-card-action">S'entraîner &rarr;</button>
      </div>
    `;
    card.addEventListener('click', () => selectScenario(scenario));
    welcomeScenariosGrid.appendChild(card);
  });
}

// Sélection d'un scénario (Briefing & Modal sync)
function selectScenario(scenario) {
  activeScenario = scenario;
  
  // Remplir briefing screen
  briefProspectAvatar.textContent = scenario.prospect.avatarInitials;
  briefProspectName.textContent = scenario.prospect.name;
  briefProspectTitle.textContent = `${scenario.prospect.title} chez ${scenario.prospect.company}`;
  briefMetricSize.textContent = scenario.prospect.teamSize;
  briefMetricCrm.textContent = scenario.prospect.crm;
  briefMetricDiff.textContent = scenario.difficulty;
  briefMetricDiff.className = `difficulty-badge ${scenario.difficultyClass}`;
  briefProspectDetails.textContent = scenario.prospect.details;
  briefCoachDirective.textContent = `"${scenario.coachBrief}"`;
  
  // Remplir modal popover
  modalProspectAvatar.textContent = scenario.prospect.avatarInitials;
  modalProspectName.textContent = scenario.prospect.name;
  modalProspectTitle.textContent = `${scenario.prospect.title} chez ${scenario.prospect.company}`;
  modalMetricSize.textContent = scenario.prospect.teamSize;
  modalMetricCrm.textContent = scenario.prospect.crm;
  modalProspectDetails.textContent = scenario.prospect.details;
  modalCoachDirective.textContent = `"${scenario.coachBrief}"`;
  
  // Mettre à jour la sidebar active state
  document.querySelectorAll('.scenario-item').forEach((item, index) => {
    if (transitionScenarios[index].id === scenario.id) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  showScreen('briefing');
}

// --- LOGIQUE DU CHAT ---

function startSimulation() {
  if (!activeScenario) return;
  
  engine.startScenario(activeScenario);
  
  // Configurer en-tête chat
  chatProspectAvatar.textContent = activeScenario.prospect.avatarInitials;
  chatProspectName.textContent = activeScenario.prospect.name;
  
  // Réinitialiser les messages
  chatMessagesContainer.innerHTML = '';
  activeUserMsgNode = null;
  
  // Configurer ATTY en mode observation
  showAttyObservation();
  
  // Mettre à jour stats
  updateStatsUI();
  
  showScreen('chat');
  
  // Lancer prospect message
  triggerProspectMessage();
}

function updateStatsUI() {
  currentScoreVal.textContent = engine.getFinalScore();
  attemptsVal.textContent = engine.attempts;
  
  const currentTurn = engine.currentTurnIndex;
  const totalTurns = activeScenario ? activeScenario.turns.length : 0;
  progressVal.textContent = `${currentTurn}/${totalTurns}`;
  
  const progressPercent = totalTurns > 0 ? (currentTurn / totalTurns) * 100 : 0;
  sessionProgressBar.style.width = `${progressPercent}%`;
}

function triggerProspectMessage() {
  setChatInputDisabled(true);
  inputGuideline.textContent = "Le prospect est en train d'écrire...";
  
  const typingIndicator = createTypingIndicator();
  chatMessagesContainer.appendChild(typingIndicator);
  scrollChatToBottom();
  
  setTimeout(() => {
    typingIndicator.remove();
    
    const messageText = engine.getCurrentProspectMessage();
    if (messageText) {
      addMessageToFeed('prospect', messageText);
      scrollChatToBottom();
    }
    
    setChatInputDisabled(false);
    
    const guideline = engine.getCurrentGuideline();
    inputGuideline.textContent = guideline || "Répondez comme en situation réelle.";
    
    chatTextarea.focus();
  }, 1500);
}

function setChatInputDisabled(disabled) {
  chatTextarea.disabled = disabled;
  btnSendMessage.disabled = disabled;
  if (disabled) {
    chatInputForm.classList.add('disabled');
  } else {
    chatInputForm.classList.remove('disabled');
  }
}

function createTypingIndicator() {
  const container = document.createElement('div');
  container.className = 'chat-msg-row prospect';
  container.innerHTML = `
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  return container;
}

function addMessageToFeed(sender, text) {
  const row = document.createElement('div');
  row.className = `chat-msg-row ${sender}`;
  const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  
  row.innerHTML = `
    <div class="msg-bubble">
      <p>${escapeHTML(text)}</p>
      <span class="msg-time">${time}</span>
    </div>
  `;
  
  chatMessagesContainer.appendChild(row);
  return row;
}

function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function scrollChatToBottom() {
  chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

// Soumission de la réponse utilisateur
function handleUserSubmit(e) {
  e.preventDefault();
  
  const userText = chatTextarea.value.trim();
  if (!userText) return;
  
  chatTextarea.value = '';
  chatTextarea.style.height = 'auto';
  
  setChatInputDisabled(true);
  
  // Conserver la référence vers ce message pour un éventuel "Réessayer"
  activeUserMsgNode = addMessageToFeed('user', userText);
  scrollChatToBottom();
  
  // Analyser
  const analysis = engine.analyzeResponse(userText);
  
  // Afficher feedback d'ATTY après 800ms
  setTimeout(() => {
    showAttyFeedback(analysis);
  }, 800);
}

// --- LOGIQUE PANEL ATTY ---

function showAttyObservation() {
  attyStateObservation.style.display = 'flex';
  attyStateFeedback.style.display = 'none';
}

function showAttyFeedback(analysis) {
  attyStateObservation.style.display = 'none';
  attyStateFeedback.style.display = 'block';
  
  // Configurer le badge
  let badgeText = "Analyse";
  if (analysis.type === 'success') badgeText = "Excellent";
  else if (analysis.type === 'warning') badgeText = "À améliorer";
  else if (analysis.type === 'error') badgeText = "À éviter";
  
  feedbackRatingBadge.textContent = badgeText;
  feedbackRatingBadge.className = `feedback-badge ${analysis.type}`;
  
  attyScoreNum.textContent = analysis.score;
  attyFeedbackText.textContent = analysis.feedback;
}

// Événement Réessayer (Coach ATTY)
function handleAttyRetry() {
  engine.retryTurn();
  
  // Retirer le message du chat
  if (activeUserMsgNode) {
    activeUserMsgNode.remove();
    activeUserMsgNode = null;
  }
  
  // Remettre ATTY en observation
  showAttyObservation();
  
  // Mettre à jour tentatives
  updateStatsUI();
  
  // Réactiver la saisie
  setChatInputDisabled(false);
  chatTextarea.focus();
  scrollChatToBottom();
}

// Événement Continuer (Coach ATTY)
function handleAttyContinue() {
  const commitResult = engine.commitTurn();
  activeUserMsgNode = null;
  
  // Remettre ATTY en observation pour le prochain tour
  showAttyObservation();
  
  // Mettre à jour l'UI des stats
  updateStatsUI();
  
  if (commitResult.isFinished) {
    showFinalDebrief();
  } else {
    triggerProspectMessage();
  }
}

// --- LOGIQUE DEBRIEFING ---

function showFinalDebrief() {
  const debrief = engine.getDebriefing();
  
  debriefGradeBadge.textContent = debrief.grade;
  debriefGradeBadge.className = `debrief-badge ${debrief.gradeClass}`;
  
  finalScoreVal.textContent = debrief.score;
  debriefSummaryText.innerHTML = debrief.feedback;
  
  debriefStepsList.innerHTML = '';
  debrief.history.forEach((step, index) => {
    const stepCard = document.createElement('div');
    stepCard.className = 'debrief-step-card';
    stepCard.innerHTML = `
      <div class="debrief-step-header">
        <span class="step-num">Échange ${index + 1} / ${debrief.history.length}</span>
        <span class="step-score ${step.type}">Score : ${step.score}/10</span>
      </div>
      <div class="debrief-step-exchanges">
        <div class="exchange-row">
          <strong>Prospect :</strong> "${escapeHTML(step.prospectMessage)}"
        </div>
        <div class="exchange-row">
          <strong>Ta réponse :</strong> "${escapeHTML(step.userMessage)}"
        </div>
      </div>
      <div class="debrief-step-feedback">
        <strong>ATTY :</strong> ${escapeHTML(step.feedback)}
      </div>
    `;
    debriefStepsList.appendChild(stepCard);
  });
  
  showScreen('debriefing');
}

// --- SETUP EVENTS & INITIALISATION ---

function initApp() {
  renderScenarios();
  
  // Navigation générale
  btnBackWelcome1.addEventListener('click', () => showScreen('welcome'));
  btnBackWelcome2.addEventListener('click', () => {
    activeScenario = null;
    renderScenarios();
    showScreen('welcome');
  });
  
  btnStartSimulation.addEventListener('click', startSimulation);
  chatInputForm.addEventListener('submit', handleUserSubmit);
  
  // Saisie textarea
  chatTextarea.addEventListener('input', () => {
    chatTextarea.style.height = 'auto';
    chatTextarea.style.height = `${chatTextarea.scrollHeight}px`;
  });
  
  chatTextarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!chatTextarea.disabled) {
        chatInputForm.requestSubmit();
      }
    }
  });
  
  // Actions ATTY (Sidebar droite)
  btnAttyRetry.addEventListener('click', handleAttyRetry);
  btnAttyContinue.addEventListener('click', handleAttyContinue);
  
  // Modal de Contexte
  btnToggleContext.addEventListener('click', () => {
    contextModal.style.display = 'flex';
  });
  
  btnCloseContextModal.addEventListener('click', () => {
    contextModal.style.display = 'none';
  });
  
  contextModal.addEventListener('click', (e) => {
    if (e.target === contextModal) {
      contextModal.style.display = 'none';
    }
  });
  
  // Abandonner
  btnAbortChat.addEventListener('click', () => {
    if (confirm('Es-tu sûr de vouloir abandonner cette simulation ? Ta progression sera perdue.')) {
      activeScenario = null;
      renderScenarios();
      showScreen('welcome');
    }
  });
  
  btnRetryScenario.addEventListener('click', () => {
    startSimulation();
  });
  
  // Sidebar Responsive Mobile
  btnMobileBack.addEventListener('click', () => {
    sidebar.classList.add('mobile-open');
  });
  
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && e.target !== btnMobileBack) {
        sidebar.classList.remove('mobile-open');
      }
    }
  });
}

// Démarrage
document.addEventListener('DOMContentLoaded', initApp);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initApp();
}
