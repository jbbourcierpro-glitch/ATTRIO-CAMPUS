import { getStageDefinition } from '../data/sales-process.js'

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function summarizeStagePerformance(history) {
  return history.map((item) => {
    const stage = getStageDefinition(item.stageId)
    return {
      ...item,
      stageLabel: stage?.label ?? item.stageId,
      stageShortLabel: stage?.shortLabel ?? item.stageId,
      stageObjective: stage?.objective ?? '',
      improvementHint: stage?.improvementHint ?? '',
    }
  })
}

function computeMetrics({ history, maxScore, scoreSelector }) {
  const score = history.reduce((sum, item) => sum + scoreSelector(item), 0)
  const normalizedMaxScore = Math.max(maxScore, 1)
  const percentage = Math.round((score / normalizedMaxScore) * 100)

  const ranked = [...summarizeStagePerformance(history)]
    .map((item) => ({
      ...item,
      metricScore: scoreSelector(item),
    }))
    .sort((left, right) => right.metricScore - left.metricScore)

  const strengths = ranked.filter((item) => item.metricScore >= 8).slice(0, 3)
  const watchouts = [...ranked].reverse().filter((item) => item.metricScore <= 6).slice(0, 3)

  return {
    score,
    maxScore: normalizedMaxScore,
    percentage: clamp(percentage, 0, 100),
    strengths,
    watchouts,
  }
}

function buildExpressionAggregate(history, maxScore) {
  const score = history.reduce((sum, item) => sum + (item.expressionScore ?? item.expression?.score ?? 0), 0)
  const normalizedMaxScore = Math.max(maxScore, 1)
  const percentage = Math.round((score / normalizedMaxScore) * 100)
  const breakdownTotals = history.reduce(
    (totals, item) => {
      totals.tone += item.expression?.breakdown?.tone ?? 0
      totals.clarity += item.expression?.breakdown?.clarity ?? 0
      totals.precision += item.expression?.breakdown?.precision ?? 0
      return totals
    },
    { tone: 0, clarity: 0, precision: 0 },
  )
  const stepCount = Math.max(history.length, 1)

  const averages = {
    tone: Math.round((breakdownTotals.tone / stepCount) * 10) / 10,
    clarity: Math.round((breakdownTotals.clarity / stepCount) * 10) / 10,
    precision: Math.round((breakdownTotals.precision / stepCount) * 10) / 10,
  }

  const strengths = []
  const watchouts = []

  if (averages.tone >= 8) {
    strengths.push({
      label: 'Ton crédible',
      detail: 'Le ton reste globalement respectueux et compatible avec un échange commercial.',
    })
  } else if (averages.tone < 7) {
    watchouts.push({
      label: 'Ton à professionnaliser',
      detail: 'Certaines réponses restent trop familières ou un peu abruptes.',
    })
  }

  if (averages.clarity >= 8) {
    strengths.push({
      label: 'Clarté',
      detail: 'Les formulations sont globalement lisibles et bien terminées.',
    })
  } else if (averages.clarity < 7) {
    watchouts.push({
      label: 'Clarté à polir',
      detail: 'Plusieurs réponses gagneraient à être mieux formulées ou relues.',
    })
  }

  if (averages.precision >= 8) {
    strengths.push({
      label: 'Précision',
      detail: "La formulation reste bien ancrée dans l'étape du process.",
    })
  } else if (averages.precision < 7) {
    watchouts.push({
      label: 'Précision à renforcer',
      detail: 'Certaines réponses restent trop générales ou trop rapides.',
    })
  }

  const tagCounts = history.reduce((counts, item) => {
    for (const tag of item.expression?.tags ?? []) {
      counts[tag.code] ??= { ...tag, count: 0 }
      counts[tag.code].count += 1
    }
    return counts
  }, {})

  const repeatedTagWatchouts = Object.values(tagCounts)
    .sort((left, right) => right.count - left.count)
    .slice(0, Math.max(0, 3 - watchouts.length))
    .map((tag) => ({
      label: tag.label,
      detail: tag.detail,
    }))

  const normalizedWatchouts = [...watchouts, ...repeatedTagWatchouts].slice(0, 3)

  let summary = 'Sur la forme, la communication reste claire et crédible pour ce niveau.'

  if (percentage < 75) {
    summary =
      "Sur la forme, l'intention commerciale est là, mais plusieurs réponses restent encore rapides, familières ou insuffisamment précises."
  } else if (percentage < 88) {
    summary =
      "Sur la forme, la base est bonne, mais certaines réponses gagneraient encore en tenue, en précision ou en finition."
  }

  return {
    score,
    maxScore: normalizedMaxScore,
    percentage: clamp(percentage, 0, 100),
    averages,
    strengths,
    watchouts: normalizedWatchouts,
    summary,
  }
}

