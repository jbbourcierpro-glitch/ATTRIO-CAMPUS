import { getPersona } from '../data/personas.js'

function lowerFirstLetter(message) {
  if (!message) return message
  if (/^[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]/.test(message)) {
    return message.charAt(0).toLowerCase() + message.slice(1)
  }
  return message
}

function normalizeMessage(message) {
  return String(message ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .trim()
}

function signalPattern(pattern) {
  return pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i')
}

function composeReply(baseMessage, lead, nextStageId) {
  const base = cleanStageOpening(nextStageId, normalizeMessage(baseMessage))
  if (!lead) return base
  if (!base) return normalizeMessage(lead)
  return normalizeMessage(`${lead} ${lowerFirstLetter(base)}`)
}

const signalMap = {
  context: [
    { id: 'channels', pattern: /\b(mail|mails|telephone|téléphone|appel|appels|whatsapp|canaux|demandes|flux)\b/i },
    { id: 'team', pattern: /\b(equipe|équipe|technicien|techniciens|qui|intervenants|prestataire|occupants|accueil)\b/i },
    { id: 'volume', pattern: /\b(combien|volume|rythme|par jour|par semaine|charge)\b/i },
    { id: 'sites', pattern: /\b(site|sites|batiment|bâtiment|residence|résidence|immeuble)\b/i },
    { id: 'tools', pattern: /\b(outil|outils|excel|tableau|tableaux|gmao|logiciel|logiciels|whatsapp|mail)\b/i },
  ],
  problem: [
    { id: 'loss', pattern: /\b(oubli|oubliez|perd|perdu|perdent|fuit|fuite)\b/i },
    { id: 'visibility', pattern: /\b(vision|visibilite|visibilité|suivi|historique|tracabilite|traçabilité)\b/i },
    { id: 'relances', pattern: /\b(relance|relances|rappelle|rappellent|reponse|réponse)\b/i },
    { id: 'duplicate', pattern: /\b(double|doublon|duplique|dupliqu[eé])\b/i },
    { id: 'preventive', pattern: /\b(preventif|préventif|curatif|maintenance)\b/i },
  ],
  impact: [
    { id: 'time', pattern: /\b(temps|minutes|heures|charge|temps perdu)\b/i },
    { id: 'delay', pattern: /\b(retard|delai|délai|attente|ralentit|rallonge)\b/i },
    { id: 'quality', pattern: /\b(qualite|qualité|service|occupants|image|satisfaction)\b/i },
    { id: 'risk', pattern: /\b(risque|erreur|urgent|urgence|manque)\b/i },
    { id: 'dependence', pattern: /\b(depend|dépend|arbitre|arbitrer|pilotage|vision complete|vision complète)\b/i },
  ],
  needs: [
    { id: 'simplicity', pattern: /\b(simple|simplicite|simplicité|leger|léger|fluide)\b/i },
    { id: 'visibility', pattern: /\b(vision|visibilite|visibilité|suivi|pilotage|tableau de bord)\b/i },
    { id: 'adoption', pattern: /\b(adoption|terrain|equipes|équipes|usage|utilisation)\b/i },
    { id: 'roles', pattern: /\b(qui fait quoi|roles|rôles|responsable|prestataire)\b/i },
    { id: 'preventive', pattern: /\b(preventif|préventif|curatif|maintenance)\b/i },
  ],
  transition: [
    { id: 'summary', pattern: /\b(si je comprends bien|si je resume|si je résume|si je reformule|donc)\b/i },
    { id: 'validation', pattern: /\b(c'est bien ca|c’est bien ça|on est d'accord|ça te parle|est-ce que j'ai bien compris)\b/i },
  ],
  solution: [
    { id: 'centralization', pattern: /\b(centralis|interface unique|meme endroit|même endroit|suivi partage|suivi partagé)\b/i },
    { id: 'simplicity', pattern: /\b(simple|leger|léger|usine a gaz|usine à gaz|prise en main)\b/i },
    { id: 'adoption', pattern: /\b(adoption|terrain|equipes|équipes|roles|rôles)\b/i },
    { id: 'preventive', pattern: /\b(preventif|préventif|curatif|maintenance)\b/i },
    { id: 'existing_tool', pattern: /\b(existant|outil deja en place|outil déjà en place|gmao|excel)\b/i },
  ],
  objections: [
    { id: 'adoption', pattern: /\b(adoption|terrain|equipes|équipes|utilise|utiliser|prise en main)\b/i },
    { id: 'simplicity', pattern: /\b(simple|leger|léger|usine a gaz|usine à gaz|lourd)\b/i },
    { id: 'existing_tool', pattern: /\b(existant|outil deja|outil déjà|remplacer|comparaison)\b/i },
    { id: 'roi', pattern: /\b(roi|retour|valeur|gain)\b/i },
    { id: 'governance', pattern: /\b(gouvernance|droits|pilotage|multi-site|multisite)\b/i },
  ],
  closing: [
    { id: 'demo', pattern: /\b(demo|démo|cas concret|montrer)\b/i },
    { id: 'pilot', pattern: /\b(site pilote|pilote|premier site|cas simple)\b/i },
    { id: 'timing', pattern: /\b(creneau|créneau|agenda|semaine prochaine|demain|dispo|visio|appel)\b/i },
  ],
}

const intentMap = [
  { id: 'example', pattern: /\b(exemple|exemples|concret|concrètement|cas concret|illustration)\b/i },
  { id: 'quantify', pattern: /\b(combien|impact|impacts|cout|coût|temps|retard|délai|delai|conséquence|consequence|réel|reel|réels|reels)\b/i },
  { id: 'actors', pattern: /\b(qui|équipe|equipes|equipe|technicien|techniciens|prestataire|prestataires|occupants|demandeur|demandeurs|gestionnaire|gestionnaires|intervenant|intervenants)\b/i },
  { id: 'tools', pattern: /\b(outil|outils|excel|gmao|logiciel|logiciels|mail|mails|téléphone|telephone|whatsapp|canaux)\b/i },
  { id: 'volume', pattern: /\b(volume|combien|rythme|par jour|par semaine|charge)\b/i },
  { id: 'success', pattern: /\b(idéal|ideal|top|réussite|reussite|bon fonctionnement|objectif|attendez|souhaitez|voudriez)\b/i },
  { id: 'summary', pattern: /\b(si je résume|si je resume|si je comprends bien|si je reformule|donc|en gros)\b/i },
  { id: 'validation', pattern: /\b(c'est bien ça|c’est bien ça|on est d'accord|on est d’accord|j'ai bien compris|ça te parle)\b/i },
  { id: 'reassurance', pattern: /\b(simple|simplicité|simplicite|progressif|progressive|adoption|terrain|pas lourd|usine à gaz|prise en main)\b/i },
  { id: 'proof', pattern: /\b(preuve|roi|gouvernance|droits|déploiement|deploiement|méthode|methode|crédible|credible)\b/i },
  { id: 'nextstep', pattern: /\b(démo|demo|atelier|suite|prochaine étape|prochaine etape|créneau|creneau|montrer)\b/i },
  { id: 'frustration', pattern: /\b(frustration|frustrant|gêne|gene|irritant|bloque|douleur)\b/i },
]

const baseOpeningPatterns = {
  problem: [
    /^pour te situer,\s*/i,
    /^concrètement,\s*/i,
    /^très franchement,\s*/i,
    /^aujourd'hui,\s*/i,
    /^de mon côté,\s*/i,
    /^chez nous,\s*/i,
    /^(et\s+derrière,\s*)?le problème,\s*c['’]est\s*qu['’]?\s*/i,
    /^(et\s+derrière,\s*)?le (vrai sujet|fond du sujet|point de friction),\s*c['’]est\s*qu['’]?\s*/i,
    /^(et\s+derrière,\s*)?ce qui (nous pénalise surtout|me gêne aujourd’hui|bloque surtout),\s*c['’]est\s*qu['’]?\s*/i,
  ],
  impact: [
    /^résultat\s*:\s*/i,
    /^au final,\s*/i,
    /^au bout du compte,\s*/i,
    /^concrètement,\s*/i,
    /^dans les faits,\s*/i,
    /^le problème derrière,\s*c['’]est\s*qu['’]?\s*/i,
    /^oui,\s*et\s*/i,
  ],
  needs: [
    /^si on pouvait\s*/i,
    /^si j['’]avais\s*/i,
    /^pour moi,\s*le vrai gain serait simple\s*:?\s*/i,
    /^pour moi,\s*la cible serait simple\s*:?\s*/i,
    /^ce que j['’]attends,\s*c['’]est\s*:?\s*/i,
    /^ce que je veux,\s*c['’]est\s*:?\s*/i,
    /^si on avance sur un autre modèle,\s*il faut que ce soit\s*/i,
    /^si j['’]avance avec un éditeur,\s*il faut qu['’]il\s*/i,
    /^pour sortir de ça,\s*il me faudrait\s*/i,
  ],
  transition: [
    /^oui,\s*/i,
    /^exactement\.?\s*/i,
    /^oui,\s*c['’]est bien ça\.?\s*/i,
    /^oui,\s*clairement\.?\s*/i,
    /^si on parle d['’]un outil simple pour centraliser et suivre,\s*je t['’]écoute\.?\s*/i,
  ],
  solution: [
    /^oui,\s*ta lecture tient la route\.?\s*/i,
    /^oui,\s*on est alignés là-dessus\.?\s*/i,
    /^d['’]accord\.\s*/i,
    /^très bien\.\s*/i,
    /^vas-y\.\s*/i,
    /^allez,\s*vas-y\.\s*/i,
    /^je t['’]écoute,?\s*/i,
    /^à condition que ce ne soit pas encore une couche de complexité en plus\.?\s*/i,
  ],
  objections: [
    /^honnêtement,\s*/i,
    /^très franchement,\s*/i,
    /^ma peur,\s*c['’]est(?:\s*de)?\s*/i,
    /^mon vrai frein,\s*c['’]est(?:\s*de)?\s*/i,
    /^mon vrai sujet,\s*c['’]est(?:\s*que)?\s*/i,
    /^ce qui m['’]inquiète,\s*c['’]est(?:\s*que)?\s*/i,
    /^mon petit point d['’]attention,\s*c['’]est(?:\s*de)?\s*/i,
    /^je suis preneur,\s*mais pas si\s*/i,
  ],
  closing: [
    /^si tu peux\s*/i,
    /^si on continue,\s*/i,
    /^pour avancer,\s*/i,
    /^si on prend un prochain temps,\s*/i,
    /^si on avance,\s*/i,
    /^très bien,\s*si on avance,\s*/i,
  ],
}

const candidatePatternsByIntent = {
  example: /\b(exemple|exemples|cas concret|concret|concrètement|illustration)\b/i,
  quantify: /\b(combien|temps|co[uû]t|retard|d[ée]lai|cons[ée]quence|impact|charge|r[ée]el)\b/i,
  actors: /\b(occupants?|prestataires?|techniciens?|gestionnaires?|intervenants?|[ée]quipe|accueil|demandeurs?)\b/i,
  tools: /\b(outil|outils|gmao|excel|logiciel|mail|mails|t[ée]l[ée]phone|whatsapp|canaux)\b/i,
  success: /\b(bon fonctionnement|objectif|r[ée]ussite|attendez|souhaitez|voudriez|top)\b/i,
  reassurance: /\b(simple|simplicité|simplicite|progressif|adoption|terrain|prise en main|usine [àa] gaz)\b/i,
  proof: /\b(preuve|roi|gouvernance|droits|d[ée]ploiement|m[ée]thode|cr[ée]dible)\b/i,
  nextstep: /\b(d[ée]mo|atelier|suite|cr[ée]neau|cas concret|site pilote|appel|visio)\b/i,
}

const stagePatternsBySignal = {
  problem: {
    channels: /\b(mail|mails|t[ée]l[ée]phone|appel|appels|whatsapp|canaux|flux)\b/i,
    team: /\b(accueil|occupants?|techniciens?|prestataires?|acteurs?)\b/i,
    tools: /\b(outil|outils|excel|gmao|logiciel)\b/i,
    volume: /\b(volume|charge|rythme)\b/i,
    sites: /\b(site|sites|b[âa]timent|immeuble|r[ée]sidence)\b/i,
  },
  impact: {
    loss: /\b(perd|perdu|oubli|oublis?)\b/i,
    visibility: /\b(vision|visibilit[ée]|historique|suivi)\b/i,
    relances: /\b(relance|relances|rappelle|rappellent)\b/i,
    preventive: /\b(pr[ée]ventif|maintenance)\b/i,
    duplicate: /\b(double|doublon|duplique)\b/i,
  },
  needs: {
    time: /\b(temps|pilotage)\b/i,
    delay: /\b(retard|d[ée]lai|attente)\b/i,
    quality: /\b(service|occupants?|qualit[ée])\b/i,
    risk: /\b(risque|urgence|conformit[ée])\b/i,
    dependence: /\b(d[ée]pend|arbitre|arbitrer|vision compl[èe]te)\b/i,
  },
  transition: {
    simplicity: /\b(simple|simplicit[ée])\b/i,
    visibility: /\b(vision|visibilit[ée]|suivi)\b/i,
    adoption: /\b(adoption|usage|[ée]quipes?|terrain)\b/i,
    roles: /\b(qui fait quoi|r[ôo]les?|prestataire)\b/i,
    preventive: /\b(pr[ée]ventif|curatif|maintenance)\b/i,
  },
  solution: {
    summary: /\b(r[ée]sum[ée]|reformule|lecture)\b/i,
    validation: /\b(c['’]est bien [çc]a|align[ée]s?|d['’]accord)\b/i,
  },
  objections: {
    simplicity: /\b(simple|lourd|usine [àa] gaz)\b/i,
    adoption: /\b(adoption|prise en main|terrain|[ée]quipes?)\b/i,
    existing_tool: /\b(existant|gmao|outil d[ée]j[àa])\b/i,
    roi: /\b(roi|retour|valeur|gain)\b/i,
    governance: /\b(gouvernance|droits|pilotage|multi-sites?)\b/i,
  },
  closing: {
    demo: /\b(d[ée]mo|montrer|cas concret)\b/i,
    pilot: /\b(site pilote|pilote|premier site)\b/i,
    timing: /\b(cr[ée]neau|agenda|semaine prochaine|demain|dispo|visio|appel)\b/i,
  },
}

function extractSignals(stageId, userMessage) {
  const definitions = signalMap[stageId] ?? []
  return definitions.filter((definition) => signalPattern(definition.pattern).test(userMessage)).map((definition) => definition.id)
}

function extractIntents(userMessage) {
  return [...new Set(intentMap.filter((definition) => signalPattern(definition.pattern).test(userMessage)).map((definition) => definition.id))]
}

function pickSignal(signals, priority) {
  return priority.find((signal) => signals.includes(signal)) ?? signals[0] ?? null
}

function hasIntent(intents, intentId) {
  return intents.includes(intentId)
}

function cleanStageOpening(stageId, message) {
  const patterns = baseOpeningPatterns[stageId] ?? []
  return normalizeMessage(patterns.reduce((current, pattern) => current.replace(pattern, ''), message))
}

function getStepCandidates(step) {
  return [...new Set([step?.prospectMessage, ...(step?.prospectMessageVariants ?? [])].map((item) => normalizeMessage(item)).filter(Boolean))]
}

function scoreCandidate(candidate, { nextStageId, signals, intents }) {
  let score = 0

  for (const intent of intents) {
    const pattern = candidatePatternsByIntent[intent]
    if (pattern?.test(candidate)) {
      score += 3
    }
  }

  const stagePatterns = stagePatternsBySignal[nextStageId] ?? {}
  for (const signal of signals) {
    const pattern = stagePatterns[signal]
    if (pattern?.test(candidate)) {
      score += 4
    }
  }

  if (nextStageId === 'transition' && /\b(résume|reformule|lecture)\b/i.test(candidate)) {
    score += 2
  }

  if (nextStageId === 'solution' && /\b(attrio|centralis|suivi|pilotage|prestataire|préventif|curatif)\b/i.test(candidate)) {
    score += 2
  }

  if (nextStageId === 'objections' && /\b(simple|équipes|lourd|prise en main|adoption)\b/i.test(candidate)) {
    score += 2
  }

  if (nextStageId === 'closing' && /\b(démo|cas concret|atelier|créneau|appel|visio)\b/i.test(candidate)) {
    score += 2
  }

  return score
}

function selectAdaptiveBaseMessage({ nextStep, nextStageId, signals, intents }) {
  const candidates = getStepCandidates(nextStep)
  if (candidates.length <= 1) {
    return candidates[0] ?? ''
  }

  return [...candidates]
    .sort((left, right) => scoreCandidate(right, { nextStageId, signals, intents }) - scoreCandidate(left, { nextStageId, signals, intents }))
    [0]
}

function shouldKeepBaseOpening(baseMessage, nextStageId) {
  const base = normalizeMessage(baseMessage)
  if (!base) return false

  if ((nextStageId === 'transition' || nextStageId === 'solution') && /^(oui|exactement|d['’]accord|très bien)/i.test(base)) {
    return true
  }

  if (nextStageId === 'objections' && /^(honnêtement|ma peur|mon vrai sujet|mon vrai frein|ce qui m['’]inquiète)/i.test(base)) {
    return true
  }

  if (nextStageId === 'closing' && /^(si on continue|si on avance|si tu peux|pour avancer)/i.test(base)) {
    return true
  }

  return false
}

function buildProblemLead({ signals, intents, persona }) {
  if (hasIntent(intents, 'tools')) return 'Côté outils justement,'
  if (hasIntent(intents, 'actors')) return `C’est surtout dans les passages de relais chez ${persona.company} que`
  if (hasIntent(intents, 'volume')) return 'Le volume joue, mais le vrai sujet, c’est surtout que'
  if (hasIntent(intents, 'example')) return 'Oui, concrètement,'

  const signal = pickSignal(signals, ['channels', 'team', 'tools', 'volume', 'sites'])

  if (signal === 'channels') return 'Et justement, comme tout remonte par plusieurs canaux chez nous,'
  if (signal === 'team') return `C’est justement quand plusieurs acteurs interviennent chez ${persona.company} que ça se complique :`
  if (signal === 'tools') return "C’est aussi là que l’organisation actuelle montre ses limites :"
  if (signal === 'volume') return "Dès que le volume monte un peu, c’est là que ça décroche :"
  if (signal === 'sites') return 'À l’échelle du site, le vrai point de friction, c’est que'

  return 'Et derrière, le vrai sujet, c’est que'
}

function buildImpactLead({ signals, intents }) {
  if (hasIntent(intents, 'example')) return 'Oui, par exemple,'
  if (hasIntent(intents, 'frustration')) return 'Oui, et au quotidien, ce qui m’use le plus, c’est que'
  if (hasIntent(intents, 'quantify')) return 'Le plus visible, c’est le temps et la charge :'

  const signal = pickSignal(signals, ['loss', 'visibility', 'relances', 'preventive', 'duplicate'])

  if (signal === 'loss') return 'Oui, et quand une demande se perd, derrière'
  if (signal === 'visibility') return 'Oui, et sans vision commune, au final'
  if (signal === 'relances') return 'Oui, et à force de relances, derrière'
  if (signal === 'preventive') return 'Oui, et sur la maintenance aussi, au bout du compte'
  if (signal === 'duplicate') return 'Oui, et quand on duplique les infos, derrière'

  return 'Au bout du compte, derrière'
}

function buildNeedsLead({ signals, intents }) {
  if (hasIntent(intents, 'success')) return 'Pour moi, un bon fonctionnement, ce serait'
  if (hasIntent(intents, 'reassurance')) return "Ce qu’il me faut surtout, c’est quelque chose de"
  if (hasIntent(intents, 'quantify') || hasIntent(intents, 'frustration')) return 'Pour sortir de ça, il me faudrait'

  const signal = pickSignal(signals, ['time', 'delay', 'quality', 'risk', 'dependence'])

  if (signal === 'time') return 'Si je veux récupérer du temps de pilotage,'
  if (signal === 'delay') return 'Si je veux vraiment réduire ces délais,'
  if (signal === 'quality') return 'Si je veux améliorer le service rendu,'
  if (signal === 'risk') return 'Si je veux réduire ce risque opérationnel,'
  if (signal === 'dependence') return 'Si je veux moins dépendre des arbitrages au quotidien,'

  return 'Si on veut améliorer ça concrètement,'
}

function buildTransitionLead({ signals, intents }) {
  if (hasIntent(intents, 'summary')) return 'Oui, tu as bien cerné l’enjeu.'
  if (hasIntent(intents, 'validation')) return 'Oui, c’est bien ça.'
  if (hasIntent(intents, 'success')) return 'Oui, on parle bien de ça.'

  const signal = pickSignal(signals, ['simplicity', 'visibility', 'adoption', 'roles', 'preventive'])

  if (signal === 'simplicity') return 'Oui, si ça reste simple,'
  if (signal === 'visibility') return 'Oui, si ça me donne une vraie visibilité,'
  if (signal === 'adoption') return 'Oui, si les équipes s’en servent vraiment,'
  if (signal === 'roles') return 'Oui, si chacun sait enfin qui fait quoi,'
  if (signal === 'preventive') return 'Oui, si je peux aussi mieux tenir le préventif,'

  return 'Oui, clairement,'
}

function buildSolutionLead({ intents, signals }) {
  if (hasIntent(intents, 'summary')) return 'Oui, ta lecture tient la route.'
  if (hasIntent(intents, 'reassurance')) return 'Très bien, si tu me montres une approche simple et concrète,'
  if (hasIntent(intents, 'proof')) return 'Très bien, si tu restes factuel,'

  const signal = pickSignal(signals, ['summary', 'validation'])

  if (signal === 'summary') return 'Oui, ta lecture est bonne.'
  if (signal === 'validation') return 'Oui, on est alignés là-dessus.'

  return 'D’accord, vas-y.'
}

function buildObjectionLead({ intents, signals }) {
  if (hasIntent(intents, 'reassurance')) return 'Simple, d’accord, mais'
  if (hasIntent(intents, 'proof')) return 'Très bien, mais j’attends plus qu’une promesse :'

  const signal = pickSignal(signals, ['simplicity', 'adoption', 'existing_tool', 'roi', 'governance'])

  if (signal === 'simplicity') return 'Simple, d’accord, mais'
  if (signal === 'adoption') return 'L’adoption, c’est justement mon point de vigilance :'
  if (signal === 'existing_tool') return 'Très bien, mais mon sujet reste l’existant :'
  if (signal === 'roi') return 'Très bien, mais derrière'
  if (signal === 'governance') return 'Très bien, mais sur le pilotage concret'

  return 'Honnêtement, mon vrai sujet, c’est que'
}

function buildClosingLead({ intents, signals }) {
  if (hasIntent(intents, 'nextstep')) return 'D’accord, mais je veux une suite vraiment utile :'
  if (hasIntent(intents, 'proof')) return 'Très bien, mais avec un vrai cas concret,'

  const signal = pickSignal(signals, ['demo', 'pilot', 'timing'])

  if (signal === 'demo') return 'Là, ça devient concret.'
  if (signal === 'pilot') return 'Oui, si on part sur quelque chose de ciblé,'
  if (signal === 'timing') return 'Très bien, si on avance,'

  return 'Si on continue,'
}

function buildLeadForNextStage({ nextStageId, signals, intents, persona }) {
  if (!nextStageId) return ''

  if (nextStageId === 'problem') return buildProblemLead({ signals, intents, persona })
  if (nextStageId === 'impact') return buildImpactLead({ signals, intents, persona })
  if (nextStageId === 'needs') return buildNeedsLead({ signals, intents, persona })
  if (nextStageId === 'transition') return buildTransitionLead({ signals, intents, persona })
  if (nextStageId === 'solution') return buildSolutionLead({ signals, intents, persona })
  if (nextStageId === 'objections') return buildObjectionLead({ signals, intents, persona })
  if (nextStageId === 'closing') return buildClosingLead({ signals, intents, persona })

  return ''
}

export function buildAdaptiveProspectReply({
  scenario,
  nextStep,
  baseMessage,
  previousStageId,
  userMessage,
}) {
  const persona = getPersona(scenario?.personaId)
  if (!persona || !nextStep) return normalizeMessage(baseMessage)

  const signals = extractSignals(previousStageId, userMessage)
  const intents = extractIntents(userMessage)
  const adaptiveBaseMessage =
    selectAdaptiveBaseMessage({
      nextStep,
      nextStageId: nextStep.stageId,
      signals,
      intents,
    }) || baseMessage
  const lead = buildLeadForNextStage({
    nextStageId: nextStep.stageId,
    signals,
    intents,
    persona,
  })

  if (shouldKeepBaseOpening(adaptiveBaseMessage, nextStep.stageId)) {
    return normalizeMessage(adaptiveBaseMessage)
  }

  return composeReply(adaptiveBaseMessage, lead, nextStep.stageId)
}

export function extractConversationSignals({ stageId, userMessage }) {
  return extractSignals(stageId, userMessage)
}
