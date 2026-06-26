import './style.css'
import attrioLogo from './assets/brand/attrio-logo-a.jpg'
import attyMascot from './assets/brand/atty-mascot.jpg'
import { isSupabaseEnabled, supabase } from './lib/supabase.js'
import { SimulationEngine } from './engines/simulation-engine.js'
import { trainingScenarios } from './data/scenarios.js'
import { getPersona } from './data/personas.js'
import { trainingPaths, getTrainingPath, getNextScenarioRecommendation } from './data/training-paths.js'
import {
  learningModules,
  getLearningModuleById,
  getLearningModulesForPath,
  getNextLearningModuleId,
} from './data/learning-modules.js'
import {
  getContextualHelp,
  getCurrentStageCopy,
  getProcessMantra,
  getProcessStages,
} from './engines/coach-engine.js'

const app = document.querySelector('#app')
const engine = new SimulationEngine()
const processStages = getProcessStages()
const SESSION_HISTORY_STORAGE_KEY = 'attrio-campus-session-history-v1'
const LEARNING_PROGRESS_STORAGE_KEY = 'attrio-campus-learning-progress-v1'
const MAX_SESSION_HISTORY = 40
const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
})
const sessionDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const state = {
  screen: 'welcome',
  selectedScenarioId: trainingScenarios[0]?.id ?? null,
  selectedLearningModuleId: learningModules[0]?.id ?? null,
  sidebarOpen: false,
  contextModalOpen: false,
  chatMessages: [],
  draftMessage: '',
  pendingMessage: '',
  debriefing: null,
  contextualHelpOpen: false,
  helpRequestsCount: 0,
  viewingHistoryEntryId: null,
  sessionHistory: readSessionHistory(),
  authEmail: '',
  currentUser: null,
  authBusy: false,
  authStatus: isSupabaseEnabled ? 'loading' : 'disabled',
  authMessage: isSupabaseEnabled
    ? 'Connecte-toi pour retrouver ta progression sur plusieurs appareils.'
    : 'Mode local actif : ta progression reste sur ce navigateur.',
  authError: '',
  syncStatus: 'idle',
  learningProgress: readLearningProgress(),
  learningSelection: null,
}

function readSessionHistory() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SESSION_HISTORY_STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.map(normalizeHistoryEntry).filter(Boolean) : []
  } catch {
    return []
  }
}

function writeSessionHistory(history) {
  try {
    window.localStorage.setItem(
      SESSION_HISTORY_STORAGE_KEY,
      JSON.stringify(history.map(normalizeHistoryEntry).filter(Boolean)),
    )
  } catch {
    // no-op
  }
}

function readLearningProgress() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LEARNING_PROGRESS_STORAGE_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeLearningProgress(progress) {
  try {
    window.localStorage.setItem(LEARNING_PROGRESS_STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // no-op
  }
}

function normalizeHistoryEntry(entry) {
  if (!entry) return null

  return {
    id: String(entry.id ?? `${entry.scenarioId ?? 'session'}-${entry.savedAt ?? Date.now()}`),
    savedAt: entry.savedAt ?? new Date().toISOString(),
    scenarioId: entry.scenarioId ?? '',
    scenarioTitle: entry.scenarioTitle ?? '',
    personaName: entry.personaName ?? '',
    personaTitle: entry.personaTitle ?? '',
    trainingPathId: entry.trainingPathId ?? '',
    trainingPathTitle: entry.trainingPathTitle ?? '',
    difficulty: entry.difficulty ?? '',
    score: Number(entry.score ?? 0),
    maxScore: Number(entry.maxScore ?? 80),
    percentage: Number(entry.percentage ?? 0),
    processPercentage: Number(entry.processPercentage ?? 0),
    expressionPercentage: Number(entry.expressionPercentage ?? 0),
    grade: entry.grade ?? '',
    attempts: Number(entry.attempts ?? 0),
    helpRequestsCount: Number(entry.helpRequestsCount ?? 0),
    reportSnapshot: normalizeReportSnapshot(entry.reportSnapshot),
  }
}

function normalizeReportSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return null

  const normalizedDebrief = normalizeDebriefSnapshot(snapshot.debrief)
  if (!normalizedDebrief) return null

  return {
    scenarioId: String(snapshot.scenarioId ?? ''),
    personaId: String(snapshot.personaId ?? ''),
    trainingPathId: String(snapshot.trainingPathId ?? ''),
    savedAt: snapshot.savedAt ?? new Date().toISOString(),
    helpRequestsCount: Number(snapshot.helpRequestsCount ?? 0),
    debrief: normalizedDebrief,
  }
}

function normalizeDebriefSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return null

  const cloned = cloneSerializable(snapshot)
  if (!cloned) return null

  return {
    ...cloned,
    score: Number(cloned.score ?? 0),
    maxScore: Number(cloned.maxScore ?? 80),
    percentage: Number(cloned.percentage ?? 0),
    progressionPercentage: Number(cloned.progressionPercentage ?? cloned.percentage ?? 0),
    processScore: Number(cloned.processScore ?? 0),
    processMaxScore: Number(cloned.processMaxScore ?? 0),
    processPercentage: Number(cloned.processPercentage ?? 0),
    expressionScore: Number(cloned.expressionScore ?? 0),
    expressionMaxScore: Number(cloned.expressionMaxScore ?? 0),
    expressionPercentage: Number(cloned.expressionPercentage ?? 0),
    attempts: Number(cloned.attempts ?? 0),
    strengths: Array.isArray(cloned.strengths) ? cloned.strengths : [],
    watchouts: Array.isArray(cloned.watchouts) ? cloned.watchouts : [],
    expressionStrengths: Array.isArray(cloned.expressionStrengths) ? cloned.expressionStrengths : [],
    expressionWatchouts: Array.isArray(cloned.expressionWatchouts) ? cloned.expressionWatchouts : [],
    history: Array.isArray(cloned.history) ? cloned.history : [],
  }
}

function cloneSerializable(value) {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return null
  }
}

function sortHistoryEntries(history) {
  return [...history].sort((left, right) => {
    const leftTime = new Date(left.savedAt ?? 0).getTime()
    const rightTime = new Date(right.savedAt ?? 0).getTime()
    return rightTime - leftTime
  })
}

function mergeHistoryEntries(...groups) {
  const mergedEntries = new Map()

  groups
    .flat()
    .map((entry) => normalizeHistoryEntry(entry))
    .filter(Boolean)
    .forEach((entry) => {
      const existingEntry = mergedEntries.get(entry.id)

      if (!existingEntry) {
        mergedEntries.set(entry.id, entry)
        return
      }

      mergedEntries.set(entry.id, mergeHistoryEntryPair(existingEntry, entry))
    })

  return sortHistoryEntries([...mergedEntries.values()])
}

function mergeHistoryEntryPair(existingEntry, nextEntry) {
  const existingTime = new Date(existingEntry.savedAt ?? 0).getTime()
  const nextTime = new Date(nextEntry.savedAt ?? 0).getTime()
  const shouldPreferNext = nextTime > existingTime
  const preferredEntry = shouldPreferNext ? nextEntry : existingEntry
  const fallbackEntry = shouldPreferNext ? existingEntry : nextEntry

  return normalizeHistoryEntry({
    ...fallbackEntry,
    ...preferredEntry,
    reportSnapshot: preferredEntry.reportSnapshot ?? fallbackEntry.reportSnapshot ?? null,
  })
}

function mapHistoryEntryToCloudRow(entry, userId) {
  return {
    user_id: userId,
    client_entry_id: entry.id,
    saved_at: entry.savedAt,
    scenario_id: entry.scenarioId,
    scenario_title: entry.scenarioTitle,
    persona_name: entry.personaName,
    persona_title: entry.personaTitle,
    training_path_id: entry.trainingPathId,
    training_path_title: entry.trainingPathTitle,
    difficulty: entry.difficulty,
    score: entry.score,
    max_score: entry.maxScore,
    percentage: entry.percentage,
    process_percentage: entry.processPercentage,
    expression_percentage: entry.expressionPercentage,
    grade: entry.grade,
    attempts: entry.attempts,
    help_requests_count: entry.helpRequestsCount,
  }
}

function mapCloudRowToHistoryEntry(row) {
  return normalizeHistoryEntry({
    id: row.client_entry_id ?? row.id,
    savedAt: row.saved_at,
    scenarioId: row.scenario_id,
    scenarioTitle: row.scenario_title,
    personaName: row.persona_name,
    personaTitle: row.persona_title,
    trainingPathId: row.training_path_id,
    trainingPathTitle: row.training_path_title,
    difficulty: row.difficulty,
    score: row.score,
    maxScore: row.max_score,
    percentage: row.percentage,
    processPercentage: row.process_percentage,
    expressionPercentage: row.expression_percentage,
    grade: row.grade,
    attempts: row.attempts,
    helpRequestsCount: row.help_requests_count,
  })
}

function getCloudErrorMessage(error) {
  const message = error?.message ?? ''

  if (error?.code === '42P01' || message.includes('training_sessions')) {
    return "La sauvegarde en ligne n'est pas encore complètement configurée."
  }

  if (message.toLowerCase().includes('row-level security')) {
    return "La sauvegarde sécurisée n'est pas encore prête."
  }

  return message || 'Impossible de sauvegarder ta progression pour le moment.'
}

