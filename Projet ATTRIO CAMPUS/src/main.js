import './style.css'
import attrioLogo from './assets/brand/attrio-logo-a.jpg'
import attyMascot from './assets/brand/atty-mascot.jpg'
import { SimulationEngine } from './engines/simulation-engine.js'
import { trainingScenarios } from './data/scenarios.js'
import { getPersona } from './data/personas.js'
import { trainingPaths, getTrainingPath, getNextScenarioRecommendation } from './data/training-paths.js'
import {
  getCoachWelcomeBrief,
  getContextualHelp,
  getCurrentStageCopy,
  getProcessMantra,
  getProcessStages,
} from './engines/coach-engine.js'

const app = document.querySelector('#app')
const engine = new SimulationEngine()
const processStages = getProcessStages()
const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
})

const state = {
  screen: 'welcome',
  selectedScenarioId: trainingScenarios[0]?.id ?? null,
  sidebarOpen: false,
  contextModalOpen: false,
  chatMessages: [],
  draftMessage: '',
  pendingMessage: '',
  debriefing: null,
  contextualHelpOpen: false,
  helpRequestsCount: 0,
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function getSelectedScenario() {
  return trainingScenarios.find((scenario) => scenario.id === state.selectedScenarioId) ?? trainingScenarios[0] ?? null
}

function getScenarioById(scenarioId) {
  return trainingScenarios.find((scenario) => scenario.id === scenarioId) ?? null
}

function getSelectedPersona() {
  const scenario = getSelectedScenario()
  return scenario ? getPersona(scenario.personaId) : null
}

function getSelectedTrainingPath() {
  const scenario = getSelectedScenario()
  return scenario ? getTrainingPath(scenario.trainingPathId) : null
}

function getScenariosForPath(pathId) {
  return trainingScenarios.filter((scenario) => scenario.trainingPathId === pathId)
}

function getCurrentAnalysis() {
  return engine.activeTurnAnalysis
}

function getCurrentContextualHelp() {
  const scenario = getSelectedScenario()
  const persona = getSelectedPersona()
  const step = engine.getCurrentStep?.()
  const stageId = engine.getCurrentStageId()

  if (!scenario || !persona || !step || !stageId) return null

  return getContextualHelp({ stageId, persona, scenario, step })
}

function getSessionProgress() {
  const scenario = getSelectedScenario()
  if (!scenario) {
    return {
      score: 0,
      attempts: 0,
      progressText: '0/0',
      progressRatio: 0,
      isVisible: false,
    }
  }

  const completedSteps = engine.history.length
  const totalSteps = scenario.steps.length

  return {
    score: engine.getFinalScore(),
    attempts: engine.attempts,
    progressText: `${completedSteps}/${totalSteps}`,
    progressRatio: totalSteps === 0 ? 0 : (completedSteps / totalSteps) * 100,
    isVisible: Boolean(engine.currentScenario),
  }
}

function createMessage(role, text) {
  return {
    role,
    text,
    time: timeFormatter.format(new Date()),
  }
}

function hasOngoingSimulation() {
  return Boolean(engine.currentScenario) && state.chatMessages.length > 0 && !state.debriefing
}

function confirmBeforeDiscard(nextAction) {
  if (!hasOngoingSimulation()) {
    nextAction()
    return
  }

  if (window.confirm('Quitter la simulation en cours ? Votre progression actuelle sera perdue.')) {
    nextAction()
  }
}

function resetSessionState() {
  engine.reset()
  state.chatMessages = []
  state.draftMessage = ''
  state.pendingMessage = ''
  state.debriefing = null
  state.contextModalOpen = false
  state.contextualHelpOpen = false
  state.helpRequestsCount = 0
}

function openScenario(scenarioId) {
  confirmBeforeDiscard(() => {
    state.selectedScenarioId = scenarioId
    resetSessionState()
    state.screen = 'briefing'
    state.sidebarOpen = false
    render()
  })
}

function goToWelcome() {
  confirmBeforeDiscard(() => {
    resetSessionState()
    state.screen = 'welcome'
    state.sidebarOpen = false
    render()
  })
}

function startScenario() {
  const scenario = getSelectedScenario()
  if (!scenario) return

  const firstProspectMessage = engine.startScenario(scenario)

  state.screen = 'chat'
  state.sidebarOpen = false
  state.contextModalOpen = false
  state.debriefing = null
  state.pendingMessage = ''
  state.draftMessage = ''
  state.contextualHelpOpen = false
  state.chatMessages = firstProspectMessage ? [createMessage('prospect', firstProspectMessage)] : []

  render()
  focusTextarea()
}

function submitMessage() {
  if (getCurrentAnalysis()) return

  const textarea = document.querySelector('#chat-textarea')
  const text = (textarea?.value ?? state.draftMessage).trim()

  if (!text) return

  state.pendingMessage = text
  state.draftMessage = ''
  state.contextualHelpOpen = false
  state.chatMessages.push(createMessage('user', text))
  engine.analyzeResponse(text)

  render()
}

function retryPendingMessage() {
  engine.retryTurn()

  if (state.chatMessages.at(-1)?.role === 'user') {
    state.chatMessages.pop()
  }

  state.draftMessage = state.pendingMessage
  state.pendingMessage = ''
  state.contextualHelpOpen = false

  render()
  focusTextarea(true)
}

function continueSimulation() {
  const result = engine.commitTurn()
  if (!result) return

  state.pendingMessage = ''
  state.draftMessage = ''
  state.contextualHelpOpen = false

  if (result.isFinished) {
    state.debriefing = engine.getDebriefing()
    state.screen = 'debriefing'
    render()
    return
  }

  if (result.nextProspectMessage) {
    state.chatMessages.push(createMessage('prospect', result.nextProspectMessage))
  }

  render()
  focusTextarea()
}

function restartScenario() {
  resetSessionState()
  startScenario()
}

function abortSimulation() {
  confirmBeforeDiscard(() => {
    resetSessionState()
    state.screen = 'briefing'
    render()
  })
}

function toggleContextualHelp() {
  const willOpen = !state.contextualHelpOpen
  state.contextualHelpOpen = willOpen
  if (willOpen) {
    state.helpRequestsCount += 1
  }
  render()
  if (!state.contextualHelpOpen) {
    focusTextarea()
  }
}

function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildDebriefReportModel() {
  const scenario = getSelectedScenario()
  const persona = getSelectedPersona()
  const trainingPath = getSelectedTrainingPath()
  const debrief = state.debriefing

  if (!scenario || !persona || !debrief) return null

  const generatedAt = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date())

  const recommendation = getNextScenarioRecommendation(
    scenario.id,
    debrief.progressionPercentage ?? debrief.percentage,
  )
  const recommendedScenario =
    recommendation?.type === 'next' ? getScenarioById(recommendation.scenarioId) : null

  return {
    generatedAt,
    trainingPathTitle: trainingPath?.title ?? '—',
    scenarioTitle: scenario.title,
    personaLabel: `${persona.name} — ${persona.title} chez ${persona.company}`,
    level: scenario.difficulty,
    score: debrief.score,
    maxScore: debrief.maxScore,
    percentage: debrief.percentage,
    processScore: debrief.processScore,
    processMaxScore: debrief.processMaxScore,
    processPercentage: debrief.processPercentage,
    expressionScore: debrief.expressionScore,
    expressionMaxScore: debrief.expressionMaxScore,
    expressionPercentage: debrief.expressionPercentage,
    grade: debrief.grade,
    attempts: debrief.attempts,
    helpRequestsCount: state.helpRequestsCount,
    feedback: debrief.feedback,
    strengths: debrief.strengths,
    watchouts: debrief.watchouts,
    expressionSummary: debrief.expressionSummary,
    expressionStrengths: debrief.expressionStrengths,
    expressionWatchouts: debrief.expressionWatchouts,
    history: debrief.history,
    recommendationMessage: recommendation?.message ?? 'Aucune recommandation supplémentaire.',
    recommendedScenarioTitle: recommendedScenario?.title ?? '',
  }
}

