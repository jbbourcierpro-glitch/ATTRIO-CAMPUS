export const trainingPaths = [
  {
    id: 'foundations',
    title: 'Niveau 1 • Fondations',
    shortLabel: 'Fondations',
    difficultyLabel: 'Débutant',
    summary:
      "Apprendre à dérouler le process ATTRIO avec un prospect ouvert et une douleur visible, sans pitcher trop tôt.",
    objectives: [
      'Cadrer le contexte',
      'Faire émerger la douleur',
      "Relier ATTRIO à un besoin simple et concret",
    ],
    scenarioIds: ['marie-first-site-foundation', 'julien-provider-referral-foundation'],
  },
  {
    id: 'progression',
    title: 'Niveau 2 • Consolidation',
    shortLabel: 'Consolidation',
    difficultyLabel: 'Intermédiaire',
    summary:
      "Gérer les premiers vrais freins : outil déjà en place, adoption faible, changement à sécuriser.",
    objectives: [
      'Traiter la comparaison avec l’existant',
      "Rassurer sur l’adoption",
      'Vendre une approche progressive',
    ],
    scenarioIds: ['karim-existing-tool-adoption', 'sophie-change-management-preventive'],
  },
  {
    id: 'expert',
    title: 'Niveau 3 • Expertise',
    shortLabel: 'Expertise',
    difficultyLabel: 'Avancé',
    summary:
      'Affronter un décideur pointilleux qui challenge le ROI, la gouvernance, les droits et la crédibilité du déploiement.',
    objectives: [
      'Tenir un prospect exigeant',
      'Répondre sans se réfugier dans les features',
      'Conclure sur une next step crédible',
    ],
    scenarioIds: ['laurent-pointilleux-roi-governance'],
  },
]

export const trainingPathMap = Object.fromEntries(trainingPaths.map((path) => [path.id, path]))

export function getTrainingPath(pathId) {
  return trainingPathMap[pathId] ?? null
}

export function getOrderedScenarioIds() {
  return trainingPaths.flatMap((path) => path.scenarioIds)
}

export function getNextScenarioRecommendation(currentScenarioId, percentage) {
  const orderedScenarioIds = getOrderedScenarioIds()
  const currentIndex = orderedScenarioIds.indexOf(currentScenarioId)

  if (currentIndex === -1) {
    return null
  }

  if (percentage < 75) {
    return {
      type: 'replay',
      scenarioId: currentScenarioId,
      message:
        'Rejoue ce cas une fois pour verrouiller le process avant de monter en difficulté.',
    }
  }

  const nextScenarioId = orderedScenarioIds[currentIndex + 1] ?? null

  if (!nextScenarioId) {
    return {
      type: 'complete',
      scenarioId: currentScenarioId,
      message:
        "Tu as atteint le haut du parcours actuel. Tu peux rejouer les cas difficiles pour travailler la finesse d'exécution.",
    }
  }

  return {
    type: 'next',
    scenarioId: nextScenarioId,
    message:
      "Bon niveau. Passe au scénario suivant pour ajouter plus de résistance, d'objections et de complexité.",
  }
}
