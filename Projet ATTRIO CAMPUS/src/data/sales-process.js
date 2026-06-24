export const salesProcessStages = [
  {
    id: 'context',
    label: 'Contexte',
    shortLabel: 'Contexte',
    objective: 'Comprendre l’environnement, le rôle et la situation actuelle du prospect.',
    improvementHint: "Cadre d'abord le terrain de jeu avant d'essayer de résoudre quoi que ce soit.",
  },
  {
    id: 'problem',
    label: 'Problématique',
    shortLabel: 'Problème',
    objective: 'Faire émerger les douleurs, irritants et blocages réels.',
    improvementHint: 'Fais parler le prospect sur ce qui coince vraiment au quotidien.',
  },
  {
    id: 'impact',
    label: 'Impact',
    shortLabel: 'Impact',
    objective: "Quantifier les conséquences business, humaines ou opérationnelles du problème.",
    improvementHint: "Sans impact, il n'y a ni urgence ni valeur perçue.",
  },
  {
    id: 'needs',
    label: 'Objectif & Besoins',
    shortLabel: 'Besoins',
    objective: 'Clarifier les attentes, critères de succès et contraintes de décision.',
    improvementHint: "Cadre ce que le prospect veut obtenir avant d'aborder ATTRIO.",
  },
  {
    id: 'transition',
    label: 'Transition',
    shortLabel: 'Transition',
    objective: 'Reformuler et obtenir le droit de présenter une piste de solution.',
    improvementHint: 'La transition doit venir naturellement après une bonne découverte.',
  },
  {
    id: 'solution',
    label: 'Solution',
    shortLabel: 'Solution',
    objective: 'Présenter ATTRIO en lien direct avec les problèmes exprimés.',
    improvementHint: 'Pitche seulement ce qui répond au besoin qualifié, pas un catalogue de features.',
  },
  {
    id: 'objections',
    label: 'Objections',
    shortLabel: 'Objections',
    objective: 'Traiter les résistances sans casser la dynamique de confiance.',
    improvementHint: "Accueille l'objection, clarifie-la puis rassure avec précision.",
  },
  {
    id: 'closing',
    label: 'Next Step',
    shortLabel: 'Closing',
    objective: 'Obtenir un engagement concret et une suite claire.',
    improvementHint: "Une bonne vente se termine par une prochaine étape explicite.",
  },
]

export const salesProcessStageMap = Object.fromEntries(
  salesProcessStages.map((stage) => [stage.id, stage]),
)

export function getStageDefinition(stageId) {
  return salesProcessStageMap[stageId] ?? null
}
