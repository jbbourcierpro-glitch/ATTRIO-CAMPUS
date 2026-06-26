import { evaluateExpression } from './expression-engine.js'
import { buildDebriefing } from './scoring-engine.js'
import { buildAdaptiveProspectReply, extractConversationSignals } from './conversation-engine.js'

const PROSPECT_VARIATION_STORAGE_KEY = 'attrio-campus-prospect-variants-v1'

const prospectPrefixes = {
  context: ['Pour te situer, ', 'Concrètement, '],
  problem: ['Très franchement, ', 'Le fond du sujet, c’est que '],
  impact: ['Au bout du compte, ', 'Concrètement, '],
  needs: ['Si on va au fond, ', 'En clair, '],
  transition: ['Si je suis direct, ', 'Oui, clairement, '],
  solution: ['D’accord, ', 'Très bien, '],
  objections: ['Honnêtement, ', 'Mon vrai sujet, c’est que '],
  closing: ['Si on avance, ', 'Très bien, '],
}

const replacementSets = {
  a: [
    [/^Je gère/i, 'Je pilote'],
    [/^On a/i, 'Aujourd’hui, on a'],
    [/^Le problème, c'est/i, 'Le vrai sujet, c’est'],
    [/^Le vrai sujet, c'est/i, 'Le fond du sujet, c’est'],
    [/^Au final,/i, 'Au bout du compte,'],
    [/^Exactement\./i, 'Oui, exactement.'],
    [/^Vas-y\./i, 'Allez, vas-y.'],
    [/^Honnêtement,/i, 'Très franchement,'],
    [/^Si on continue,/i, 'Si on va plus loin,'],
    [/^D'accord\./i, 'Très bien.'],
  ],
  b: [
    [/^Je gère/i, 'Aujourd’hui je gère'],
    [/^On a/i, 'En ce moment, on a'],
    [/^Le problème, c'est/i, 'Ce qui bloque surtout, c’est'],
    [/^Le vrai sujet, c'est/i, 'Ce qui bloque surtout, c’est'],
    [/^Au final,/i, 'Au final, concrètement,'],
    [/^Exactement\./i, 'C’est exactement ça.'],
    [/^Vas-y\./i, 'Je t’écoute.'],
    [/^Honnêtement,/i, 'Pour être clair,'],
    [/^Si on continue,/i, 'Si on poursuit,'],
    [/^D'accord\./i, 'D’accord, je t’écoute.'],
  ],
  c: [
    [/^Je gère/i, 'De mon côté, je gère'],
    [/^On a/i, 'Chez nous, on a'],
    [/^Le problème, c'est/i, 'Le point de friction, c’est'],
    [/^Le vrai sujet, c'est/i, 'Le point de friction, c’est'],
    [/^Au final,/i, 'Dans les faits,'],
    [/^Exactement\./i, 'Oui, c’est bien ça.'],
    [/^Vas-y\./i, 'Tu peux y aller.'],
    [/^Honnêtement,/i, 'Si je te le dis franchement,'],
    [/^Si on continue,/i, 'Si on décide d’avancer,'],
    [/^D'accord\./i, 'Très bien, allons-y.'],
  ],
}

function normalizeMessage(message) {
  return String(message).replace(/\s+/g, ' ').trim()
}

function lowerFirstLetter(message) {
  if (!message) return message
  return message.charAt(0).toLowerCase() + message.slice(1)
}

function applyReplacementSet(message, setName) {
  return replacementSets[setName].reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), message)
}

function withPrefix(message, stageId, index) {
  const prefixes = prospectPrefixes[stageId] ?? ['Concrètement, ', 'Honnêtement, ']
  const prefix = prefixes[index] ?? prefixes[0]
  return `${prefix}${lowerFirstLetter(message)}`
}

function buildProspectMessageVariants(step) {
  const baseMessage = normalizeMessage(step.prospectMessage)
  const explicitVariants = Array.isArray(step.prospectMessageVariants) ? step.prospectMessageVariants : []

  const generatedVariants = [
    baseMessage,
    ...explicitVariants.map((variant) => normalizeMessage(variant)),
    normalizeMessage(withPrefix(applyReplacementSet(baseMessage, 'a'), step.stageId, 0)),
    normalizeMessage(withPrefix(applyReplacementSet(baseMessage, 'b'), step.stageId, 1)),
    normalizeMessage(withPrefix(applyReplacementSet(baseMessage, 'c'), step.stageId, 0)),
  ]

  return [...new Set(generatedVariants.filter(Boolean))]
}

function readProspectVariationHistory() {
  try {
    return JSON.parse(window.localStorage.getItem(PROSPECT_VARIATION_STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function writeProspectVariationHistory(history) {
  try {
    window.localStorage.setItem(PROSPECT_VARIATION_STORAGE_KEY, JSON.stringify(history))
  } catch {
    // no-op
  }
}

function chooseVariantIndex({ scenarioId, stepIndex, variants }) {
  if (variants.length <= 1) return 0

  const history = readProspectVariationHistory()
  const key = `${scenarioId}:${stepIndex}`
  const lastIndex = Number.isInteger(history[key]) ? history[key] : -1
  const nextIndex = (lastIndex + 1) % variants.length

  history[key] = nextIndex
  writeProspectVariationHistory(history)

  return nextIndex
}

function getScoringWeights(trainingPathId) {
  if (trainingPathId === 'expert') {
    return { process: 0.55, expression: 0.45 }
  }

  if (trainingPathId === 'advanced') {
    return { process: 0.62, expression: 0.38 }
  }

  if (trainingPathId === 'progression') {
    return { process: 0.7, expression: 0.3 }
  }

  return { process: 0.8, expression: 0.2 }
}

function scoreToType(score) {
  if (score >= 8) return 'success'
  if (score >= 6) return 'warning'
  return 'error'
}

export class SimulationEngine {
  constructor() {
    this.reset()
  }

  reset() {
    this.currentScenario = null
    this.currentStepIndex = 0
    this.history = []
    this.scoreSum = 0
    this.attempts = 0
    this.isCompleted = false
    this.activeTurnAnalysis = null
    this.resolvedProspectMessages = []
    this.signalTrail = []
  }

  startScenario(scenario) {
    this.reset()
    this.currentScenario = scenario
    this.resolvedProspectMessages = scenario.steps.map((step, stepIndex) => {
      const variants = buildProspectMessageVariants(step)
      const selectedIndex = chooseVariantIndex({
        scenarioId: scenario.id,
        stepIndex,
        variants,
      })

      return variants[selectedIndex] ?? step.prospectMessage
    })
    return this.getCurrentProspectMessage()
  }

  getCurrentStep() {
    if (!this.currentScenario || this.isCompleted) return null
    return this.currentScenario.steps[this.currentStepIndex] ?? null
  }

  getCurrentProspectMessage() {
    return this.resolvedProspectMessages[this.currentStepIndex] ?? this.getCurrentStep()?.prospectMessage ?? null
  }

  getCurrentGuideline() {
    return this.getCurrentStep()?.coachDirective ?? null
  }

  getCurrentStageId() {
    return this.getCurrentStep()?.stageId ?? null
  }

  analyzeResponse(userText) {
    if (!this.currentScenario || this.isCompleted) return null

    this.attempts += 1

    const currentStep = this.getCurrentStep()
    const matchedRule =
      currentStep.rules.find((rule) => rule.pattern instanceof RegExp && rule.pattern.test(userText)) ??
      currentStep.rules[currentStep.rules.length - 1]
    const expression = evaluateExpression({
      userMessage: userText,
      stageId: currentStep.stageId,
    })
    const weights = getScoringWeights(this.currentScenario.trainingPathId)
    const combinedScore = Math.round(matchedRule.score * weights.process + expression.score * weights.expression)

    this.activeTurnAnalysis = {
      stageId: currentStep.stageId,
      userMessage: userText,
      prospectMessage: this.getCurrentProspectMessage(),
      score: combinedScore,
      processScore: matchedRule.score,
      expressionScore: expression.score,
      feedback: `${matchedRule.feedback} ${expression.summary}`,
      processFeedback: matchedRule.feedback,
      expressionFeedback: expression.summary,
      type: scoreToType(combinedScore),
      processType: matchedRule.type,
      expressionType: expression.type,
      ruleName: matchedRule.name,
      expression,
      conversationSignals: extractConversationSignals({
        stageId: currentStep.stageId,
        userMessage: userText,
      }),
    }

    return this.activeTurnAnalysis
  }

  commitTurn() {
    if (!this.activeTurnAnalysis) return null

    const resolvedTurn = { ...this.activeTurnAnalysis }

    this.history.push(resolvedTurn)
    this.scoreSum += resolvedTurn.score
    this.signalTrail.push({
      stageId: resolvedTurn.stageId,
      userMessage: resolvedTurn.userMessage,
      signals: resolvedTurn.conversationSignals ?? [],
    })
    this.activeTurnAnalysis = null
    this.currentStepIndex += 1

    if (this.currentStepIndex >= this.currentScenario.steps.length) {
      this.isCompleted = true
      return { isFinished: true }
    }

    const nextStep = this.getCurrentStep()
    const nextBaseMessage =
      this.resolvedProspectMessages[this.currentStepIndex] ?? nextStep?.prospectMessage ?? null
    const nextProspectMessage = buildAdaptiveProspectReply({
      scenario: this.currentScenario,
      nextStep,
      baseMessage: nextBaseMessage,
      previousStageId: resolvedTurn.stageId,
      userMessage: resolvedTurn.userMessage,
      signalTrail: this.signalTrail,
    })

    this.resolvedProspectMessages[this.currentStepIndex] = nextProspectMessage

    return {
      isFinished: false,
      nextProspectMessage,
      nextStageId: this.getCurrentStageId(),
    }
  }

  retryTurn() {
    this.activeTurnAnalysis = null
  }

  getFinalScore() {
    return this.scoreSum
  }

  getMaxPossibleScore() {
    if (!this.currentScenario) return 0
    return this.currentScenario.steps.length * 10
  }

  getDebriefing() {
    if (!this.currentScenario) return null
    return buildDebriefing({
      scenario: this.currentScenario,
      history: this.history,
      attempts: this.attempts,
    })
  }
}