function getAuthErrorMessage(error) {
  const message = error?.message ?? ''
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('email rate limit exceeded')) {
    return "Trop de demandes de connexion email pour le moment. Attends un peu ou utilise Google."
  }

  if (normalizedMessage.includes('provider is not enabled') || normalizedMessage.includes('unsupported provider')) {
    return "La connexion Google n'est pas encore disponible."
  }

  if (normalizedMessage.includes('redirect') || normalizedMessage.includes('redirect_to')) {
    return "Le retour vers l'application n'est pas encore correctement configuré."
  }

  return message || 'Connexion impossible pour le moment.'
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

function getSelectedLearningModule() {
  return getLearningModuleById(state.selectedLearningModuleId)
}

function isLearningModuleCompleted(moduleId) {
  return Boolean(state.learningProgress?.[moduleId]?.completedAt)
}

function getLearningModuleSummary(moduleId) {
  const progress = state.learningProgress?.[moduleId]
  if (!progress) return null

  return {
    completedAt: progress.completedAt ?? null,
    correctOptionId: progress.correctOptionId ?? null,
  }
}

function getLearningPathProgress(pathId) {
  const modules = getLearningModulesForPath(pathId)
  const completedCount = modules.filter((module) => isLearningModuleCompleted(module.id)).length

  return {
    totalCount: modules.length,
    completedCount,
    percentage: modules.length === 0 ? 0 : Math.round((completedCount / modules.length) * 100),
  }
}

function getScenarioHistorySummary(scenarioId) {
  const entries = state.sessionHistory.filter((entry) => entry.scenarioId === scenarioId)
  if (entries.length === 0) return null

  return {
    sessionsCount: entries.length,
    bestPercentage: Math.max(...entries.map((entry) => entry.percentage ?? 0)),
    lastPlayedAt: entries[0]?.savedAt ?? null,
  }
}

function getHistoryEntryById(entryId) {
  return state.sessionHistory.find((entry) => entry.id === entryId) ?? null
}

function getViewingHistoryEntry() {
  if (!state.viewingHistoryEntryId) return null
  return getHistoryEntryById(state.viewingHistoryEntryId)
}

function hasSavedReport(entry) {
  return Boolean(entry?.reportSnapshot?.debrief?.history?.length)
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

function buildProgressionSnapshot() {
  const history = state.sessionHistory
  const scenarioSummaries = Object.fromEntries(
    trainingScenarios
      .map((scenario) => [scenario.id, getScenarioHistorySummary(scenario.id)])
      .filter(([, summary]) => Boolean(summary)),
  )

  if (history.length === 0) {
    return {
      hasHistory: false,
      sessionsCount: 0,
      averagePercentage: 0,
      bestPercentage: 0,
      uniqueScenarioCount: 0,
      masteredScenarioCount: 0,
      recentEntries: [],
      scenarioSummaries,
    }
  }

  const uniqueScenarioCount = new Set(history.map((entry) => entry.scenarioId)).size
  const averagePercentage = Math.round(
    history.reduce((sum, entry) => sum + (entry.percentage ?? 0), 0) / history.length,
  )
  const bestPercentage = Math.max(...history.map((entry) => entry.percentage ?? 0))
  const masteredScenarioCount = Object.values(scenarioSummaries).filter((entry) => (entry?.bestPercentage ?? 0) >= 75).length

  return {
    hasHistory: true,
    sessionsCount: history.length,
    averagePercentage,
    bestPercentage,
    uniqueScenarioCount,
    masteredScenarioCount,
    recentEntries: history.slice(0, 3),
    scenarioSummaries,
  }
}

function getWelcomeProgressBadgeModel() {
  const progression = buildProgressionSnapshot()
  const initiationProgress = getLearningPathProgress('initiation')

  if (progression.hasHistory) {
    return {
      tone: progression.averagePercentage >= 75 ? 'success' : 'neutral',
      title: 'Progression active',
      detail: `${progression.sessionsCount} session${progression.sessionsCount > 1 ? 's' : ''} • ${progression.averagePercentage}% moyen`,
    }
  }

  if (initiationProgress.completedCount > 0) {
    return {
      tone: 'neutral',
      title: 'Initiation lancée',
      detail: `${initiationProgress.completedCount}/${initiationProgress.totalCount} module${initiationProgress.totalCount > 1 ? 's' : ''}`,
    }
  }

  return {
    tone: 'neutral',
    title: 'Nouveau parcours',
    detail: 'Initiation conseillée',
  }
}

function renderWelcomeHeroMeta() {
  const badge = getWelcomeProgressBadgeModel()

  return `
    <div class="welcome-badge-row">
      <div class="welcome-badge">Parcours commercial ATTRIO</div>
      <div class="welcome-progress-pill ${badge.tone}">
        <strong>${escapeHtml(badge.title)}</strong>
        <span>${escapeHtml(badge.detail)}</span>
      </div>
    </div>
  `
}

async function syncHistoryWithCloud({ silent = false } = {}) {
  if (!supabase || !state.currentUser) return

  if (!silent) {
    state.syncStatus = 'syncing'
    state.authError = ''
    state.authMessage = 'Sauvegarde en cours...'
    render()
  }

  try {
    const payload = state.sessionHistory.map((entry) => mapHistoryEntryToCloudRow(entry, state.currentUser.id))

    if (payload.length > 0) {
      const { error: upsertError } = await supabase.from('training_sessions').upsert(payload, {
        onConflict: 'user_id,client_entry_id',
      })

      if (upsertError) {
        throw upsertError
      }
    }

    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('user_id', state.currentUser.id)
      .order('saved_at', { ascending: false })
      .limit(MAX_SESSION_HISTORY * 2)

    if (error) {
      throw error
    }

    state.sessionHistory = mergeHistoryEntries(
      state.sessionHistory,
      (data ?? []).map((row) => mapCloudRowToHistoryEntry(row)),
    ).slice(0, MAX_SESSION_HISTORY)
    writeSessionHistory(state.sessionHistory)
    state.syncStatus = 'success'
    state.authError = ''
    state.authMessage = `Progression sauvegardée • ${state.sessionHistory.length} session${state.sessionHistory.length > 1 ? 's' : ''}`
  } catch (error) {
    state.syncStatus = 'error'
    state.authError = getCloudErrorMessage(error)
  }

  render()
}

async function syncSingleEntryToCloud(entry) {
  if (!supabase || !state.currentUser) return

  try {
    const { error } = await supabase.from('training_sessions').upsert(mapHistoryEntryToCloudRow(entry, state.currentUser.id), {
      onConflict: 'user_id,client_entry_id',
    })

    if (error) {
      throw error
    }

    state.syncStatus = 'success'
    state.authError = ''
    state.authMessage = 'Dernière session bien sauvegardée.'
  } catch (error) {
    state.syncStatus = 'error'
    state.authError = getCloudErrorMessage(error)
  }

  render()
}

async function sendMagicLink() {
  if (!supabase) return

  const email = state.authEmail.trim()
  if (!email) {
    state.authError = 'Entre ton email pour recevoir un lien magique.'
    render()
    return
  }

  state.authBusy = true
  state.authError = ''
  state.authMessage = 'Envoi du lien magique...'
  render()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
    },
  })

  state.authBusy = false

  if (error) {
    state.authError = getAuthErrorMessage(error)
    state.authMessage = ''
    render()
    return
  }

  state.authMessage = `Lien envoyé à ${email}. Ouvre l'email puis reviens automatiquement dans ATTRIO CAMPUS.`
  render()
}

async function signInWithGoogle() {
  if (!supabase) return

  state.authBusy = true
  state.authError = ''
  state.authMessage = 'Redirection vers Google...'
  render()

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
      queryParams: {
        prompt: 'select_account',
      },
    },
  })

  if (error) {
    state.authBusy = false
    state.authError = getAuthErrorMessage(error)
    state.authMessage = ''
    render()
  }
}

async function signOutFromCloud() {
  if (!supabase) return

  state.authBusy = true
  state.authError = ''
  render()

  const { error } = await supabase.auth.signOut()

  state.authBusy = false

  if (error) {
    state.authError = getAuthErrorMessage(error)
    render()
    return
  }

  state.currentUser = null
  state.syncStatus = 'idle'
  state.authMessage = 'Déconnecté. Ton historique local reste disponible sur cet appareil.'
  render()
}

