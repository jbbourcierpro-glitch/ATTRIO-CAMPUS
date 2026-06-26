import { getPersona } from '../data/personas.js'

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function lowerFirstLetter(message) {
  if (!message) return message
  return message.charAt(0).toLowerCase() + message.slice(1)
}

function normalizeMessage(message) {
  return String(message ?? '').replace(/\s+/g, ' ').trim()
}

function prependLead(baseMessage, lead) {
  const base = normalizeMessage(baseMessage)
  if (!lead || !base) return base
  return normalizeMessage(`${lead} ${lowerFirstLetter(base)}`)
}

const signalMap = {
  context: [
    { id: 'channels', pattern: /\b(mail|mails|telephone|téléphone|appel|appels|whatsapp|canaux|demandes|flux)\b/i },
    { id: 'team', pattern: /\b(equipe|équipe|technicien|techniciens|qui|intervenants|prestataire|occupants|accueil)\b/i },
    { id: 'volume', pattern: /\b(combien|volume|rythme|par jour|par semaine|charge)\b/i },
    { id: 'sites', pattern: /\b(site|sites|batiment|bâtiment|residence|résidence|immeuble)\b/i },
    { id: 'tools', pattern: /\b(outil|excel|tableau|gmao|logiciel|whatsapp|mail)\b/i },
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

function extractSignals(stageId, userMessage) {
  const definitions = signalMap[stageId] ?? []
  return definitions.filter((definition) => definition.pattern.test(userMessage)).map((definition) => definition.id)
}

function pickSignal(signals, priority) {
  return priority.find((signal) => signals.includes(signal)) ?? signals[0] ?? null
}

function buildProblemLead({ signals, persona }) {
  const signal = pickSignal(signals, ['channels', 'team', 'tools', 'volume', 'sites'])

  if (signal === 'channels') return 'Et justement, comme tout remonte par plusieurs canaux chez nous,'
  if (signal === 'team') return `C’est justement quand plusieurs acteurs interviennent chez ${persona.company} que ça se complique :`
  if (signal === 'tools') return "C’est aussi là que l’organisation actuelle montre ses limites :"
  if (signal === 'volume') return "Dès que le volume monte un peu, c’est là que ça décroche :"
  if (signal === 'sites') return "À l’échelle du site, le vrai point de friction, c’est que"

  return 'Et derrière, le vrai sujet, c’est que'
}

function buildImpactLead({ signals }) {
  const signal = pickSignal(signals, ['loss', 'visibility', 'relances', 'preventive', 'duplicate'])

  if (signal === 'loss') return 'Oui, et quand une demande se perd, derrière'
  if (signal === 'visibility') return 'Oui, et sans vision commune, au final'
  if (signal === 'relances') return 'Oui, et à force de relances, derrière'
  if (signal === 'preventive') return 'Oui, et sur la maintenance aussi, au bout du compte'
  if (signal === 'duplicate') return 'Oui, et quand on duplique les infos, derrière'

  return 'Au bout du compte, derrière'
}

function buildNeedsLead({ signals }) {
  const signal = pickSignal(signals, ['time', 'delay', 'quality', 'risk', 'dependence'])

  if (signal === 'time') return 'Si je veux récupérer du temps de pilotage,'
  if (signal === 'delay') return 'Si je veux vraiment réduire ces délais,'
  if (signal === 'quality') return 'Si je veux améliorer le service rendu,'
  if (signal === 'risk') return 'Si je veux réduire ce risque opérationnel,'
  if (signal === 'dependence') return 'Si je veux moins dépendre des arbitrages au quotidien,'

  return 'Si on veut améliorer ça concrètement,'
}

function buildTransitionLead({ signals }) {
  const signal = pickSignal(signals, ['simplicity', 'visibility', 'adoption', 'roles', 'preventive'])

  if (signal === 'simplicity') return 'Oui, si ça reste simple,'
  if (signal === 'visibility') return 'Oui, si ça me donne une vraie visibilité,'
  if (signal === 'adoption') return 'Oui, si les équipes s’en servent vraiment,'
  if (signal === 'roles') return 'Oui, si chacun sait enfin qui fait quoi,'
  if (signal === 'preventive') return 'Oui, si je peux aussi mieux tenir le préventif,'

  return 'Oui, clairement,'
}

function buildSolutionLead({ signals }) {
  const signal = pickSignal(signals, ['summary', 'validation'])

  if (signal === 'summary') return 'Oui, ta lecture est bonne.'
  if (signal === 'validation') return 'Oui, on est alignés là-dessus.'

  return 'D’accord, vas-y.'
}

function buildObjectionLead({ signals }) {
  const signal = pickSignal(signals, ['simplicity', 'adoption', 'existing_tool', 'roi', 'governance'])

  if (signal === 'simplicity') return 'Justement, c’est là où je vais être vigilante :'
  if (signal === 'adoption') return 'Justement, mon vrai test, ce sera l’adoption terrain :'
  if (signal === 'existing_tool') return 'Mon sujet, c’est aussi l’existant :'
  if (signal === 'roi') return 'Très bien, mais derrière'
  if (signal === 'governance') return 'Très bien, mais sur la gouvernance'

  return 'Honnêtement, mon vrai sujet, c’est que'
}

function buildClosingLead({ signals }) {
  const signal = pickSignal(signals, ['demo', 'pilot', 'timing'])

  if (signal === 'demo') return 'Là, ça devient concret.'
  if (signal === 'pilot') return 'Oui, si on part sur quelque chose de simple,'
  if (signal === 'timing') return 'Très bien, si on avance,'

  return 'Si on continue,'
}

function buildLeadForNextStage({ nextStageId, signals, persona }) {
  if (!nextStageId) return ''

  if (nextStageId === 'problem') return buildProblemLead({ signals, persona })
  if (nextStageId === 'impact') return buildImpactLead({ signals, persona })
  if (nextStageId === 'needs') return buildNeedsLead({ signals, persona })
  if (nextStageId === 'transition') return buildTransitionLead({ signals, persona })
  if (nextStageId === 'solution') return buildSolutionLead({ signals, persona })
  if (nextStageId === 'objections') return buildObjectionLead({ signals, persona })
  if (nextStageId === 'closing') return buildClosingLead({ signals, persona })

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
  const lead = buildLeadForNextStage({
    nextStageId: nextStep.stageId,
    signals,
    persona,
  })

  return prependLead(baseMessage, lead)
}

export function extractConversationSignals({ stageId, userMessage }) {
  return extractSignals(stageId, userMessage)
}