export function buildDebriefing({ scenario, history, attempts }) {
  const maxScore = scenario.steps.length * 10
  const finalMetrics = computeMetrics({
    history,
    maxScore,
    scoreSelector: (item) => item.score,
  })
  const processMetrics = computeMetrics({
    history,
    maxScore,
    scoreSelector: (item) => item.processScore ?? item.score,
  })
  const expressionMetrics = buildExpressionAggregate(history, maxScore)

  let grade = 'Base à construire'
  let gradeClass = 'error'
  let headline =
    "Tu tiens l'échange, mais le process et la forme ne sont pas encore assez solides pour donner une impression vraiment maîtrisée."

  if (finalMetrics.percentage >= 90) {
    grade = 'Très bon niveau'
    gradeClass = 'success'
    headline =
      'Très solide. Tu tiens à la fois le process de vente ATTRIO et une posture commerciale crédible.'
  } else if (finalMetrics.percentage >= 75) {
    grade = 'Bonne maîtrise'
    gradeClass = 'success'
    headline =
      'Bonne base. Le process est bien présent, avec encore quelques étapes et formulations à rendre plus nettes.'
  } else if (finalMetrics.percentage >= 55) {
    grade = 'Process à consolider'
    gradeClass = 'warning'
    headline =
      'Tu tiens la conversation, mais plusieurs étapes clés et plusieurs formulations restent encore insuffisamment sécurisées.'
  }

  const strengthsText =
    finalMetrics.strengths.length > 0
      ? `Points forts : ${finalMetrics.strengths.map((item) => item.stageLabel).join(', ')}.`
      : 'Aucun temps fort clair ne ressort encore dans le process.'

  const watchoutsText =
    finalMetrics.watchouts.length > 0
      ? `À renforcer sur le fond : ${finalMetrics.watchouts
          .map((item) => `${item.stageLabel.toLowerCase()} (${item.improvementHint.toLowerCase()})`)
          .join(' ; ')}.`
      : 'Le fond du process est globalement homogène.'

  return {
    score: finalMetrics.score,
    maxScore: finalMetrics.maxScore,
    percentage: finalMetrics.percentage,
    progressionPercentage: processMetrics.percentage,
    processScore: processMetrics.score,
    processMaxScore: processMetrics.maxScore,
    processPercentage: processMetrics.percentage,
    expressionScore: expressionMetrics.score,
    expressionMaxScore: expressionMetrics.maxScore,
    expressionPercentage: expressionMetrics.percentage,
    expressionSummary: expressionMetrics.summary,
    expressionStrengths: expressionMetrics.strengths,
    expressionWatchouts: expressionMetrics.watchouts,
    expressionAverages: expressionMetrics.averages,
    grade,
    gradeClass,
    feedback: `${headline} ${strengthsText} ${watchoutsText} ${expressionMetrics.summary}`,
    attempts,
    strengths: finalMetrics.strengths,
    watchouts: finalMetrics.watchouts,
    history: summarizeStagePerformance(history),
  }
}