async function initializeSupabaseConnection() {
  if (!supabase) {
    state.authStatus = 'disabled'
    render()
    return
  }

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    state.currentUser = session?.user ?? null
    state.authEmail = session?.user?.email ?? state.authEmail
    state.authStatus = 'ready'

    if (state.currentUser) {
      state.authMessage = `Connecté en tant que ${state.currentUser.email}.`
      await syncHistoryWithCloud({ silent: true })
    } else {
      state.authMessage = 'Connecte-toi avec Google pour retrouver ta progression sur plusieurs appareils.'
      render()
    }
  } catch (error) {
    state.authStatus = 'error'
    state.authError = getCloudErrorMessage(error)
    render()
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    state.currentUser = session?.user ?? null
    state.authEmail = session?.user?.email ?? state.authEmail
    state.authBusy = false
    state.authStatus = 'ready'

    if (session?.user) {
      state.authMessage = `Connecté en tant que ${session.user.email}. Synchronisation...`
      state.authError = ''
      render()

      window.setTimeout(() => {
        syncHistoryWithCloud({ silent: true })
      }, 0)
      return
    }

    state.syncStatus = 'idle'
    state.authMessage = 'Mode local actif. Reconnecte-toi pour retrouver ta progression sur tous tes appareils.'
    state.authError = ''
    render()
  })
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
  state.viewingHistoryEntryId = null
  state.contextModalOpen = false
  state.contextualHelpOpen = false
  state.helpRequestsCount = 0
}