function buildDebriefPdfHtml() {
  const model = buildDebriefReportModel()
  if (!model) return null

  const renderList = (list, fallbackText, formatter) =>
    list.length > 0
      ? `<ul>${list.map((item) => `<li>${formatter(item)}</li>`).join('')}</ul>`
      : `<p class="muted">${escapeHtml(fallbackText)}</p>`

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Rapport ATTRIO CAMPUS</title>
        <style>
          :root {
            --bg: #f5f5f0;
            --panel: #ffffff;
            --text: #0a0a0a;
            --muted: #4a4a44;
            --soft: #6b6b62;
            --border: #deded6;
            --accent: #4f46e5;
            --accent-2: #7c3aed;
            --success: #10b981;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 32px;
            background: var(--bg);
            color: var(--text);
            font-family: Inter, Arial, sans-serif;
            line-height: 1.5;
          }
          .page {
            max-width: 840px;
            margin: 0 auto;
            background: var(--panel);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 32px;
          }
          .eyebrow {
            display: inline-block;
            margin-bottom: 12px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #fff;
            background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
            border-radius: 999px;
            padding: 6px 10px;
            font-weight: 700;
          }
          h1 {
            margin: 0 0 12px;
            font-size: 30px;
            line-height: 1.05;
            letter-spacing: -0.03em;
          }
          h2 {
            font-size: 16px;
            margin: 28px 0 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .lead { color: var(--muted); margin: 0 0 18px; }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin: 20px 0 24px;
          }
          .meta-card {
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 14px;
            background: #fafaf8;
          }
          .meta-card span {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--soft);
            margin-bottom: 4px;
          }
          .meta-card strong {
            font-size: 18px;
            letter-spacing: -0.02em;
          }
          .meta-card small {
            display: block;
            margin-top: 4px;
            color: var(--soft);
            font-size: 12px;
          }
          .section {
            margin-top: 18px;
            padding-top: 18px;
            border-top: 1px solid var(--border);
          }
          .callout {
            background: linear-gradient(180deg, rgba(79, 70, 229, 0.06) 0%, rgba(124, 58, 237, 0.04) 100%);
            border: 1px solid rgba(79, 70, 229, 0.12);
            border-radius: 14px;
            padding: 16px;
          }
          .muted { color: var(--muted); }
          ul {
            margin: 10px 0 0;
            padding-left: 18px;
          }
          li { margin-bottom: 8px; }
          .history-item {
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 14px;
            margin-bottom: 12px;
            page-break-inside: avoid;
          }
          .history-head {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 8px;
            font-weight: 700;
          }
          .history-subscore-row {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 10px;
          }
          .subscore-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            border-radius: 999px;
            background: #f5f5f0;
            border: 1px solid var(--border);
            font-size: 12px;
          }
          .rewrite-box {
            margin-top: 10px;
            padding: 12px;
            border-radius: 12px;
            background: rgba(79, 70, 229, 0.06);
            border: 1px solid rgba(79, 70, 229, 0.12);
          }
          .rewrite-box strong {
            display: block;
            margin-bottom: 4px;
          }
          .score {
            color: var(--success);
          }
          .label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--soft);
            margin-bottom: 2px;
          }
          .value {
            margin-bottom: 10px;
            color: var(--text);
          }
          .footer-note {
            margin-top: 24px;
            font-size: 12px;
            color: var(--soft);
          }
          @media print {
            body { padding: 0; background: #fff; }
            .page { border: none; border-radius: 0; max-width: none; }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <div class="eyebrow">ATTRIO CAMPUS</div>
          <h1>Rapport de simulation commerciale</h1>
          <p class="lead">Généré le ${escapeHtml(model.generatedAt)} • ${escapeHtml(model.scenarioTitle)}</p>

          <div class="meta-grid">
            <div class="meta-card">
              <span>Score final</span>
              <strong>${escapeHtml(`${model.score} / ${model.maxScore}`)}</strong>
              <small>${escapeHtml(`${model.percentage}%`)}</small>
            </div>
            <div class="meta-card">
              <span>Fond</span>
              <strong>${escapeHtml(`${model.processScore} / ${model.processMaxScore}`)}</strong>
              <small>${escapeHtml(`${model.processPercentage}%`)}</small>
            </div>
            <div class="meta-card">
              <span>Forme</span>
              <strong>${escapeHtml(`${model.expressionScore} / ${model.expressionMaxScore}`)}</strong>
              <small>${escapeHtml(`${model.expressionPercentage}%`)}</small>
            </div>
          </div>

          <section class="section">
            <h2>Résultat global</h2>
            <p><strong>Niveau atteint :</strong> ${escapeHtml(model.grade)}</p>
            <p><strong>Aides demandées :</strong> ${escapeHtml(String(model.helpRequestsCount))}</p>
          </section>

          <section class="section">
            <h2>Contexte</h2>
            <p><strong>Parcours :</strong> ${escapeHtml(model.trainingPathTitle)}</p>
            <p><strong>Persona :</strong> ${escapeHtml(model.personaLabel)}</p>
            <p><strong>Niveau :</strong> ${escapeHtml(model.level)}</p>
            <p><strong>Tentatives :</strong> ${escapeHtml(String(model.attempts))}</p>
          </section>

          <section class="section">
            <h2>Lecture globale d’ATTY</h2>
            <div class="callout">
              <p>${escapeHtml(model.feedback)}</p>
            </div>
          </section>

          <section class="section">
            <h2>Lecture de la forme</h2>
            <div class="callout">
              <p>${escapeHtml(model.expressionSummary)}</p>
            </div>
          </section>

          <section class="section">
            <h2>Points forts</h2>
            ${renderList(
              model.strengths,
              "Aucune étape n'a été vraiment dominée cette fois.",
              (item) => `<strong>${escapeHtml(item.stageLabel)}</strong> — ${escapeHtml(item.stageObjective || item.feedback)}`,
            )}
          </section>

          <section class="section">
            <h2>Points à renforcer</h2>
            ${renderList(
              model.watchouts,
              'Le process est resté globalement cohérent sur toute la simulation.',
              (item) => `<strong>${escapeHtml(item.stageLabel)}</strong> — ${escapeHtml(item.improvementHint || item.feedback)}`,
            )}
          </section>

          <section class="section">
            <h2>Expression commerciale</h2>
            ${renderList(
              model.expressionWatchouts,
              'La forme est restée globalement propre sur l’ensemble de la simulation.',
              (item) => `<strong>${escapeHtml(item.label)}</strong> — ${escapeHtml(item.detail)}`,
            )}
          </section>

          <section class="section">
            <h2>Historique détaillé</h2>
            ${model.history
              .map(
                (step, index) => `
                  <article class="history-item">
                    <div class="history-head">
                      <span>Étape ${index + 1} — ${escapeHtml(step.stageLabel)}</span>
                      <span class="score">${escapeHtml(`${step.score}/10`)}</span>
                    </div>
                    <div class="history-subscore-row">
                      <span class="subscore-chip">Fond ${escapeHtml(`${step.processScore ?? step.score}/10`)}</span>
                      <span class="subscore-chip">Forme ${escapeHtml(`${step.expressionScore ?? 0}/10`)}</span>
                    </div>
                    <div class="label">Prospect</div>
                    <div class="value">${escapeHtml(step.prospectMessage)}</div>
                    <div class="label">Réponse commerciale</div>
                    <div class="value">${escapeHtml(step.userMessage)}</div>
                    <div class="label">Feedback ATTY</div>
                    <div class="value">${escapeHtml(step.feedback)}</div>
                    ${
                      step.expression?.rewrite
                        ? `
                      <div class="rewrite-box">
                        <strong>Formulation plus pro</strong>
                        <div>${escapeHtml(step.expression.rewrite)}</div>
                      </div>
                    `
                        : ''
                    }
                  </article>
                `,
              )
              .join('')}
          </section>

          <section class="section">
            <h2>Suite recommandée</h2>
            <p>${escapeHtml(model.recommendationMessage)}</p>
            ${
              model.recommendedScenarioTitle
                ? `<p><strong>Scénario conseillé :</strong> ${escapeHtml(model.recommendedScenarioTitle)}</p>`
                : ''
            }
          </section>

          <p class="footer-note">Dans la boîte de dialogue d’impression, choisis “Enregistrer en PDF”.</p>
        </main>
      </body>
    </html>
  `
}

function exportDebriefReport() {
  const scenario = getSelectedScenario()
  const html = buildDebriefPdfHtml()
  if (!scenario || !html) return

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=980,height=1200')

  if (!printWindow) {
    window.alert("Autorise les pop-ups pour exporter le rapport en PDF.")
    return
  }

  const documentTitle = `ATTRIO CAMPUS — ${scenario.title}`
  printWindow.document.open()
  printWindow.document.write(html.replace('<title>Rapport ATTRIO CAMPUS</title>', `<title>${escapeHtml(documentTitle)}</title>`))
  printWindow.document.close()
  printWindow.focus()
  printWindow.onload = () => {
    printWindow.print()
  }
}

function focusTextarea(moveToEnd = false) {
  const textarea = document.querySelector('#chat-textarea')
  if (!textarea) return

  textarea.focus()
  if (moveToEnd) {
    const length = textarea.value.length
    textarea.setSelectionRange(length, length)
  }
  autoResizeTextarea(textarea)
}

function autoResizeTextarea(textarea) {
  if (!textarea) return
  textarea.style.height = 'auto'
  textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`
}

function renderProcessTimeline({ activeStageId = null, completedCount = 0, isComplete = false, compact = false }) {
  const currentIndex = processStages.findIndex((stage) => stage.id === activeStageId)

  return `
    <div class="process-timeline ${compact ? 'compact' : ''}">
      ${processStages
        .map((stage, index) => {
          let status = 'pending'
          if (isComplete || index < completedCount) status = 'completed'
          if (!isComplete && currentIndex === index) status = 'current'

          return `
            <div class="stage-chip ${status}">
              <span class="stage-chip-index">${index + 1}</span>
              <div class="stage-chip-copy">
                <strong>${escapeHtml(compact ? stage.shortLabel : stage.label)}</strong>
                ${compact ? '' : `<span>${escapeHtml(stage.objective)}</span>`}
              </div>
            </div>
          `
        })
        .join('')}
    </div>
  `
}

function renderTagRow(tags = [], className = 'driver-tag') {
  if (!tags || tags.length === 0) return ''

  return `
    <div class="tag-row">
      ${tags
        .map((tag) => `<span class="${className}">${escapeHtml(tag)}</span>`)
        .join('')}
    </div>
  `
}

function renderBrandLockup(mode = 'default') {
  const isHero = mode === 'hero'

  return `
    <div class="brand-lockup ${isHero ? 'hero' : ''}">
      <div class="brand-mark-shell">
        <img class="brand-mark-image" src="${attrioLogo}" alt="Logo Attrio" />
      </div>
      <div class="brand-lockup-copy">
        <strong>ATTRIO CAMPUS</strong>
        <span>${escapeHtml(isHero ? 'Vos bâtiments, sous contrôle.' : 'Simulation de vente structurée')}</span>
      </div>
    </div>
  `
}

function renderLearningPathOverview() {
  return `
    <section class="learning-paths-overview">
      <div class="section-eyebrow">Parcours de formation</div>
      <h2>Choisis un niveau puis lance un cas concret.</h2>
      <p class="process-overview-intro">
        Chaque niveau ajoute une difficulté réelle : outil déjà en place, peur du changement, client pointilleux,
        exigence ROI ou gouvernance.
      </p>
      <div class="path-grid">
        ${trainingPaths
          .map((path) => {
            const scenarios = getScenariosForPath(path.id)

            return `
              <article class="path-card">
                <div class="path-card-header">
                  <span class="path-badge">${escapeHtml(path.difficultyLabel)}</span>
                  <h3>${escapeHtml(path.title)}</h3>
                </div>
                <p>${escapeHtml(path.summary)}</p>
                ${renderTagRow(path.objectives, 'path-objective-tag')}
                <div class="path-scenario-list">
                  ${scenarios
                    .map((scenario) => {
                      const persona = getPersona(scenario.personaId)

                      return `
                        <button class="path-scenario-item" type="button" data-scenario-id="${scenario.id}">
                          <div class="path-scenario-copy">
                            <strong>${escapeHtml(scenario.title)}</strong>
                            <span>${escapeHtml(persona?.title ?? '')}</span>
                          </div>
                          <span class="difficulty-badge ${scenario.difficultyClass}">${escapeHtml(scenario.difficulty)}</span>
                        </button>
                      `
                    })
                    .join('')}
                </div>
              </article>
            `
          })
          .join('')}
      </div>
    </section>
  `
}

function renderWelcomeHighlights() {
  return `
    <div class="welcome-highlight-grid">
      <article class="welcome-highlight-card">
        <span class="welcome-highlight-value">${processStages.length}</span>
        <strong>étapes de vente</strong>
        <p>Un déroulé clair, du contexte jusqu’à la next step.</p>
      </article>
      <article class="welcome-highlight-card">
        <span class="welcome-highlight-value">${trainingScenarios.length}</span>
        <strong>cas progressifs</strong>
        <p>Des scénarios concrets qui montent en difficulté.</p>
      </article>
      <article class="welcome-highlight-card">
        <span class="welcome-highlight-value">${trainingPaths.length}</span>
        <strong>niveaux de formation</strong>
        <p>Débutant, intermédiaire puis prospect exigeant.</p>
      </article>
    </div>
  `
}

function renderProcessOverview() {
  return `
    <section class="process-overview">
      <div class="section-eyebrow">Le process de vente ATTRIO</div>
      <h2>8 étapes à tenir. Pas de pitch improvisé.</h2>
      <p class="process-overview-intro">
        ATTY évalue surtout la discipline commerciale : comprendre, qualifier, obtenir le droit de pitcher, puis
        sécuriser la suite.
      </p>
      <div class="process-overview-timeline">
        ${renderProcessTimeline({ compact: true })}
      </div>
      <p class="process-overview-note">${escapeHtml(getProcessMantra())}</p>
    </section>
  `
}

function renderContextualHelpCard() {
  const help = getCurrentContextualHelp()

  if (!state.contextualHelpOpen || !help) return ''

  return `
    <div class="atty-help-card">
      <div class="atty-help-header">
        <strong>${escapeHtml(help.title)}</strong>
        <button type="button" class="btn-help-close" id="btn-close-contextual-help" aria-label="Masquer l'aide">×</button>
      </div>
      <p class="atty-help-focus">${escapeHtml(help.focus)}</p>
      <ul class="atty-help-list">
        ${help.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
      <div class="atty-help-example">
        <span>Formulation utile</span>
        <p>${escapeHtml(help.example)}</p>
      </div>
      <div class="atty-help-warning">${escapeHtml(help.warning)}</div>
    </div>
  `
}

function renderFeedbackView() {
  const analysis = getCurrentAnalysis()
  const currentStage = getCurrentStageCopy(engine.getCurrentStageId())

  if (!analysis) {
    return `
      <div class="stage-focus-card">
        <span class="stage-focus-label">Étape en cours</span>
        <h3>${escapeHtml(currentStage.label)}</h3>
        <p>${escapeHtml(currentStage.objective)}</p>
      </div>
      <div class="atty-state-observation" id="atty-state-observation">
        <div class="atty-avatar-pulsing">
          <img src="${attyMascot}" alt="ATTY" />
        </div>
        <p>ATTY surveille le respect du process.</p>
        <span class="atty-subtext">Concentre-toi sur l'étape actuelle, pas sur le pitch final.</span>
      </div>
      ${renderContextualHelpCard()}
    `
  }

  return `
    <div class="stage-focus-card">
      <span class="stage-focus-label">Étape évaluée</span>
      <h3>${escapeHtml(currentStage.label)}</h3>
      <p>${escapeHtml(currentStage.objective)}</p>
    </div>
    <div class="atty-state-feedback" id="atty-state-feedback">
      <div class="feedback-badge-row">
        <span class="feedback-badge ${analysis.type}" id="feedback-rating-badge">${escapeHtml(analysis.type)}</span>
        <div class="score-circle-sm">
          <span id="atty-score-num">${analysis.score}</span><span class="slash-ten">/10</span>
        </div>
      </div>

      <div class="feedback-subscore-row">
        <div class="feedback-mini-score">
          <span>Fond</span>
          <strong>${analysis.processScore}/10</strong>
        </div>
        <div class="feedback-mini-score">
          <span>Forme</span>
          <strong>${analysis.expressionScore}/10</strong>
        </div>
      </div>

      <div class="feedback-text-box">
        <p id="atty-feedback-text"><strong>Fond :</strong> ${escapeHtml(analysis.processFeedback)}</p>
        <p><strong>Forme :</strong> ${escapeHtml(analysis.expressionFeedback)}</p>
      </div>

      ${
        analysis.expression?.tags?.length
          ? `
        <div class="feedback-tags-row">
          ${analysis.expression.tags
            .map((tag) => `<span class="feedback-tag">${escapeHtml(tag.label)}</span>`)
            .join('')}
        </div>
      `
          : ''
      }

      ${
        analysis.expression?.rewrite
          ? `
        <div class="feedback-rewrite-box">
          <span>Formulation plus pro</span>
          <p>${escapeHtml(analysis.expression.rewrite)}</p>
        </div>
      `
          : ''
      }

      <div class="feedback-actions-row">
        <button class="btn btn-secondary btn-full" id="btn-atty-retry">Réessayer cette étape</button>
        <button class="btn btn-primary btn-full" id="btn-atty-continue">Valider l'étape</button>
      </div>
    </div>
    ${renderContextualHelpCard()}
  `
}

function renderScenarioList() {
  return trainingPaths
    .map((path) => {
      const scenarios = getScenariosForPath(path.id)

      return `
        <div class="scenario-group">
          <div class="scenario-group-title">
            <span>${escapeHtml(path.shortLabel)}</span>
            <small>${escapeHtml(path.difficultyLabel)}</small>
          </div>
          ${scenarios
            .map((scenario) => {
              const persona = getPersona(scenario.personaId)
              const isActive = scenario.id === state.selectedScenarioId

              return `
                <div class="scenario-item ${isActive ? 'active' : ''}" data-scenario-id="${scenario.id}">
                  <span class="scenario-name">${escapeHtml(scenario.title)}</span>
                  <div class="scenario-meta">
                    <span class="difficulty-badge ${scenario.difficultyClass}">${escapeHtml(scenario.difficulty)}</span>
                    <span class="turns-count">${scenario.steps.length} étapes</span>
                  </div>
                  <div class="scenario-submeta">${escapeHtml(persona?.title ?? '')}</div>
                </div>
              `
            })
            .join('')}
        </div>
      `
    })
    .join('')
}

function renderWelcomeScenarioSections() {
  return trainingPaths
    .map((path) => {
      const scenarios = getScenariosForPath(path.id)

      return `
        <section class="scenario-path-section">
          <div class="scenario-path-header">
            <div>
              <span class="scenario-path-kicker">${escapeHtml(path.shortLabel)}</span>
              <h3>${escapeHtml(path.title)}</h3>
            </div>
            <p>${escapeHtml(path.summary)}</p>
          </div>
          <div class="scenarios-grid">
            ${scenarios
              .map((scenario) => {
                const persona = getPersona(scenario.personaId)

                return `
                  <article class="scenario-card" data-scenario-id="${scenario.id}">
                    <div>
                      <div class="scenario-card-header">
                        <h3>${escapeHtml(scenario.title)}</h3>
                        <span class="difficulty-badge ${scenario.difficultyClass}">${escapeHtml(scenario.difficulty)}</span>
                      </div>
                      <p>${escapeHtml(scenario.shortDescription)}</p>
                      ${renderTagRow(scenario.difficultyDrivers)}
                    </div>
                    <div class="scenario-card-footer">
                      <span class="card-stat">${scenario.steps.length} étapes • ${escapeHtml(persona?.company ?? '')}</span>
                      <button class="btn-card-action" type="button">Lancer le training →</button>
                    </div>
                  </article>
                `
              })
              .join('')}
          </div>
        </section>
      `
    })
    .join('')
}

function renderChatMessages() {
  if (state.chatMessages.length === 0) {
    return `
      <div class="atty-state-observation" style="height: 100%;">
        <div class="atty-avatar-pulsing">
          <img src="${attyMascot}" alt="ATTY" />
        </div>
        <p>La simulation démarrera ici.</p>
        <span class="atty-subtext">Le prospect ouvrira la conversation sur l'étape en cours.</span>
      </div>
    `
  }

  return state.chatMessages
    .map(
      (message) => `
        <div class="chat-msg-row ${message.role}">
          <div class="msg-bubble">
            <div>${escapeHtml(message.text)}</div>
            <span class="msg-time">${escapeHtml(message.time)}</span>
          </div>
        </div>
      `,
    )
    .join('')
}

function renderDebriefSteps() {
  if (!state.debriefing) return ''

  return state.debriefing.history
    .map(
      (step, index) => `
        <article class="debrief-step-card">
          <div class="debrief-step-header">
            <span class="step-num">Étape ${index + 1} • ${escapeHtml(step.stageLabel)}</span>
            <span class="step-score ${step.type}">${step.score}/10</span>
          </div>
          <div class="debrief-step-subscore-row">
            <span class="debrief-subscore-pill">Fond ${step.processScore ?? step.score}/10</span>
            <span class="debrief-subscore-pill">Forme ${step.expressionScore ?? 0}/10</span>
          </div>
          <div class="debrief-step-exchanges">
            <div class="exchange-row"><strong>Prospect :</strong> ${escapeHtml(step.prospectMessage)}</div>
            <div class="exchange-row"><strong>Vous :</strong> ${escapeHtml(step.userMessage)}</div>
          </div>
          <div class="debrief-step-feedback">${escapeHtml(step.feedback)}</div>
          ${
            step.expression?.tags?.length
              ? `
            <div class="debrief-step-tags">
              ${step.expression.tags.map((tag) => `<span class="feedback-tag">${escapeHtml(tag.label)}</span>`).join('')}
            </div>
          `
              : ''
          }
          ${
            step.expression?.rewrite
              ? `
            <div class="debrief-step-rewrite">
              <strong>Formulation plus pro</strong>
              <p>${escapeHtml(step.expression.rewrite)}</p>
            </div>
          `
              : ''
          }
        </article>
      `,
    )
    .join('')
}

function renderDebriefInsights(list, emptyLabel, mode = 'strength') {
  if (!list || list.length === 0) {
    return `<p class="debrief-inline-note">${escapeHtml(emptyLabel)}</p>`
  }

  return `
    <ul class="debrief-insight-list">
      ${list
        .map(
          (item) => `
            <li>
              <strong>${escapeHtml(item.stageLabel)}</strong>
              <span>${escapeHtml(mode === 'strength' ? item.stageObjective || item.feedback : item.improvementHint || item.feedback)}</span>
            </li>
          `,
        )
        .join('')}
    </ul>
  `
}

function renderAxisInsights(list, emptyLabel) {
  if (!list || list.length === 0) {
    return `<p class="debrief-inline-note">${escapeHtml(emptyLabel)}</p>`
  }

  return `
    <ul class="debrief-insight-list">
      ${list
        .map(
          (item) => `
            <li>
              <strong>${escapeHtml(item.label)}</strong>
              <span>${escapeHtml(item.detail)}</span>
            </li>
          `,
        )
        .join('')}
    </ul>
  `
}

function renderApp() {
  const scenario = getSelectedScenario()
  const persona = getSelectedPersona()
  const selectedPath = getSelectedTrainingPath()
  const session = getSessionProgress()
  const analysis = getCurrentAnalysis()
  const debrief = state.debriefing
  const currentStageId = engine.getCurrentStageId()
  const currentStage = getCurrentStageCopy(currentStageId)
  const completedCount = debrief ? scenario?.steps.length ?? 0 : engine.history.length
  const guideline = engine.getCurrentGuideline() || getProcessMantra()
  const recommendation =
    debrief && scenario ? getNextScenarioRecommendation(scenario.id, debrief.progressionPercentage ?? debrief.percentage) : null
  const recommendedScenario =
    recommendation?.type === 'next' ? getScenarioById(recommendation.scenarioId) : null
  const helpButtonLabel = state.contextualHelpOpen ? "Masquer l'aide" : "Demander de l'aide"

  return `
    <div class="app-container">
      <aside class="sidebar ${state.sidebarOpen ? 'mobile-open' : ''}" id="sidebar">
        <div class="sidebar-header">
          ${renderBrandLockup()}
          <span class="logo-tagline">Vos bâtiments, sous contrôle.</span>
        </div>

        <div class="stats-panel" id="stats-panel" style="display: ${session.isVisible ? 'block' : 'none'};">
          <div class="stats-header">Session active</div>
          <div class="stat-row">
            <span>Score</span>
            <span class="stat-val">${session.score}</span>
          </div>
          <div class="stat-row">
            <span>Progression</span>
            <span class="stat-val">${session.progressText}</span>
          </div>
          <div class="stat-row">
            <span>Tentatives</span>
            <span class="stat-val">${session.attempts}</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${session.progressRatio}%;"></div>
          </div>
        </div>

        <div class="sidebar-process-block">
          <div class="menu-section-title">Flow ATTRIO</div>
          ${renderProcessTimeline({
            activeStageId: currentStageId,
            completedCount,
            isComplete: Boolean(debrief),
            compact: true,
          })}
        </div>

        <div class="scenarios-menu">
          <div class="menu-section-title">Simulations disponibles</div>
          <div class="scenario-list" id="scenario-list">
            ${renderScenarioList()}
          </div>
        </div>

        <div class="sidebar-footer">
          <p>${escapeHtml(getProcessMantra())}</p>
        </div>
      </aside>

      <main class="main-content" id="main-content">
        <section class="screen ${state.screen === 'welcome' ? 'active' : ''}" id="screen-welcome">
          <div class="welcome-container">
            <div class="welcome-hero-layout">
              <div class="welcome-hero-copy">
                <div class="welcome-badge">ATTRIO Sales Training</div>
                ${renderBrandLockup('hero')}
                <h1>Former des commerciaux à suivre un process de vente maîtrisé.</h1>
                <p class="welcome-intro">
                  ATTRIO CAMPUS n'entraîne pas à “parler à un prospect”. Il entraîne à tenir un process complet :
                  comprendre le contexte, faire émerger le problème, quantifier l'impact, cadrer le besoin, obtenir le
                  droit de pitcher puis sécuriser la suite.
                </p>
                ${renderWelcomeHighlights()}
              </div>

              <div class="welcome-hero-side">
                <div class="coach-welcome-card">
                  <div class="coach-avatar-lg">
                    <img src="${attyMascot}" alt="ATTY" />
                  </div>
                  <div class="coach-welcome-text">
                    <strong>Brief d'ATTY</strong>
                    <p>${escapeHtml(getCoachWelcomeBrief())}</p>
                  </div>
                </div>
              </div>
            </div>

            ${renderProcessOverview()}
            ${renderLearningPathOverview()}
          </div>
        </section>

        <section class="screen ${state.screen === 'briefing' ? 'active' : ''}" id="screen-briefing">
          ${
            scenario && persona
              ? `
            <div class="briefing-container">
              <button class="btn-link" id="btn-back-welcome-1">&larr; Retour à l'accueil</button>

              <div class="briefing-card">
                <div class="briefing-header">
                  <div class="prospect-avatar-lg">${escapeHtml(persona.avatarInitials)}</div>
                  <div class="prospect-meta-lg">
                    <h2>${escapeHtml(persona.name)}</h2>
                    <p>${escapeHtml(persona.title)} chez ${escapeHtml(persona.company)}</p>
                  </div>
                </div>

                <div class="briefing-content">
                  <div class="metric-row">
                    <div class="metric-item">
                      <span class="metric-label">Équipe</span>
                      <span class="metric-val">${escapeHtml(persona.teamSize)}</span>
                    </div>
                    <div class="metric-item">
                      <span class="metric-label">Contexte</span>
                      <span class="metric-val">${escapeHtml(persona.contextTag)}</span>
                    </div>
                    <div class="metric-item">
                      <span class="metric-label">Parcours</span>
                      <span class="metric-val">${escapeHtml(selectedPath?.shortLabel ?? '—')}</span>
                    </div>
                    <div class="metric-item">
                      <span class="metric-label">Niveau</span>
                      <span class="metric-val difficulty-badge ${scenario.difficultyClass}">${escapeHtml(scenario.difficulty)}</span>
                    </div>
                  </div>

                  <div class="briefing-section">
                    <h3>Contexte prospect</h3>
                    <p>${escapeHtml(persona.details)}</p>
                  </div>

                  <div class="briefing-section">
                    <h3>Configuration actuelle</h3>
                    <p>${escapeHtml(persona.currentSetup ?? persona.contextTag)}</p>
                  </div>

                  <div class="briefing-section">
                    <h3>Objectif pédagogique</h3>
                    <p>${escapeHtml(scenario.trainingGoal)}</p>
                  </div>

                  <div class="briefing-section">
                    <h3>Parcours de formation</h3>
                    <p>${escapeHtml(selectedPath?.summary ?? '')}</p>
                  </div>

                  <div class="briefing-section">
                    <h3>Ce qui rend ce cas plus difficile</h3>
                    ${renderTagRow(scenario.difficultyDrivers)}
                  </div>

                  <div class="briefing-section coach-advice-box">
                    <h4>🎯 Focus d'ATTY</h4>
                    <p>${escapeHtml(scenario.coachFocus ?? getProcessMantra())}</p>
                  </div>

                  <div class="briefing-section coach-advice-box">
                    <h4>🎯 Règle du jeu</h4>
                    <p>${escapeHtml(getProcessMantra())}</p>
                  </div>

                  <div class="briefing-section">
                    <h3>Les 8 étapes à tenir</h3>
                    ${renderProcessTimeline({ compact: false })}
                  </div>
                </div>

                <div class="briefing-actions">
                  <button class="btn btn-primary btn-lg" id="btn-start-simulation">Démarrer la simulation</button>
                </div>
              </div>
            </div>
          `
              : ''
          }
        </section>

        <section class="screen ${state.screen === 'chat' ? 'active' : ''}" id="screen-chat">
          ${
            scenario && persona
              ? `
            <div class="simulation-layout">
              <div class="chat-panel">
                <header class="chat-header">
                  <button class="btn-sidebar-toggle" id="btn-mobile-back" aria-label="Menu">&larr;</button>
                  <div class="prospect-status-box">
                    <div class="prospect-avatar-sm">${escapeHtml(persona.avatarInitials)}</div>
                    <div class="prospect-info-sm">
                      <h3>${escapeHtml(persona.name)}</h3>
                      <span class="online-indicator">${escapeHtml(currentStage.label)}</span>
                    </div>
                  </div>
                  <div class="chat-header-actions">
                    <button class="btn-icon" id="btn-toggle-context" title="Afficher le contexte du scénario">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                    </button>
                    <button class="btn-text-danger" id="btn-abort-chat">Abandonner</button>
                  </div>
                </header>

                <div class="chat-stage-strip">
                  ${renderProcessTimeline({
                    activeStageId: currentStageId,
                    completedCount: engine.history.length,
                    compact: true,
                  })}
                </div>

                <div class="chat-messages-container" id="chat-messages-container">
                  ${renderChatMessages()}
                </div>

                <footer class="chat-input-footer">
                  <div class="chat-guidance-row">
                    <div class="chat-guideline">
                      <strong>${escapeHtml(currentStage.label)} :</strong> ${escapeHtml(guideline)}
                    </div>
                    <button type="button" class="btn btn-secondary btn-help-trigger" id="btn-toggle-contextual-help">
                      ${escapeHtml(helpButtonLabel)}
                    </button>
                  </div>
                  <form class="chat-input-form" id="chat-input-form">
                    <textarea
                      class="chat-textarea"
                      id="chat-textarea"
                      placeholder="Rédige ta réponse commerciale..."
                      rows="1"
                      ${analysis ? 'disabled' : ''}
                    >${escapeHtml(state.draftMessage)}</textarea>
                    <button type="submit" class="btn-send" id="btn-send-message" aria-label="Envoyer" ${analysis ? 'disabled' : ''}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="send-icon-svg">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                  </form>
                </footer>
              </div>

              <div class="coaching-panel">
                <div class="coaching-panel-header">
                  <div class="coach-panel-lockup">
                    <img src="${attyMascot}" alt="ATTY" class="coach-panel-avatar" />
                    <span>ATTY • Coach du process</span>
                  </div>
                </div>
                <div class="coaching-panel-content">
                  ${renderFeedbackView()}
                </div>
              </div>
            </div>
          `
              : ''
          }
        </section>

        <section class="screen ${state.screen === 'debriefing' ? 'active' : ''}" id="screen-debriefing">
          ${
            debrief
              ? `
            <div class="debriefing-container">
              <div class="debrief-header-card">
                <span class="debrief-badge ${debrief.gradeClass}">${escapeHtml(debrief.grade)}</span>
                <h1>Débrief du process de vente</h1>
                <div class="debrief-score-display">
                  <div class="score-circle-lg">
                    <span class="score-big">${debrief.score}</span>
                    <span class="score-max">/ ${debrief.maxScore}</span>
                  </div>
                </div>
                <div class="debrief-score-split">
                  <span>Fond ${debrief.processScore}/${debrief.processMaxScore}</span>
                  <span>Forme ${debrief.expressionScore}/${debrief.expressionMaxScore}</span>
                </div>
              </div>

              <div class="debrief-body-card">
                <div class="briefing-section">
                  <h3>Lecture globale d'ATTY</h3>
                  <p>${escapeHtml(debrief.feedback)}</p>
                </div>

                <div class="metric-row debrief-metric-row">
                  <div class="metric-item">
                    <span class="metric-label">Fond</span>
                    <span class="metric-val">${debrief.processPercentage}%</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">Forme</span>
                    <span class="metric-val">${debrief.expressionPercentage}%</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">Tentatives</span>
                    <span class="metric-val">${debrief.attempts}</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">Aides demandées</span>
                    <span class="metric-val">${state.helpRequestsCount}</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">Niveau</span>
                    <span class="metric-val">${escapeHtml(scenario?.difficulty ?? '—')}</span>
                  </div>
                </div>

                <div class="debrief-insights-grid">
                  <div class="debrief-summary-box">
                    <h3>Étapes maîtrisées</h3>
                    ${renderDebriefInsights(debrief.strengths, "Aucune étape n'a été vraiment dominée cette fois.", 'strength')}
                  </div>
                  <div class="debrief-summary-box">
                    <h3>Étapes à renforcer</h3>
                    ${renderDebriefInsights(debrief.watchouts, 'Le process est resté cohérent sur toute la simulation.', 'watchout')}
                  </div>
                </div>

                <div class="debrief-insights-grid">
                  <div class="debrief-summary-box">
                    <h3>Forme maîtrisée</h3>
                    ${renderAxisInsights(
                      debrief.expressionStrengths,
                      "La forme n'a pas encore de point fort très net sur cette session.",
                    )}
                  </div>
                  <div class="debrief-summary-box">
                    <h3>Forme à polir</h3>
                    ${renderAxisInsights(
                      debrief.expressionWatchouts,
                      'La forme est restée propre et homogène sur toute la simulation.',
                    )}
                  </div>
                </div>

                ${
                  recommendation
                    ? `
                  <div class="debrief-summary-box debrief-next-step-box">
                    <h3>Suite recommandée</h3>
                    <p>${escapeHtml(recommendation.message)}</p>
                    ${
                      recommendedScenario
                        ? `
                      <button class="btn btn-secondary" id="btn-open-recommended-scenario" data-scenario-id="${recommendedScenario.id}">
                        Passer à ${escapeHtml(recommendedScenario.title)}
                      </button>
                    `
                        : ''
                    }
                  </div>
                `
                    : ''
                }

                <div class="debrief-history-section">
                  <h3>Historique détaillé</h3>
                  ${renderDebriefSteps()}
                </div>

                <div class="debrief-footer-actions">
                  <button class="btn btn-secondary" id="btn-export-report">Exporter en PDF</button>
                  <button class="btn btn-secondary" id="btn-back-welcome-2">Retour à l'accueil</button>
                  <button class="btn btn-primary" id="btn-retry-scenario">Rejouer la simulation</button>
                </div>
              </div>
            </div>
          `
              : ''
          }
        </section>
      </main>

      ${
        scenario && persona && state.contextModalOpen
          ? `
        <div class="modal-overlay" id="context-modal">
          <div class="context-modal-card">
            <div class="context-modal-header">
              <h3>Contexte du scénario</h3>
              <button class="btn-close-modal" id="btn-close-context-modal" aria-label="Fermer">&times;</button>
            </div>
            <div class="context-modal-body">
              <div class="modal-prospect-profile">
                <div class="modal-avatar">${escapeHtml(persona.avatarInitials)}</div>
                <div>
                  <h4>${escapeHtml(persona.name)}</h4>
                  <p>${escapeHtml(persona.title)}</p>
                </div>
              </div>
              <div class="modal-details-grid">
                <div>
                  <strong>Contexte</strong>
                  <p>${escapeHtml(persona.contextTag)}</p>
                </div>
                <div>
                  <strong>Style</strong>
                  <p>${escapeHtml(persona.resistanceStyle)}</p>
                </div>
                <div>
                  <strong>Parcours</strong>
                  <p>${escapeHtml(selectedPath?.title ?? '—')}</p>
                </div>
                <div>
                  <strong>Niveau</strong>
                  <p>${escapeHtml(scenario.difficulty)}</p>
                </div>
              </div>
              <div class="modal-desc-section">
                <strong>Situation du prospect</strong>
                <p>${escapeHtml(persona.details)}</p>
              </div>
              <div class="modal-desc-section">
                <strong>Configuration actuelle</strong>
                <p>${escapeHtml(persona.currentSetup ?? persona.contextTag)}</p>
              </div>
              <div class="modal-desc-section">
                <strong>Douleur dominante</strong>
                <p>${escapeHtml(persona.painSummary)}</p>
              </div>
              <div class="modal-desc-section">
                <strong>Facteurs de difficulté</strong>
                ${renderTagRow(scenario.difficultyDrivers)}
              </div>
              <div class="modal-desc-section modal-advice-box">
                <strong>Objectif de la simulation</strong>
                <p>${escapeHtml(scenario.trainingGoal)}</p>
              </div>
            </div>
          </div>
        </div>
      `
          : ''
      }
    </div>
  `
}

function bindEvents() {
  document.querySelectorAll('[data-scenario-id]').forEach((element) => {
    element.addEventListener('click', () => openScenario(element.dataset.scenarioId))
  })

  document.querySelector('#btn-back-welcome-1')?.addEventListener('click', goToWelcome)
  document.querySelector('#btn-back-welcome-2')?.addEventListener('click', goToWelcome)
  document.querySelector('#btn-export-report')?.addEventListener('click', exportDebriefReport)
  document.querySelector('#btn-start-simulation')?.addEventListener('click', startScenario)
  document.querySelector('#btn-retry-scenario')?.addEventListener('click', restartScenario)
  document.querySelector('#btn-abort-chat')?.addEventListener('click', abortSimulation)
  document.querySelector('#btn-toggle-context')?.addEventListener('click', () => {
    state.contextModalOpen = true
    render()
  })
  document.querySelector('#btn-close-context-modal')?.addEventListener('click', () => {
    state.contextModalOpen = false
    render()
  })
  document.querySelector('#context-modal')?.addEventListener('click', (event) => {
    if (event.target.id === 'context-modal') {
      state.contextModalOpen = false
      render()
    }
  })
  document.querySelector('#btn-atty-retry')?.addEventListener('click', retryPendingMessage)
  document.querySelector('#btn-atty-continue')?.addEventListener('click', continueSimulation)
  document.querySelector('#btn-toggle-contextual-help')?.addEventListener('click', toggleContextualHelp)
  document.querySelector('#btn-close-contextual-help')?.addEventListener('click', toggleContextualHelp)
  document.querySelector('#btn-mobile-back')?.addEventListener('click', () => {
    state.sidebarOpen = !state.sidebarOpen
    render()
  })

  const textarea = document.querySelector('#chat-textarea')
  if (textarea) {
    autoResizeTextarea(textarea)
    textarea.addEventListener('input', () => {
      state.draftMessage = textarea.value
      autoResizeTextarea(textarea)
    })
    textarea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        submitMessage()
      }
    })
  }

  document.querySelector('#chat-input-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    submitMessage()
  })
}

function syncScroll() {
  const container = document.querySelector('#chat-messages-container')
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

function render() {
  app.innerHTML = renderApp()
  bindEvents()
  syncScroll()
}

render()
