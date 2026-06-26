export const trainingPaths = [
  {
    id: 'initiation',
    title: 'Niveau 0 • Initiation',
    shortLabel: 'Initiation',
    difficultyLabel: 'Néophyte',
    interactionLabel: 'Capsules + QCM',
    guidanceLabel: 'Très guidé',
    prospectLabel: 'Découverte du terrain',
    commercialDifficultyLabel: 'Entrée en matière',
    summary:
      "Découvrir la vente structurée ATTRIO, comprendre le produit et s'échauffer avant la première vraie simulation.",
    objectives: [
      'Comprendre le terrain client',
      'Découvrir ATTRIO sans jargon',
      'S’entraîner sur des mini exercices',
    ],
    scenarioIds: [],
  },
  {
    id: 'foundations',
    title: 'Niveau 1 • Fondations',
    shortLabel: 'Fondations',
    difficultyLabel: 'Débutant',
    interactionLabel: 'Chat guidé + choix',
    guidanceLabel: 'Guidage fort',
    prospectLabel: 'Prospect ouvert',
    commercialDifficultyLabel: 'Douleur visible',
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
    interactionLabel: 'Chat structuré',
    guidanceLabel: 'Guidage moyen',
    prospectLabel: 'Prospect coopératif',
    commercialDifficultyLabel: 'Existant + adoption',
    summary:
      "Gérer les premiers vrais freins sans perdre le fil du process : outil déjà en place, adoption fragile, changement à cadrer.",
    objectives: [
      'Traiter la comparaison avec l’existant',
      "Rassurer sur l’adoption",
      'Vendre une approche progressive',
    ],
    scenarioIds: ['karim-existing-tool-adoption'],
  },
  {
    id: 'advanced',
    title: 'Niveau 3 • Avancé',
    shortLabel: 'Avancé',
    difficultyLabel: 'Résistance',
    interactionLabel: 'Chat avec réticence',
    guidanceLabel: 'Guidage léger',
    prospectLabel: 'Prospect prudent',
    commercialDifficultyLabel: 'Changement + continuité',
    summary:
      "Tenir un échange plus réaliste face à un prospect qui voit l’intérêt, mais craint l’impact terrain et la conduite du changement.",
    objectives: [
      'Rassurer sans minimiser le risque',
      'Parler méthode autant que solution',
      'Sécuriser la continuité d’exploitation',
    ],
    scenarioIds: ['sophie-change-management-preventive'],
  },
  {
    id: 'expert',
    title: 'Niveau 4 • Expert',
    shortLabel: 'Expert',
    difficultyLabel: 'Expert',
    interactionLabel: 'Chat expert',
    guidanceLabel: 'Guidage minimal',
    prospectLabel: 'Décideur exigeant',
    commercialDifficultyLabel: 'ROI + gouvernance',
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