function resetLearningSelection() {
  state.learningSelection = null
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

function openLearningModule(moduleId) {
  confirmBeforeDiscard(() => {
    state.selectedLearningModuleId = moduleId
    resetSessionState()
    resetLearningSelection()
    state.screen = 'learning-module'
    state.sidebarOpen = false
    render()
  })
}

function markLearningModuleComplete(moduleId, extra = {}) {
  state.learningProgress = {
    ...state.learningProgress,
    [moduleId]: {
      ...(state.learningProgress?.[moduleId] ?? {}),
      completedAt: new Date().toISOString(),
      ...extra,
    },
  }

  writeLearningProgress(state.learningProgress)
}

function chooseLearningOption(moduleId, optionId) {
  state.learningSelection = { moduleId, optionId }
  render()
}

function completeCurrentLearningModule() {
  const module = getSelectedLearningModule()
  if (!module) return

  if (module.type === 'drill') {
    const selection = state.learningSelection
    if (!selection || selection.moduleId !== module.id) return
    if (selection.optionId !== module.correctOptionId) return

    markLearningModuleComplete(module.id, { correctOptionId: selection.optionId })
  } else {
    markLearningModuleComplete(module.id)
  }

  render()
}

function openNextLearningModule() {
  const currentModule = getSelectedLearningModule()
  if (!currentModule) return

  const nextModuleId = getNextLearningModuleId(currentModule.id)
  if (!nextModuleId) {
    state.screen = 'welcome'
    state.sidebarOpen = false
    render()
    return
  }

  state.selectedLearningModuleId = nextModuleId
  resetLearningSelection()
  render()
}

function goToWelcome() {
  confirmBeforeDiscard(() => {
    resetSessionState()
    state.screen = 'welcome'
    state.sidebarOpen = false
    render()
  })
}

function openHistoryReport(entryId) {
  confirmBeforeDiscard(() => {
    const entry = getHistoryEntryById(entryId)

    if (!entry || !hasSavedReport(entry)) {
      window.alert("Ce rapport détaillé n'est pas disponible pour cette ancienne session. Rejoue ce cas pour en générer un nouveau.")
      return
    }

    state.selectedScenarioId = entry.reportSnapshot?.scenarioId || entry.scenarioId
    resetSessionState()
    state.debriefing = normalizeDebriefSnapshot(entry.reportSnapshot?.debrief)
    state.helpRequestsCount = Number(entry.reportSnapshot?.helpRequestsCount ?? entry.helpRequestsCount ?? 0)
    state.viewingHistoryEntryId = entry.id
    state.screen = 'debriefing'
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
  if (shouldAutoFocusComposer()) {
    focusTextarea()
  }
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
    persistCurrentDebriefing()
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

function persistCurrentDebriefing() {
  const scenario = getSelectedScenario()
  const persona = getSelectedPersona()
  const trainingPath = getSelectedTrainingPath()
  const debrief = state.debriefing

  if (!scenario || !persona || !debrief) return

  const entry = {
    id: `${scenario.id}-${Date.now()}`,
    savedAt: new Date().toISOString(),
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    personaName: persona.name,
    personaTitle: persona.title,
    trainingPathId: trainingPath?.id ?? scenario.trainingPathId,
    trainingPathTitle: trainingPath?.title ?? '',
    difficulty: scenario.difficulty,
    score: debrief.score,
    maxScore: debrief.maxScore,
    percentage: debrief.percentage,
    processPercentage: debrief.processPercentage,
    expressionPercentage: debrief.expressionPercentage,
    grade: debrief.grade,
    attempts: debrief.attempts,
    helpRequestsCount: state.helpRequestsCount,
    reportSnapshot: {
      scenarioId: scenario.id,
      personaId: scenario.personaId,
      trainingPathId: trainingPath?.id ?? scenario.trainingPathId,
      savedAt: new Date().toISOString(),
      helpRequestsCount: state.helpRequestsCount,
      debrief: cloneSerializable(debrief),
    },
  }

  state.sessionHistory = mergeHistoryEntries([entry], state.sessionHistory).slice(0, MAX_SESSION_HISTORY)
  writeSessionHistory(state.sessionHistory)
  state.viewingHistoryEntryId = entry.id

  if (state.currentUser) {
    syncSingleEntryToCloud(entry)
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
  const historyEntry = getViewingHistoryEntry()

  if (!scenario || !persona || !debrief) return null

  const generatedAt = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date())
  const reportDate = new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(historyEntry ? new Date(historyEntry.savedAt) : new Date())
    .replace(/\//g, '-')

  const recommendation = getNextScenarioRecommendation(
    scenario.id,
    debrief.progressionPercentage ?? debrief.percentage,
  )
  const recommendedScenario =
    recommendation?.type === 'next' ? getScenarioById(recommendation.scenarioId) : null

  return {
    generatedAt,
    sessionSavedAt: historyEntry ? sessionDateFormatter.format(new Date(historyEntry.savedAt)) : generatedAt,
    reportFileName: `ATTRIO CAMPUS - Rapport - ${persona.name} - ${slugify(scenario.title)} - ${reportDate}`,
    trainingPathTitle: trainingPath?.title ?? '—',
    pathInteractionLabel: trainingPath?.interactionLabel ?? '—',
    pathGuidanceLabel: trainingPath?.guidanceLabel ?? '—',
    pathProspectLabel: trainingPath?.prospectLabel ?? '—',
    pathDifficultyLabel: trainingPath?.commercialDifficultyLabel ?? '—',
    scenarioTitle: scenario.title,
    scenarioGoal: scenario.trainingGoal,
    scenarioDifficultyDrivers: scenario.difficultyDrivers ?? [],
    personaLabel: `${persona.name} — ${persona.title} chez ${persona.company}`,
    personaPainSummary: persona.painSummary ?? '',
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

  const renderDriverTags =
    model.scenarioDifficultyDrivers.length > 0
      ? `
        <div class="report-tag-row">
          ${model.scenarioDifficultyDrivers
            .map((driver) => `<span class="report-tag">${escapeHtml(driver)}</span>`)
            .join('')}
        </div>
      `
      : ''

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Rapport ATTRIO CAMPUS</title>
        <style>
          :root {
            --bg: #f4f2eb;
            --panel: #ffffff;
            --panel-soft: #f7f6f1;
            --text: #111827;
            --muted: #4b5563;
            --soft: #6b7280;
            --border: #e5e7eb;
            --accent: #254a80;
            --accent-2: #4f46e5;
            --accent-soft: rgba(79, 70, 229, 0.08);
            --success: #10b981;
            --success-soft: rgba(16, 185, 129, 0.12);
            --warning-soft: rgba(251, 191, 36, 0.16);
          }
          @page {
            margin: 16mm;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 24px;
            background: var(--bg);
            color: var(--text);
            font-family: Inter, Arial, sans-serif;
            line-height: 1.5;
          }
          .page {
            max-width: 920px;
            margin: 0 auto;
            background:
              radial-gradient(circle at top right, rgba(79, 70, 229, 0.08), transparent 28%),
              linear-gradient(180deg, #ffffff 0%, #fbfbf9 100%);
            border: 1px solid var(--border);
            border-radius: 28px;
            padding: 30px;
          }
          .header-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 24px;
          }
          .brand-block {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .brand-mark {
            width: 58px;
            height: 58px;
            border-radius: 18px;
            border: 1px solid var(--border);
            background: #ffffff;
            object-fit: cover;
            padding: 8px;
          }
          .brand-copy strong {
            display: block;
            font-size: 11px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--accent);
            margin-bottom: 4px;
          }
          .brand-copy span {
            display: block;
            font-size: 13px;
            color: var(--muted);
          }
          .report-status {
            text-align: right;
          }
          .eyebrow {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #ffffff;
            background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
            border-radius: 999px;
            padding: 6px 12px;
            font-weight: 800;
          }
          .report-status strong {
            display: block;
            font-size: 13px;
            margin-bottom: 2px;
          }
          .report-status span {
            font-size: 12px;
            color: var(--soft);
          }
          .hero-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.55fr) minmax(260px, 0.95fr);
            gap: 18px;
            align-items: stretch;
            margin-bottom: 22px;
          }
          .hero-panel,
          .certificate-panel,
          .section-panel,
          .summary-panel,
          .history-item {
            border: 1px solid var(--border);
            border-radius: 22px;
            background: var(--panel);
          }
          .hero-panel {
            padding: 24px;
          }
          .hero-panel h1 {
            margin: 0 0 12px;
            font-size: 34px;
            line-height: 1.02;
            letter-spacing: -0.04em;
            max-width: 13ch;
          }
          .hero-panel p {
            margin: 0;
            font-size: 15px;
            color: var(--muted);
          }
          .hero-meta {
            margin-top: 18px;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .hero-meta-item {
            background: var(--panel-soft);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 12px 14px;
          }
          .hero-meta-item span,
          .context-card span,
          .meta-card span,
          .score-card span {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--soft);
            margin-bottom: 4px;
            font-weight: 700;
          }
          .hero-meta-item strong,
          .context-card strong {
            display: block;
            font-size: 13px;
            line-height: 1.35;
          }
          .certificate-panel {
            padding: 20px;
            background: linear-gradient(180deg, rgba(37, 74, 128, 0.05) 0%, rgba(79, 70, 229, 0.04) 100%);
          }
          .certificate-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }
          .certificate-head img {
            width: 56px;
            height: 56px;
            border-radius: 18px;
            border: 1px solid rgba(79, 70, 229, 0.18);
            background: #ffffff;
            object-fit: cover;
          }
          .certificate-head strong {
            display: block;
            font-size: 15px;
          }
          .certificate-head span {
            font-size: 12px;
            color: var(--soft);
          }
          .grade-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 12px;
            border-radius: 999px;
            background: var(--success-soft);
            color: #047857;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .certificate-panel p {
            margin: 0 0 12px;
            color: var(--muted);
          }
          .report-tag-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;
          }
          .report-tag {
            display: inline-flex;
            align-items: center;
            padding: 5px 10px;
            border-radius: 999px;
            border: 1px solid rgba(37, 74, 128, 0.12);
            background: rgba(37, 74, 128, 0.06);
            font-size: 11px;
            color: var(--accent);
            font-weight: 700;
          }
          .score-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
            margin: 0 0 22px;
          }
          .score-card {
            border: 1px solid var(--border);
            border-radius: 18px;
            padding: 16px;
            background: #ffffff;
          }
          .score-card strong {
            display: block;
            font-size: 24px;
            line-height: 1.05;
            letter-spacing: -0.03em;
          }
          .score-card small {
            display: block;
            margin-top: 4px;
            color: var(--soft);
            font-size: 12px;
          }
          .context-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 22px;
          }
          .context-card {
            border: 1px solid var(--border);
            border-radius: 18px;
            padding: 16px;
            background: var(--panel);
          }
          .context-card p {
            margin: 0;
            font-size: 13px;
            color: var(--muted);
          }
          .section-block {
            margin-bottom: 22px;
          }
          .section-panel {
            padding: 20px;
          }
          .section-title {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--accent);
            margin: 0 0 12px;
            font-weight: 800;
          }
          .callout {
            background: linear-gradient(180deg, rgba(79, 70, 229, 0.06) 0%, rgba(124, 58, 237, 0.04) 100%);
            border: 1px solid rgba(79, 70, 229, 0.12);
            border-radius: 18px;
            padding: 16px;
          }
          .muted { color: var(--muted); }
          ul {
            margin: 10px 0 0;
            padding-left: 18px;
          }
          li { margin-bottom: 8px; }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 22px;
          }
          .summary-panel {
            padding: 18px;
          }
          .summary-panel h2 {
            margin: 0 0 10px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--accent);
          }
          .history-item {
            padding: 16px;
            margin-bottom: 12px;
            page-break-inside: avoid;
            position: relative;
            overflow: hidden;
          }
          .history-item::before {
            content: '';
            position: absolute;
            inset: 0 auto 0 0;
            width: 5px;
            background: linear-gradient(180deg, var(--accent) 0%, var(--accent-2) 100%);
          }
          .history-head {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 10px;
            font-weight: 700;
          }
          .history-head span:first-child {
            font-size: 15px;
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
            background: var(--panel-soft);
            border: 1px solid var(--border);
            font-size: 12px;
          }
          .history-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px 14px;
          }
          .rewrite-box {
            margin-top: 10px;
            padding: 12px;
            border-radius: 14px;
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
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--soft);
            margin-bottom: 2px;
            font-weight: 700;
          }
          .value {
            margin-bottom: 10px;
            color: var(--text);
            font-size: 13px;
          }
          .recommendation-panel {
            border: 1px solid rgba(16, 185, 129, 0.22);
            background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%);
          }
          .footer-signature {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: center;
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px solid var(--border);
          }
          .footer-signature strong {
            display: block;
            font-size: 13px;
          }
          .footer-signature span {
            font-size: 12px;
            color: var(--soft);
          }
          .signature-line {
            min-width: 180px;
            border-top: 1px solid var(--border);
            padding-top: 8px;
            text-align: center;
            font-size: 11px;
            color: var(--soft);
          }
          @media print {
            body { padding: 0; background: #fff; }
            .page { border: none; border-radius: 0; max-width: none; padding: 0; background: #fff; }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <div class="header-top">
            <div class="brand-block">
              <img class="brand-mark" src="${attrioLogo}" alt="Logo Attrio" />
              <div class="brand-copy">
                <strong>ATTRIO CAMPUS</strong>
                <span>Attestation d’entraînement commercial</span>
              </div>
            </div>
            <div class="report-status">
              <div class="eyebrow">Rapport certifiant</div>
              <strong>${escapeHtml(model.generatedAt)}</strong>
              <span>${escapeHtml(model.reportFileName)}</span>
            </div>
          </div>

          <section class="hero-grid">
            <div class="hero-panel">
              <div class="eyebrow">Simulation finalisée</div>
              <h1>${escapeHtml(model.scenarioTitle)}</h1>
              <p>${escapeHtml(model.scenarioGoal)}</p>
              <div class="hero-meta">
                <div class="hero-meta-item">
                  <span>Persona</span>
                  <strong>${escapeHtml(model.personaLabel)}</strong>
                </div>
                <div class="hero-meta-item">
                  <span>Session sauvegardée</span>
                  <strong>${escapeHtml(model.sessionSavedAt)}</strong>
                </div>
                <div class="hero-meta-item">
                  <span>Parcours</span>
                  <strong>${escapeHtml(model.trainingPathTitle)}</strong>
                </div>
                <div class="hero-meta-item">
                  <span>Niveau</span>
                  <strong>${escapeHtml(model.level)}</strong>
                </div>
              </div>
            </div>

            <aside class="certificate-panel">
              <div class="certificate-head">
                <div>
                  <strong>Validation ATTY</strong>
                  <span>Lecture synthétique de la session</span>
                </div>
                <img src="${attyMascot}" alt="ATTY" />
              </div>
              <div class="grade-pill">${escapeHtml(model.grade)}</div>
              <p>Ce rapport résume la tenue du process, la qualité de l’expression commerciale et la prochaine marche de progression.</p>
              ${renderDriverTags}
            </aside>
          </section>

          <section class="score-grid">
            <div class="score-card">
              <span>Score global</span>
              <strong>${escapeHtml(`${model.score}/${model.maxScore}`)}</strong>
              <small>${escapeHtml(`${model.percentage}% de maîtrise`)}</small>
            </div>
            <div class="score-card">
              <span>Fond</span>
              <strong>${escapeHtml(`${model.processScore}/${model.processMaxScore}`)}</strong>
              <small>${escapeHtml(`${model.processPercentage}% sur le process`)}</small>
            </div>
            <div class="score-card">
              <span>Forme</span>
              <strong>${escapeHtml(`${model.expressionScore}/${model.expressionMaxScore}`)}</strong>
              <small>${escapeHtml(`${model.expressionPercentage}% sur la formulation`)}</small>
            </div>
            <div class="score-card">
              <span>Discipline</span>
              <strong>${escapeHtml(String(model.attempts))}</strong>
              <small>${escapeHtml(`${model.helpRequestsCount} aide(s) demandée(s)`)}</small>
            </div>
          </section>

          <section class="context-grid section-block">
            <article class="context-card">
              <span>Douleur dominante</span>
              <strong>${escapeHtml(model.personaPainSummary || '—')}</strong>
            </article>
            <article class="context-card">
              <span>Mode de travail</span>
              <strong>${escapeHtml(model.pathInteractionLabel)}</strong>
              <p>${escapeHtml(`${model.pathGuidanceLabel} • ${model.pathProspectLabel} • ${model.pathDifficultyLabel}`)}</p>
            </article>
          </section>

          <section class="summary-grid">
            <article class="summary-panel">
              <h2>Lecture globale d’ATTY</h2>
              <div class="callout">
                <p>${escapeHtml(model.feedback)}</p>
              </div>
            </article>
            <article class="summary-panel">
              <h2>Qualité de la formulation</h2>
              <div class="callout">
                <p>${escapeHtml(model.expressionSummary)}</p>
              </div>
            </article>
          </section>

          <section class="summary-grid">
            <article class="summary-panel">
              <h2>Points forts</h2>
              ${renderList(
                model.strengths,
                "Aucune étape n'a été franchement dominée cette fois.",
                (item) => `<strong>${escapeHtml(item.stageLabel)}</strong> — ${escapeHtml(item.stageObjective || item.feedback)}`,
              )}
            </article>
            <article class="summary-panel">
              <h2>À renforcer</h2>
              ${renderList(
                model.watchouts,
                'Le process est resté globalement cohérent sur toute la simulation.',
                (item) => `<strong>${escapeHtml(item.stageLabel)}</strong> — ${escapeHtml(item.improvementHint || item.feedback)}`,
              )}
            </article>
          </section>

          <section class="summary-grid">
            <article class="summary-panel">
              <h2>Forme maîtrisée</h2>
              ${renderList(
                model.expressionStrengths,
                'Aucun point de forme ne ressort nettement comme acquis sur cette session.',
                (item) => `<strong>${escapeHtml(item.label)}</strong> — ${escapeHtml(item.detail)}`,
              )}
            </article>
            <article class="summary-panel">
              <h2>Forme à polir</h2>
              ${renderList(
                model.expressionWatchouts,
                'La forme est restée propre et homogène sur l’ensemble de la simulation.',
                (item) => `<strong>${escapeHtml(item.label)}</strong> — ${escapeHtml(item.detail)}`,
              )}
            </article>
          </section>

          <section class="section-panel section-block">
            <h2 class="section-title">Historique détaillé</h2>
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
                    <div class="history-grid">
                      <div>
                        <div class="label">Prospect</div>
                        <div class="value">${escapeHtml(step.prospectMessage)}</div>
                      </div>
                      <div>
                        <div class="label">Réponse commerciale</div>
                        <div class="value">${escapeHtml(step.userMessage)}</div>
                      </div>
                    </div>
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

          <section class="section-panel recommendation-panel">
            <h2 class="section-title">Suite recommandée</h2>
            <p>${escapeHtml(model.recommendationMessage)}</p>
            ${
              model.recommendedScenarioTitle
                ? `<p><strong>Scénario conseillé :</strong> ${escapeHtml(model.recommendedScenarioTitle)}</p>`
                : ''
            }
            <div class="footer-signature">
              <div>
                <strong>Rapport généré par ATTY</strong>
                <span>ATTRIO CAMPUS • simulation commerciale structurée</span>
              </div>
              <div class="signature-line">Validation de progression</div>
            </div>
          </section>
        </main>
      </body>
    </html>
  `
}

function exportDebriefReport() {
  const scenario = getSelectedScenario()
  const model = buildDebriefReportModel()
  const html = buildDebriefPdfHtml()
  if (!scenario || !html || !model) return

  const documentTitle = model.reportFileName
  const htmlWithTitle = html.replace(
    '<title>Rapport ATTRIO CAMPUS</title>',
    `<title>${escapeHtml(documentTitle)}</title><base href="${escapeHtml(`${window.location.origin}/`)}">`,
  )
  const printFrame = document.createElement('iframe')

  printFrame.setAttribute('aria-hidden', 'true')
  printFrame.style.position = 'fixed'
  printFrame.style.right = '0'
  printFrame.style.bottom = '0'
  printFrame.style.width = '0'
  printFrame.style.height = '0'
  printFrame.style.border = '0'
  printFrame.style.opacity = '0'
  printFrame.style.pointerEvents = 'none'

  const htmlBlob = new Blob([htmlWithTitle], { type: 'text/html;charset=utf-8' })
  const htmlUrl = URL.createObjectURL(htmlBlob)

  const cleanup = () => {
    URL.revokeObjectURL(htmlUrl)
    printFrame.remove()
  }

  printFrame.onload = () => {
    const printTarget = printFrame.contentWindow

    if (!printTarget || typeof printTarget.print !== 'function') {
      cleanup()
      downloadDebriefReportFallback(documentTitle, htmlWithTitle)
      return
    }

    const handleAfterPrint = () => {
      cleanup()
    }

    printTarget.addEventListener('afterprint', handleAfterPrint, { once: true })

    window.setTimeout(() => {
      printTarget.focus()
      printTarget.print()
    }, 180)

    window.setTimeout(cleanup, 60000)
  }

  document.body.appendChild(printFrame)
  printFrame.src = htmlUrl
}

function downloadDebriefReportFallback(documentTitle, html) {
  const fallbackBlob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const fallbackUrl = URL.createObjectURL(fallbackBlob)
  const downloadLink = document.createElement('a')

  downloadLink.href = fallbackUrl
  downloadLink.download = `${slugify(documentTitle)}.html`
  document.body.appendChild(downloadLink)
  downloadLink.click()
  downloadLink.remove()

  window.setTimeout(() => {
    URL.revokeObjectURL(fallbackUrl)
  }, 1000)
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

function prefillChatPrompt(prompt) {
  state.draftMessage = prompt
  render()
  focusTextarea(true)
}

function shouldAutoFocusComposer() {
  return !window.matchMedia('(max-width: 768px)').matches
}

function setChatKeyboardMode(isOpen) {
  const layout = document.querySelector('.simulation-layout')
  if (!layout) return

  layout.classList.toggle('keyboard-open', Boolean(isOpen))
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

function renderPathQuickFacts(path) {
  const facts = [
    ['Interaction', path?.interactionLabel],
    ['Guidage', path?.guidanceLabel],
    ['Prospect', path?.prospectLabel],
    ['Difficulté', path?.commercialDifficultyLabel],
  ].filter(([, value]) => Boolean(value))

  if (facts.length === 0) return ''

  return `
    <div class="path-quick-facts">
      ${facts
        .map(
          ([label, value]) => `
            <div class="path-quick-fact">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `,
        )
        .join('')}
    </div>
  `
}

function getChatPromptSuggestions() {
  const scenario = getSelectedScenario()
  const trainingPath = getSelectedTrainingPath()
  const stageId = engine.getCurrentStageId()

  if (!scenario || !trainingPath || !stageId || getCurrentAnalysis()) return []

  const promptLibrary = {
    context: {
      foundations: [
        "Comment vous fonctionnez aujourd'hui sur ce sujet ?",
        'Qui reçoit les demandes et comment elles arrivent ?',
        'Quels outils ou canaux utilisez-vous vraiment au quotidien ?',
      ],
      progression: [
        "Qui utilise encore les canaux parallèles aujourd'hui ?",
        'À quel endroit le process se casse vraiment avec l’existant ?',
      ],
      advanced: ['Quel est le point le plus sensible si vous changez quelque chose sur le terrain ?'],
    },
    problem: {
      foundations: [
        'Où est-ce que ça casse le plus aujourd’hui ?',
        'Qu’est-ce qui se perd ou se relance à la main ?',
        'Tu as un exemple concret de situation ?',
      ],
      progression: [
        'Pourquoi l’outil actuel est-il contourné en pratique ?',
        'Qui décroche en premier entre demandeurs, terrain et pilotage ?',
      ],
      advanced: ['Quel est aujourd’hui le point de fragilité le plus risqué pour vos équipes ?'],
    },
    impact: {
      foundations: [
        'Quel impact ça a au quotidien pour vous ?',
        'Combien de temps cela vous fait-il perdre ?',
        'Que se passe-t-il quand le suivi n’est pas propre ?',
      ],
      progression: [
        'Quel coût concret cela crée-t-il en temps, relances ou fiabilité ?',
        'Qu’est-ce que ce fonctionnement empêche de piloter correctement ?',
      ],
      advanced: ['Qu’est-ce qui se passe sur le terrain quand une échéance ou une info critique glisse ?'],
    },
    needs: {
      foundations: [
        'Qu’est-ce qui serait vraiment top pour vous ?',
        'À quoi ressemble un bon fonctionnement dans votre quotidien ?',
        'Qu’est-ce qui doit absolument changer pour vous ?',
      ],
      progression: [
        'À quelles conditions un changement resterait crédible pour vous ?',
        'Qu’est-ce qui doit être plus simple sans tout casser ?',
      ],
      advanced: ['Qu’est-ce qu’une amélioration acceptable doit apporter sans perturber l’exploitation ?'],
    },
    transition: {
      foundations: [
        'Si je résume, votre enjeu principal est de…',
        'Si j’ai bien compris, vous cherchez surtout à…',
        'Est-ce que j’ai bien cerné la situation si je dis que…',
      ],
      progression: [
        'Si je reformule, le vrai sujet n’est pas l’outil mais…',
        'Votre besoin, ce n’est pas de changer pour changer, c’est bien de…',
      ],
      advanced: ['Si je résume, il faut mieux piloter sans fragiliser le terrain, c’est bien ça ?'],
    },
    solution: {
      foundations: [
        'Dans votre cas, ATTRIO peut surtout centraliser…',
        'L’idée n’est pas d’ajouter un outil, mais de rendre visible…',
        'Concrètement, ATTRIO permet à chacun de…',
      ],
      progression: [
        'ATTRIO peut aider sans attaquer frontalement votre existant, en…',
        'L’intérêt ici, c’est de simplifier l’usage pour le terrain tout en…',
      ],
      advanced: ['ATTRIO peut surtout sécuriser le pilotage et la méthode de déploiement en…'],
    },
    objections: {
      foundations: [
        'Je comprends la réserve.',
        'Le risque que vous voyez, c’est surtout l’adoption terrain ?',
        'On peut avancer progressivement, en commençant par…',
      ],
      progression: [
        'Je comprends : vous ne voulez pas relancer un chantier inutile.',
        'Le plus crédible serait peut-être de commencer par un périmètre pilote…',
      ],
      advanced: ['Je comprends : votre vrai sujet, ce n’est pas l’outil seul, c’est la continuité et l’adoption.'],
    },
    closing: {
      foundations: [
        'Je vous propose une démo courte sur un cas concret.',
        'On peut cadrer un premier cas simple sur un site pilote.',
        'Le plus utile serait un échange de 20 minutes centré sur…',
      ],
      progression: [
        'Je vous propose un atelier court sur un périmètre précis.',
        'On peut regarder un site pilote ou un flux ciblé avant d’aller plus loin.',
      ],
      advanced: ['Je vous propose une démonstration ciblée sur votre cas d’usage, avec un point sur la méthode de déploiement.'],
    },
  }

  if (trainingPath.id === 'expert') return []

  const pathPrompts = promptLibrary[stageId]
  if (!pathPrompts) return []

  return pathPrompts[trainingPath.id] ?? []
}

function renderChatPromptSuggestions() {
  const suggestions = getChatPromptSuggestions()
  if (suggestions.length === 0) return ''

  return `
    <div class="chat-prompt-strip">
      <span class="chat-prompt-label">Si tu bloques, pars de là</span>
      <div class="chat-prompt-list">
        ${suggestions
          .map(
            (suggestion) => `
              <button type="button" class="chat-prompt-chip" data-chat-prompt="${escapeHtml(suggestion)}">
                ${escapeHtml(suggestion)}
              </button>
            `,
          )
          .join('')}
      </div>
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
  const progression = buildProgressionSnapshot()

  return `
    <section class="learning-paths-overview" id="home-paths">
      <div class="section-eyebrow">Parcours de formation</div>
      <h2>Du très guidé vers l’autonome, jusqu’au niveau expert.</h2>
      <p class="process-overview-intro">
        Initiation en capsules, niveau 1 en chat guidé, puis échanges de plus en plus réalistes jusqu’au décideur exigeant.
        Tu peux commencer doucement, ou entrer directement dans le niveau qui te correspond.
      </p>
      <div class="path-grid">
        ${trainingPaths
          .map((path) => {
            if (path.id === 'initiation') {
              const modules = getLearningModulesForPath(path.id)
              const progress = getLearningPathProgress(path.id)

              return `
                <article class="path-card">
                  <div class="path-card-header">
                    <span class="path-badge">${escapeHtml(path.difficultyLabel)}</span>
                    <h3>${escapeHtml(path.title)}</h3>
                  </div>
                  <p>${escapeHtml(path.summary)}</p>
                  ${renderPathQuickFacts(path)}
                  ${renderTagRow(path.objectives, 'path-objective-tag')}
                  <div class="path-card-progress-note">
                    ${progress.completedCount > 0 ? escapeHtml(`${progress.completedCount}/${progress.totalCount} modules terminés`) : 'Parcours conseillé avant la première simulation'}
                  </div>
                  <div class="path-scenario-list">
                    ${modules
                      .map((module) => {
                        const moduleSummary = getLearningModuleSummary(module.id)

                        return `
                          <button class="path-scenario-item" type="button" data-learning-module-id="${module.id}">
                            <div class="path-scenario-copy">
                              <strong>${escapeHtml(module.title)}</strong>
                              <span>${escapeHtml(`${module.badge} • ${module.duration}`)}</span>
                              <small>${escapeHtml(module.shortDescription)}</small>
                              ${
                                moduleSummary?.completedAt
                                  ? `<small>Terminé</small>`
                                  : ''
                              }
                            </div>
                            <div class="path-scenario-meta">
                              <span class="difficulty-badge ${module.type === 'drill' ? 'medium' : 'easy'}">${escapeHtml(module.type === 'drill' ? 'Exercice' : 'Capsule')}</span>
                              ${
                                moduleSummary?.completedAt
                                  ? '<span class="scenario-progress-chip">Vu</span>'
                                  : ''
                              }
                            </div>
                          </button>
                        `
                      })
                      .join('')}
                  </div>
                </article>
              `
            }

            const scenarios = getScenariosForPath(path.id)

            return `
              <article class="path-card">
                <div class="path-card-header">
                  <span class="path-badge">${escapeHtml(path.difficultyLabel)}</span>
                  <h3>${escapeHtml(path.title)}</h3>
                </div>
                <p>${escapeHtml(path.summary)}</p>
                ${renderPathQuickFacts(path)}
                ${renderTagRow(path.objectives, 'path-objective-tag')}
                <div class="path-scenario-list">
                  ${scenarios
                    .map((scenario) => {
                      const persona = getPersona(scenario.personaId)
                      const scenarioHistory = progression.scenarioSummaries[scenario.id]

                      return `
                        <button class="path-scenario-item" type="button" data-scenario-id="${scenario.id}">
                          <div class="path-scenario-copy">
                            <strong>${escapeHtml(scenario.title)}</strong>
                            <span>${escapeHtml(persona?.title ?? '')}</span>
                            ${
                              scenarioHistory
                                ? `<small>${escapeHtml(
                                    `${scenarioHistory.sessionsCount} session${scenarioHistory.sessionsCount > 1 ? 's' : ''} • meilleur ${scenarioHistory.bestPercentage}%`,
                                  )}</small>`
                                : ''
                            }
                          </div>
                          <div class="path-scenario-meta">
                            <span class="difficulty-badge ${scenario.difficultyClass}">${escapeHtml(scenario.difficulty)}</span>
                            ${
                              scenarioHistory
                                ? `<span class="scenario-progress-chip">${escapeHtml(`${scenarioHistory.bestPercentage}%`)}</span>`
                                : ''
                            }
                          </div>
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

function renderLearningModuleScreen() {
  const module = getSelectedLearningModule()
  if (!module) return ''

  const nextModuleId = getNextLearningModuleId(module.id)
  const nextModule = nextModuleId ? getLearningModuleById(nextModuleId) : null
  const selection = state.learningSelection?.moduleId === module.id ? state.learningSelection : null
  const selectedOption = module.type === 'drill' ? module.options.find((option) => option.id === selection?.optionId) : null
  const isCorrect = selectedOption ? selectedOption.id === module.correctOptionId : false
  const isCompleted = isLearningModuleCompleted(module.id)
  const canValidateDrill = isCompleted || isCorrect

  return `
    <div class="learning-module-container">
      <button class="btn-link" id="btn-back-welcome-learning">&larr; Retour à l'accueil</button>

      <div class="learning-module-card">
        <div class="learning-module-header">
          <div>
            <span class="section-eyebrow">${escapeHtml(module.badge)}</span>
            <h2>${escapeHtml(module.title)}</h2>
          </div>
          <span class="difficulty-badge ${module.type === 'drill' ? 'medium' : 'easy'}">${escapeHtml(module.duration)}</span>
        </div>

        <p class="learning-module-intro">${escapeHtml(module.shortDescription)}</p>

        <div class="briefing-section">
          <h3>Objectif</h3>
          <p>${escapeHtml(module.objective)}</p>
        </div>

        ${
          module.type === 'capsule'
            ? `
              ${module.sections
                .map(
                  (section) => `
                    <div class="briefing-section">
                      <h3>${escapeHtml(section.title)}</h3>
                      <ul class="learning-bullet-list">
                        ${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                      </ul>
                    </div>
                  `,
                )
                .join('')}
              <div class="coach-advice-box">
                <h4>À retenir</h4>
                <p>${escapeHtml(module.takeaway)}</p>
              </div>
            `
            : `
              <div class="briefing-section">
                <h3>Mini exercice</h3>
                <p>${escapeHtml(module.question)}</p>
              </div>
              <div class="learning-options-list">
                ${module.options
                  .map(
                    (option) => `
                      <button
                        type="button"
                        class="learning-option-card ${selection?.optionId === option.id ? 'selected' : ''}"
                        data-learning-option-id="${option.id}"
                      >
                        <strong>${escapeHtml(option.label)}</strong>
                      </button>
                    `,
                  )
                  .join('')}
              </div>
              ${
                selectedOption
                  ? `
                    <div class="coach-advice-box ${isCorrect ? 'learning-feedback-success' : 'learning-feedback-warning'}">
                      <h4>${escapeHtml(isCorrect ? 'Bonne logique' : 'On peut mieux faire')}</h4>
                      <p>${escapeHtml(selectedOption.feedback)}</p>
                    </div>
                  `
                  : ''
              }
              ${
                isCompleted && !selectedOption
                  ? `
                    <div class="coach-advice-box learning-feedback-success">
                      <h4>Exercice déjà validé</h4>
                      <p>Tu peux passer au suivant ou rejouer l’exercice pour te rééchauffer.</p>
                    </div>
                  `
                  : ''
              }
            `
        }

        <div class="briefing-actions learning-actions">
          ${
            module.type === 'capsule'
              ? `
                <button class="btn btn-primary" id="btn-complete-learning-module">
                  ${isCompleted ? 'Module déjà vu' : 'Marquer comme terminé'}
                </button>
              `
              : `
                <button class="btn btn-primary" id="btn-complete-learning-module" ${!canValidateDrill ? 'disabled' : ''}>
                  ${isCompleted ? 'Exercice validé' : 'Valider cet exercice'}
                </button>
              `
          }
          <button class="btn btn-secondary" id="btn-next-learning-module">
            ${nextModule ? `Module suivant : ${escapeHtml(nextModule.badge)}` : 'Retour au parcours'}
          </button>
        </div>
      </div>
    </div>
  `
}

function renderWelcomeHighlights() {
  const progression = buildProgressionSnapshot()

  if (!progression.hasHistory) {
    return `
      <section class="progression-overview progression-empty-state">
        <div class="section-eyebrow">Démarrage</div>
        <h2>Ta progression apparaîtra ici après ta première simulation.</h2>
        <p class="process-overview-intro">
          Lance un premier cas pour commencer à suivre tes scores, tes scénarios travaillés et ton évolution.
        </p>
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
            <p>Initiation, guidé, autonome, résistance puis niveau expert.</p>
          </article>
        </div>
      </section>
    `
  }

  return `
    <section class="progression-overview">
      <div class="section-eyebrow">Ma progression</div>
      <h2>Tu avances déjà sur ton parcours ATTRIO.</h2>
      <p class="process-overview-intro">
        ${escapeHtml(
          `Tu as réalisé ${progression.sessionsCount} session${progression.sessionsCount > 1 ? 's' : ''}, avec ${progression.masteredScenarioCount} cas validé${progression.masteredScenarioCount > 1 ? 's' : ''} à 75% ou plus.`,
        )}
        <br />
        <span class="recent-session-hint">Tu peux rouvrir un rapport récent pour relire les échanges et les retours d'ATTY.</span>
      </p>
      <div class="welcome-highlight-grid">
        <article class="welcome-highlight-card">
          <span class="welcome-highlight-value">${progression.sessionsCount}</span>
          <strong>sessions jouées</strong>
          <p>Chaque simulation compte dans ton historique local.</p>
        </article>
        <article class="welcome-highlight-card">
          <span class="welcome-highlight-value">${progression.averagePercentage}%</span>
          <strong>score moyen</strong>
          <p>Une vue simple de ton niveau global sur le process.</p>
        </article>
        <article class="welcome-highlight-card">
          <span class="welcome-highlight-value">${progression.uniqueScenarioCount}</span>
          <strong>cas travaillés</strong>
          <p>Le nombre de scénarios déjà testés dans ton navigateur.</p>
        </article>
      </div>
      <div class="recent-sessions-list">
        ${progression.recentEntries
          .map((entry) => {
            const canReopenReport = hasSavedReport(entry)

            return `
              <button
                class="recent-session-card ${canReopenReport ? 'report-available' : ''}"
                type="button"
                ${canReopenReport ? `data-history-entry-id="${entry.id}"` : `data-scenario-id="${entry.scenarioId}"`}
              >
                <div class="recent-session-head">
                  <strong>${escapeHtml(entry.scenarioTitle)}</strong>
                  <span class="recent-session-score">${escapeHtml(`${entry.percentage}%`)}</span>
                </div>
                <div class="recent-session-meta">
                  <span>${escapeHtml(entry.personaName)}</span>
                  <span>${escapeHtml(sessionDateFormatter.format(new Date(entry.savedAt)))}</span>
                </div>
                <div class="recent-session-subscores">
                  <span>Fond ${escapeHtml(`${entry.processPercentage}%`)}</span>
                  <span>Forme ${escapeHtml(`${entry.expressionPercentage}%`)}</span>
                </div>
                <div class="recent-session-cta">${escapeHtml(canReopenReport ? 'Revoir le rapport détaillé' : 'Rejouer ce cas')}</div>
              </button>
            `
          })
          .join('')}
      </div>
    </section>
  `
}

function getWelcomeOrientationBrief() {
  const progression = buildProgressionSnapshot()
  const initiationProgress = getLearningPathProgress('initiation')
  const initiationIncomplete = initiationProgress.totalCount > 0 && initiationProgress.completedCount < initiationProgress.totalCount

  if (!progression.hasHistory) {
    return "Si tu découvres CAMPUS, commence par l'initiation. Si tu veux pratiquer tout de suite, lance un cas débutant. L'idée, c'est d'entrer simplement, pas de tout comprendre d'un coup."
  }

  if (initiationIncomplete) {
    return "Tu peux reprendre l'initiation pour poser les bases, relancer un cas concret, ou rouvrir ton dernier rapport pour voir exactement ce qui bloque."
  }

  return "Le plus utile maintenant : reprendre un rapport récent pour corriger une étape précise, ou relancer un cas pour ancrer le process."
}

function renderWelcomeLaunchpad() {
  const progression = buildProgressionSnapshot()
  const initiationModules = getLearningModulesForPath('initiation')
  const initiationProgress = getLearningPathProgress('initiation')
  const firstInitiationModule = initiationModules[0] ?? null
  const nextInitiationModuleId =
    initiationModules.find((module) => !isLearningModuleCompleted(module.id))?.id ?? firstInitiationModule?.id ?? null
  const beginnerScenario = getScenariosForPath('foundations')[0] ?? trainingScenarios[0] ?? null
  const latestEntry = progression.recentEntries[0] ?? null

  return `
    <section class="welcome-launchpad">
      <div class="section-eyebrow">Démarrage rapide</div>
      <h2>${progression.hasHistory ? 'Trois façons simples de reprendre.' : 'Trois portes d’entrée simples.'}</h2>
      <p class="process-overview-intro">
        ${
          progression.hasHistory
            ? "Reprends un rapport, continue les bases ou relance un cas concret : pas besoin de te reposer toute la question."
            : "Si tu débutes, l’initiation te met dans le bain. Si tu veux pratiquer tout de suite, pars sur un premier cas guidé."
        }
      </p>
      <div class="welcome-launchpad-grid">
        ${
          nextInitiationModuleId
            ? `
              <button class="welcome-launch-card" type="button" data-learning-module-id="${nextInitiationModuleId}">
                <span class="welcome-launch-kicker">${progression.hasHistory && initiationProgress.completedCount > 0 ? 'Continuer les bases' : 'Bien démarrer'}</span>
                <strong>${progression.hasHistory && initiationProgress.completedCount > 0 ? 'Reprendre l’initiation' : 'Commencer l’initiation'}</strong>
                <p>
                  ${
                    initiationProgress.completedCount > 0
                      ? `${initiationProgress.completedCount}/${initiationProgress.totalCount} module${initiationProgress.totalCount > 1 ? 's' : ''} déjà validé${initiationProgress.completedCount > 1 ? 's' : ''}.`
                      : 'Capsules courtes + mini exercices pour découvrir le terrain, le process et ATTRIO.'
                  }
                </p>
                <span class="welcome-launch-action">${progression.hasHistory && initiationProgress.completedCount > 0 ? 'Continuer →' : 'Commencer →'}</span>
              </button>
            `
            : ''
        }
        ${
          beginnerScenario
            ? `
              <button class="welcome-launch-card" type="button" data-scenario-id="${beginnerScenario.id}">
                <span class="welcome-launch-kicker">Pratiquer</span>
                <strong>Lancer un cas débutant</strong>
                <p>${escapeHtml(`${beginnerScenario.title} — un premier entraînement concret pour te mettre en mouvement sans pression inutile.`)}</p>
                <span class="welcome-launch-action">Lancer le cas →</span>
              </button>
            `
            : ''
        }
        ${
          latestEntry
            ? `
              <button class="welcome-launch-card" type="button" data-history-entry-id="${latestEntry.id}">
                <span class="welcome-launch-kicker">Reprendre</span>
                <strong>Rouvrir mon dernier rapport</strong>
                <p>${escapeHtml(`${latestEntry.scenarioTitle} • ${latestEntry.percentage}% • ${sessionDateFormatter.format(new Date(latestEntry.savedAt))}`)}</p>
                <span class="welcome-launch-action">Voir le rapport →</span>
              </button>
            `
            : `
              <button class="welcome-launch-card" type="button" data-scroll-target="#home-paths">
                <span class="welcome-launch-kicker">Explorer</span>
                <strong>Voir tous les parcours</strong>
                <p>Découvre les 5 niveaux : initiation, guidé, consolidation, résistance puis expert.</p>
                <span class="welcome-launch-action">Explorer →</span>
              </button>
            `
        }
      </div>
    </section>
  `
}

function renderCloudProgressCard() {
  const isConnected = Boolean(state.currentUser)
  const cloudStatusLabel = !isSupabaseEnabled
    ? 'Local'
    : state.syncStatus === 'syncing'
      ? 'Sync...'
      : state.syncStatus === 'success'
        ? 'Sauvegardé'
        : state.syncStatus === 'error'
          ? 'À terminer'
          : isConnected
            ? 'Connecté'
            : 'Optionnel'
  const cloudStatusClass = !isSupabaseEnabled
    ? 'local'
    : state.syncStatus === 'success'
      ? 'success'
      : state.syncStatus === 'error'
        ? 'warning'
        : state.syncStatus === 'syncing'
          ? 'syncing'
          : 'neutral'

  return `
    <div class="cloud-progress-card">
      <div class="cloud-progress-head">
        <div>
          <span class="section-eyebrow">Compte & progression</span>
          <h3>${isConnected ? 'Retrouve ta progression sur tous tes appareils.' : 'Tu peux garder le mode simple, ou sauvegarder ta progression.'}</h3>
        </div>
        <span class="cloud-status-pill ${cloudStatusClass}">${escapeHtml(cloudStatusLabel)}</span>
      </div>
      <p class="cloud-progress-intro">
        ${
          isConnected
            ? "Tes résultats restent sur cet appareil et sont aussi sauvegardés sur ton compte pour les retrouver plus tard."
            : "Sans connexion, rien ne change : l'app fonctionne déjà. Si tu te connectes, tes scores et ton historique seront sauvegardés pour les retrouver ailleurs."
        }
      </p>
      ${
        !isSupabaseEnabled
          ? `
            <div class="cloud-inline-note">
              La sauvegarde en ligne n'est pas encore activée. Le mode local continue de fonctionner.
            </div>
          `
          : isConnected
            ? `
              <div class="cloud-user-row">
                <strong>${escapeHtml(state.currentUser?.email ?? 'Compte connecté')}</strong>
                <span>${escapeHtml(state.currentUser?.app_metadata?.provider === 'google' ? 'Compte Google connecté' : 'Compte connecté')}</span>
              </div>
              <div class="cloud-actions">
                <button class="btn btn-primary" id="btn-cloud-sync" type="button" ${state.authBusy ? 'disabled' : ''}>
                  ${state.syncStatus === 'syncing' ? 'Synchronisation...' : 'Synchroniser maintenant'}
                </button>
                <button class="btn btn-secondary" id="btn-auth-logout" type="button" ${state.authBusy ? 'disabled' : ''}>
                  Se déconnecter
                </button>
              </div>
            `
            : `
              <div class="cloud-provider-note">
                <strong>Le plus simple : continuer avec Google.</strong>
                <span>Une connexion rapide pour sauvegarder et retrouver ta progression.</span>
              </div>
              <div class="cloud-actions">
                <button class="btn btn-google" id="btn-auth-google" type="button" ${state.authBusy ? 'disabled' : ''}>
                  <span class="btn-google-mark">G</span>
                  <span>${state.authBusy ? 'Connexion...' : 'Continuer avec Google'}</span>
                </button>
              </div>
              <div class="auth-divider">
                <span>ou en secours</span>
              </div>
              <label class="auth-field">
                <span>Email de connexion</span>
                <input
                  id="auth-email-input"
                  type="email"
                  inputmode="email"
                  autocomplete="email"
                  placeholder="toi@entreprise.com"
                  value="${escapeHtml(state.authEmail)}"
                />
              </label>
              <div class="cloud-actions">
                <button class="btn btn-secondary" id="btn-auth-send-link" type="button" ${state.authBusy ? 'disabled' : ''}>
                  ${state.authBusy ? 'Envoi...' : 'Recevoir un lien magique'}
                </button>
              </div>
            `
      }
      ${state.authMessage ? `<p class="cloud-feedback success">${escapeHtml(state.authMessage)}</p>` : ''}
      ${state.authError ? `<p class="cloud-feedback error">${escapeHtml(state.authError)}</p>` : ''}
    </div>
  `
}

function renderProcessOverview() {
  return `
    <section class="process-overview" id="home-process">
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
    .filter((path) => getScenariosForPath(path.id).length > 0)
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
  const historyEntry = getViewingHistoryEntry()
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

      <div class="sidebar-backdrop ${state.sidebarOpen ? 'visible' : ''}" id="sidebar-backdrop"></div>

      ${
        state.screen !== 'chat'
          ? `
        <button class="mobile-nav-fab" id="btn-mobile-menu" type="button" aria-label="${state.sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}">
          <span class="mobile-nav-fab-icon">${state.sidebarOpen ? '×' : '☰'}</span>
          <span>Menu</span>
        </button>
      `
          : ''
      }

      <main class="main-content" id="main-content">
        <section class="screen ${state.screen === 'welcome' ? 'active' : ''}" id="screen-welcome">
          <div class="welcome-container">
            <div class="welcome-hero-layout">
              <div class="welcome-hero-copy">
                ${renderWelcomeHeroMeta()}
                ${renderBrandLockup('hero')}
                <h1>${buildProgressionSnapshot().hasHistory ? 'Que veux-tu travailler maintenant ?' : 'Par quoi veux-tu commencer ?'}</h1>
                <p class="welcome-intro">
                  ${
                    buildProgressionSnapshot().hasHistory
                      ? "Choisis simplement la bonne porte d’entrée : revoir un rapport, reprendre les bases ou te remettre en situation."
                      : "Commence en douceur avec l’initiation, puis passe aux simulations quand tu te sens prêt. Le parcours est là pour te faire progresser, pas pour t’écraser."
                  }
                </p>
                ${renderWelcomeLaunchpad()}
                ${renderWelcomeHighlights()}
              </div>

              <div class="welcome-hero-side">
                <div class="welcome-side-stack">
                  <div class="coach-welcome-card">
                    <div class="coach-avatar-lg">
                      <img src="${attyMascot}" alt="ATTY" />
                    </div>
                    <div class="coach-welcome-text">
                      <strong>Repère d'ATTY</strong>
                      <p>${escapeHtml(getWelcomeOrientationBrief())}</p>
                    </div>
                  </div>
                  ${renderCloudProgressCard()}
                </div>
              </div>
            </div>

            ${renderLearningPathOverview()}
          </div>
        </section>

        <section class="screen ${state.screen === 'learning-module' ? 'active' : ''}" id="screen-learning-module">
          ${renderLearningModuleScreen()}
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
                    <h3>Mode de travail sur ce niveau</h3>
                    ${renderPathQuickFacts(selectedPath)}
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
                  ${renderChatPromptSuggestions()}
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
                ${
                  historyEntry
                    ? `<p class="debrief-session-meta">Session enregistrée le ${escapeHtml(sessionDateFormatter.format(new Date(historyEntry.savedAt)))}</p>`
                    : ''
                }
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

  document.querySelectorAll('[data-learning-module-id]').forEach((element) => {
    element.addEventListener('click', () => openLearningModule(element.dataset.learningModuleId))
  })

  document.querySelectorAll('[data-learning-option-id]').forEach((element) => {
    element.addEventListener('click', () => {
      const module = getSelectedLearningModule()
      if (!module) return
      chooseLearningOption(module.id, element.dataset.learningOptionId)
    })
  })

  document.querySelectorAll('[data-history-entry-id]').forEach((element) => {
    element.addEventListener('click', () => openHistoryReport(element.dataset.historyEntryId))
  })

  document.querySelectorAll('[data-chat-prompt]').forEach((element) => {
    element.addEventListener('click', () => prefillChatPrompt(element.dataset.chatPrompt))
  })

  document.querySelectorAll('[data-scroll-target]').forEach((element) => {
    element.addEventListener('click', () => {
      document.querySelector(element.dataset.scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })

  document.querySelector('#btn-back-welcome-learning')?.addEventListener('click', goToWelcome)
  document.querySelector('#btn-back-welcome-1')?.addEventListener('click', goToWelcome)
  document.querySelector('#btn-back-welcome-2')?.addEventListener('click', goToWelcome)
  document.querySelector('#btn-complete-learning-module')?.addEventListener('click', completeCurrentLearningModule)
  document.querySelector('#btn-next-learning-module')?.addEventListener('click', openNextLearningModule)
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
  document.querySelector('#btn-auth-google')?.addEventListener('click', signInWithGoogle)
  document.querySelector('#btn-auth-send-link')?.addEventListener('click', sendMagicLink)
  document.querySelector('#btn-auth-logout')?.addEventListener('click', signOutFromCloud)
  document.querySelector('#btn-cloud-sync')?.addEventListener('click', () => {
    syncHistoryWithCloud()
  })
  document.querySelector('#btn-mobile-back')?.addEventListener('click', () => {
    state.sidebarOpen = !state.sidebarOpen
    render()
  })
  document.querySelector('#btn-mobile-menu')?.addEventListener('click', () => {
    state.sidebarOpen = !state.sidebarOpen
    render()
  })
  document.querySelector('#sidebar-backdrop')?.addEventListener('click', () => {
    state.sidebarOpen = false
    render()
  })

  const authEmailInput = document.querySelector('#auth-email-input')
  if (authEmailInput) {
    authEmailInput.addEventListener('input', () => {
      state.authEmail = authEmailInput.value
    })
    authEmailInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        sendMagicLink()
      }
    })
  }

  const textarea = document.querySelector('#chat-textarea')
  if (textarea) {
    autoResizeTextarea(textarea)
    textarea.addEventListener('input', () => {
      state.draftMessage = textarea.value
      autoResizeTextarea(textarea)
    })
    textarea.addEventListener('focus', () => {
      setChatKeyboardMode(true)
      window.setTimeout(syncScroll, 120)
    })
    textarea.addEventListener('blur', () => {
      setChatKeyboardMode(false)
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
initializeSupabaseConnection()
