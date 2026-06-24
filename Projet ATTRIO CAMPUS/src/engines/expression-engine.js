function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function normalizeText(value) {
  return String(value).replace(/\s+/g, ' ').trim()
}

function countWords(text) {
  return normalizeText(text)
    .split(' ')
    .filter(Boolean).length
}

function uniqByCode(items) {
  const seen = new Set()
  return items.filter((item) => {
    if (seen.has(item.code)) return false
    seen.add(item.code)
    return true
  })
}

function scoreToType(score) {
  if (score >= 8) return 'success'
  if (score >= 6) return 'warning'
  return 'error'
}

const professionalTonePatterns = [
  /\bj['’]aimerais\b/i,
  /\bje voudrais\b/i,
  /\bsi je comprends bien\b/i,
  /\bsi je résume\b/i,
  /\bje comprends\b/i,
  /\bje te propose\b/i,
]

const informalIssues = [
  {
    code: 'too_familiar',
    label: 'Ton trop familier',
    detail: 'Le ton reste un peu trop familier pour un échange commercial structuré.',
    pattern: /\b(top|super|nickel|cool|pas de souci|pas de soucis|tu vas te régaler|gal[eè]re)\b/i,
  },
  {
    code: 'too_abrupt',
    label: 'Formulation abrupte',
    detail: 'La réponse part trop vite et manque un peu de tenue commerciale.',
    pattern: /^(non|ouais|ok|bah)\b/i,
  },
]

const clarityIssues = [
  {
    code: 'needs_polish',
    label: 'Formulation à polir',
    detail: 'La phrase gagnerait à être un peu plus propre et mieux finie.',
    pattern: /\b(en fait|genre)\b/i,
  },
  {
    code: 'possible_typos',
    label: 'Orthographe à soigner',
    detail: 'Quelques fautes visibles peuvent faire baisser la crédibilité perçue.',
    pattern: /\b(aujourd['’]?huit|vraiement|éx|foit|pensses?|reel)\b/i,
  },
]

const precisionIssues = [
  {
    code: 'too_promotional',
    label: 'Promesse trop rapide',
    detail: 'Tu valorises trop vite la solution sans assez l’ancrer dans le besoin exprimé.',
    pattern: /\b(c['’]est top|tu vas te régaler|c['’]est facile|c['’]est simple|super solution)\b/i,
  },
  {
    code: 'too_vague',
    label: 'Réponse trop vague',
    detail: 'La formulation reste trop générale et pas assez concrète.',
    pattern: /\b(truc|machin|tout ça|comme ça|c['’]est bien|c['’]est top)\b/i,
  },
]

const stageKeywords = {
  context: ['comment', 'aujourd', 'fonction', 'pilot', 'outil', 'équipe', 'prestataire', 'occupant'],
  problem: ['friction', 'probl', 'frustr', 'bloque', 'perd', 'relance', 'difficult', 'coince'],
  impact: ['impact', 'conséquence', 'temps', 'délai', 'coût', 'risque', 'quotidien', 'quand'],
  needs: ['attend', 'besoin', 'objectif', 'souhait', 'réussite', 'important', 'voudrais'],
  transition: ['résume', 'comprends', 'enjeu', 'centralis', 'coordination', 'si je'],
  solution: ['attrio', 'centralis', 'suivi', 'coordination', 'prestataire', 'vision', 'partag'],
  objections: ['je comprends', 'vigilance', 'important', 'simple', 'utile', 'équipe', 'prestataire'],
  closing: ['démo', 'suite', 'prochaine', 'créneau', 'cas concret', 'propose', 'avancer'],
}

const stageRewrites = {
  context:
    "J'aimerais comprendre comment tu fonctionnes aujourd'hui entre toi, les occupants et le prestataire.",
  problem: "Qu'est-ce qui te fait perdre le plus de temps aujourd'hui dans ce fonctionnement ?",
  impact: 'Quand ça se produit, quelles conséquences concrètes cela crée au quotidien ?',
  needs: "Si cela fonctionnait bien, qu'attendrais-tu concrètement d'un suivi partagé ?",
  transition:
    'Si je résume, ton enjeu est de fluidifier la coordination entre toi, les occupants et le prestataire. C’est bien cela ?',
  solution:
    'Dans ce cas, ATTRIO peut centraliser les demandes, partager le suivi avec le prestataire et te donner une vision claire sans rajouter de pilotage manuel.',
  objections:
    "Je comprends ta vigilance. L'enjeu, c'est que l'outil reste utile pour toi et simple pour tes équipes, pas seulement pour le prestataire.",
  closing:
    'Je te propose une démo courte sur un cas concret entre toi et le prestataire pour voir si cela colle à ton fonctionnement.',
}

function buildExpressionSummary({ strengths, issues, score }) {
  if (issues.length === 0) {
    return 'Sur la forme, la réponse reste claire, crédible et adaptée à un échange commercial.'
  }

  const firstIssue = issues[0]?.detail?.toLowerCase() ?? 'la formulation doit encore être renforcée.'
  const firstStrength = strengths[0]?.detail?.toLowerCase() ?? null

  if (firstStrength && score >= 6) {
    return `Sur la forme, ${firstStrength}, mais ${firstIssue}`
  }

  return `Sur la forme, ${firstIssue}`
}

export function evaluateExpression({ userMessage, stageId }) {
  const text = normalizeText(userMessage)
  const lowerText = text.toLowerCase()
  const words = countWords(text)
  const hasClosingPunctuation = /[?.!]$/.test(text)
  const keywordMatches = (stageKeywords[stageId] ?? []).filter((keyword) => lowerText.includes(keyword)).length

  let tone = 7
  let clarity = 7
  let precision = 6

  const strengths = []
  const issues = []

  if (professionalTonePatterns.some((pattern) => pattern.test(text))) {
    tone += 1
    strengths.push({
      code: 'professional_tone',
      label: 'Ton respectueux',
      detail: 'le ton reste plutôt respectueux et crédible',
    })
  }

  const informalMatches = informalIssues.filter((issue) => issue.pattern.test(text))
  if (informalMatches.length > 0) {
    tone -= 2 * informalMatches.length
    issues.push(...informalMatches)
  }

  const clarityMatches = clarityIssues.filter((issue) => issue.pattern.test(text))
  if (clarityMatches.length > 0) {
    clarity -= clarityMatches.some((issue) => issue.code === 'possible_typos') ? 1 : 0
    clarity -= clarityMatches.filter((issue) => issue.code !== 'possible_typos').length
    issues.push(...clarityMatches)
  }

  const precisionMatches = precisionIssues.filter((issue) => issue.pattern.test(text))
  if (precisionMatches.length > 0) {
    precision -= 2
    if (precisionMatches.some((issue) => issue.code === 'too_promotional')) {
      tone -= 1
    }
    issues.push(...precisionMatches)
  }

  if (words < 5) {
    clarity -= 3
    precision -= 2
    issues.push({
      code: 'too_short',
      label: 'Réponse trop courte',
      detail: 'La réponse est trop courte pour installer une vraie crédibilité commerciale.',
    })
  } else if (words < 8) {
    clarity -= 1
  } else if (words >= 8 && words <= 20) {
    clarity += 1
    strengths.push({
      code: 'clear_length',
      label: 'Réponse directe',
      detail: 'la réponse va assez droit au but',
    })
  }

  if (hasClosingPunctuation) {
    clarity += 1
    strengths.push({
      code: 'clear_finish',
      label: 'Phrase propre',
      detail: 'la phrase est mieux terminée et plus lisible',
    })
  } else if (words > 10) {
    clarity -= 1
  }

  if (keywordMatches >= 2) {
    precision += 2
    strengths.push({
      code: 'stage_precision',
      label: 'Bonne précision',
      detail: "la réponse reste bien ancrée dans l'étape en cours",
    })
  } else if (keywordMatches === 1) {
    precision += 1
  } else if (words < 8) {
    precision -= 1
  }

  if (stageId === 'transition' && /(si je résume|si je comprends bien|donc)/i.test(text)) {
    precision += 1
  }

  if (stageId === 'objections' && /\bje comprends\b/i.test(text)) {
    tone += 1
  }

  if (stageId === 'closing' && /\b(démo|propose|suite|créneau|cas concret)\b/i.test(text)) {
    precision += 1
  }

  tone = clamp(tone, 0, 10)
  clarity = clamp(clarity, 0, 10)
  precision = clamp(precision, 0, 10)

  const score = Math.round(tone * 0.35 + clarity * 0.3 + precision * 0.35)
  const normalizedIssues = uniqByCode(issues)
  const normalizedStrengths = uniqByCode(strengths)

  return {
    score,
    type: scoreToType(score),
    summary: buildExpressionSummary({
      strengths: normalizedStrengths,
      issues: normalizedIssues,
      score,
    }),
    breakdown: {
      tone,
      clarity,
      precision,
    },
    tags: normalizedIssues.map((issue) => ({
      code: issue.code,
      label: issue.label,
      detail: issue.detail,
    })),
    strengths: normalizedStrengths,
    rewrite:
      score <= 7 || normalizedIssues.length > 0
        ? stageRewrites[stageId] ?? "J'aimerais reformuler ça de manière plus claire et plus commerciale."
        : null,
  }
}
