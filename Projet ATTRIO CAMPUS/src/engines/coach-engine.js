import { salesProcessStages, getStageDefinition } from '../data/sales-process.js'

export function getCoachWelcomeBrief() {
  return (
    "Je t'entraîne à suivre un vrai process de vente ATTRIO, du cas simple au client pointilleux : contexte, problème, impact, besoin, transition, solution, objections, closing. " +
    "Mon rôle n'est pas de juger si la conversation sonne bien, mais si tu respectes les étapes et si tu montes proprement en difficulté."
  )
}

export function getProcessMantra() {
  return "Ne saute aucune étape : une bonne vente n'est jamais un pitch improvisé."
}

export function getProcessStages() {
  return salesProcessStages
}

export function getCurrentStageCopy(stageId) {
  const stage = getStageDefinition(stageId)
  if (!stage) {
    return {
      label: 'Process',
      objective: "ATTY observe l'étape en cours.",
    }
  }

  return {
    label: stage.label,
    objective: stage.objective,
  }
}

export function getContextualHelp({ stageId, persona, step }) {
  const stage = getStageDefinition(stageId)
  const personaName = persona?.name ?? 'le prospect'
  const personaCompany = persona?.company ?? 'son organisation'
  const stepGoal = step?.goal ?? stage?.objective ?? ''

  const helpByStage = {
    context: {
      focus: `Comprendre comment ${personaName} fonctionne aujourd'hui chez ${personaCompany}.`,
      checklist: [
        'Qui reçoit les demandes ou pilote le sujet actuellement ?',
        'Quels outils, canaux ou tableaux sont utilisés aujourd’hui ?',
        'Combien de sites, d’intervenants ou d’utilisateurs sont concernés ?',
      ],
      example: `Exemple : "Aujourd'hui, comment vous centralisez et suivez ce sujet au quotidien ?"`,
      warning: "N’essaie pas encore de parler d’ATTRIO. Ton seul job ici, c’est de cadrer le terrain.",
    },
    problem: {
      focus: `Faire préciser où ça casse concrètement pour ${personaName}.`,
      checklist: [
        'À quel moment le process se casse-t-il ?',
        'Qui contourne le plus souvent la méthode ?',
        'Qu’est-ce qui se perd, se duplique ou se relance à la main ?',
      ],
      example: `Exemple : "À quel moment ça se complique le plus aujourd’hui : création, suivi, relance ou coordination ?"`,
      warning: 'Évite les réactions trop vagues du type "je vois". Fais préciser une friction réelle.',
    },
    impact: {
      focus: 'Transformer la douleur en coût, en risque ou en urgence.',
      checklist: [
        'Quel temps est perdu chaque semaine ?',
        'Quelles conséquences ça a sur le service, le pilotage ou la conformité ?',
        'Que se passe-t-il si rien ne change dans les prochains mois ?',
      ],
      example: `Exemple : "Quand ça arrive, l’impact le plus fort pour vous, c’est du temps perdu, du retard ou un manque de visibilité ?"`,
      warning: 'Ne passe pas à la solution tant que l’impact n’est pas ressenti.',
    },
    needs: {
      focus: 'Clarifier ce que le prospect veut vraiment obtenir.',
      checklist: [
        'À quoi ressemble un bon résultat à ses yeux ?',
        'Quelles sont ses priorités absolues ?',
        'Quelles contraintes ou conditions doivent être respectées ?',
      ],
      example: `Exemple : "Si on corrige ça, qu’est-ce qui doit changer concrètement pour que vous considériez le projet comme réussi ?"`,
      warning: 'Ne conclus pas trop vite. Fais-le définir ses critères de succès.',
    },
    transition: {
      focus: 'Reformuler proprement avant de proposer quoi que ce soit.',
      checklist: [
        'Résume le contexte et le problème',
        'Rappelle l’impact et le besoin',
        'Demande l’autorisation d’avancer',
      ],
      example: `Exemple : "Si je résume, votre enjeu principal est X, avec comme impact Y, et vous cherchez Z. Est-ce que j’ai bien compris ? Si oui, je peux vous partager une piste ?"`,
      warning: 'La transition doit valider ta compréhension, pas lancer un pitch brutal.',
    },
    solution: {
      focus: 'Présenter ATTRIO uniquement en réponse au besoin qualifié.',
      checklist: [
        'Pars du problème exprimé, pas du produit',
        'Relie 2 ou 3 briques ATTRIO maximum au besoin',
        'Reste concret : usage, pilotage, simplicité, adoption',
      ],
      example: `Exemple : "Dans votre cas, ATTRIO peut surtout vous aider à centraliser X, piloter Y et sécuriser Z sans rajouter de couche inutile."`,
      warning: 'Évite le catalogue de fonctionnalités. Garde un pitch court et ciblé.',
    },
    objections: {
      focus: 'Accueillir la réserve avant d’essayer de rassurer.',
      checklist: [
        'Valide l’inquiétude du prospect',
        'Reformule le risque perçu',
        'Réponds avec une méthode crédible et concrète',
      ],
      example: `Exemple : "Je comprends votre réserve. Ce qui vous inquiète le plus, c’est surtout l’adoption, le changement ou la charge projet ?"`,
      warning: 'Ne contredis pas trop vite. Une objection mal accueillie casse la confiance.',
    },
    closing: {
      focus: 'Obtenir une prochaine étape simple, datée et crédible.',
      checklist: [
        'Propose un format court',
        'Donne un objectif clair à ce rendez-vous',
        'Ancre la suite dans un créneau ou une action précise',
      ],
      example: `Exemple : "Si c’est pertinent pour vous, on peut caler 20 minutes cette semaine pour vous montrer ce cas d’usage précis."`,
      warning: 'Ne termine pas par "je vous envoie un mail". Ferme sur une action concrète.',
    },
  }

  const defaultHelp = {
    focus: stepGoal || "Avance par étape et reste sur l'objectif de la phase en cours.",
    checklist: ['Pose une question précise', 'Reste concret', 'N’anticipe pas la suite trop vite'],
    example: 'Exemple : pars d’une question ouverte très simple et liée au quotidien du prospect.',
    warning: 'Quand tu bloques, reviens à l’objectif de l’étape.',
  }

  const help = helpByStage[stageId] ?? defaultHelp

  return {
    title: `Aide ATTY • ${stage?.label ?? 'Étape en cours'}`,
    focus: help.focus,
    checklist: help.checklist,
    example: help.example,
    warning: help.warning,
  }
}
