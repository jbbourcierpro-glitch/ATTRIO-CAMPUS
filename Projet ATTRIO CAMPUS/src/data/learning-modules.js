export const learningModules = [
  {
    id: 'initiation-terrain',
    pathId: 'initiation',
    type: 'capsule',
    badge: 'Découverte',
    duration: '3 min',
    title: 'Comprendre le terrain ATTRIO',
    shortDescription: 'Qui on aide, dans quel contexte, et pourquoi le sujet remonte si vite.',
    objective: 'Comprendre les situations terrain qui rendent ATTRIO pertinent.',
    sections: [
      {
        title: 'Ce que vivent souvent les prospects',
        bullets: [
          'Les demandes arrivent par plusieurs canaux : mail, téléphone, WhatsApp, accueil.',
          'Le suivi se disperse entre occupants, techniciens, prestataires et gestionnaires.',
          'Le préventif tient encore trop souvent sur des tableaux ou des routines fragiles.',
        ],
      },
      {
        title: 'Ce que le commercial doit capter',
        bullets: [
          'Comment les demandes arrivent aujourd’hui.',
          'Qui reçoit, qui agit, qui relance et qui arbitre.',
          'Où l’information se perd et ce que cela provoque au quotidien.',
        ],
      },
    ],
    takeaway:
      "Avant de vendre ATTRIO, il faut d'abord comprendre comment le terrain fonctionne réellement aujourd'hui.",
  },
  {
    id: 'initiation-process',
    pathId: 'initiation',
    type: 'capsule',
    badge: 'Méthode',
    duration: '4 min',
    title: 'Les 8 étapes du process ATTRIO',
    shortDescription: 'La vente ne se résume pas à parler d’outil : elle suit une séquence.',
    objective: 'Mémoriser le déroulé commercial avant d’entrer en simulation.',
    sections: [
      {
        title: 'Le déroulé',
        bullets: [
          'Contexte : comprendre le terrain.',
          'Problème : faire émerger ce qui coince.',
          'Impact : montrer ce que cela coûte.',
          'Besoins : clarifier ce que le prospect veut obtenir.',
          'Transition : reformuler puis obtenir le droit d’avancer.',
          'Solution : relier ATTRIO au besoin exprimé.',
          'Objections : traiter les freins sans casser la confiance.',
          'Next step : conclure sur une suite claire.',
        ],
      },
      {
        title: 'La règle d’or',
        bullets: [
          'Ne pas pitcher trop tôt.',
          'Ne pas confondre conversation fluide et vraie découverte.',
          'Toujours faire progresser la vente étape par étape.',
        ],
      },
    ],
    takeaway:
      'Une bonne conversation commerciale ne saute pas les étapes, même si le prospect semble déjà intéressé.',
  },
  {
    id: 'initiation-attrio-basics',
    pathId: 'initiation',
    type: 'capsule',
    badge: 'Produit',
    duration: '4 min',
    title: 'ATTRIO en clair',
    shortDescription: 'Présenter ATTRIO simplement, sans partir en catalogue de fonctionnalités.',
    objective: 'Savoir expliquer ATTRIO avec des mots orientés client.',
    sections: [
      {
        title: 'Ce qu’ATTRIO apporte',
        bullets: [
          'Un endroit partagé pour centraliser les demandes.',
          'Une meilleure coordination entre occupants, équipes techniques et prestataires.',
          'Plus de visibilité sur le curatif, le préventif et le suivi.',
        ],
      },
      {
        title: 'Ce qu’il faut éviter',
        bullets: [
          'Faire une liste de features trop tôt.',
          'Vendre ATTRIO comme “un outil de plus”.',
          'Promettre un déploiement magique sans parler d’usage et d’adoption.',
        ],
      },
    ],
    takeaway:
      'ATTRIO se vend mieux comme une réponse à un problème de coordination et de pilotage que comme une simple plateforme.',
  },
  {
    id: 'drill-context-question',
    pathId: 'initiation',
    type: 'drill',
    badge: 'Exercice',
    duration: '2 min',
    title: 'Choisir la bonne question de contexte',
    shortDescription: 'Repère la meilleure entrée de découverte.',
    objective: 'Commencer un échange sans pitcher trop tôt.',
    question:
      'En début de rendez-vous, quelle question ouvre le mieux la phase de contexte ?',
    options: [
      {
        id: 'a',
        label: 'Je vais vous montrer rapidement tout ce que fait ATTRIO.',
        feedback: "Trop tôt : tu pars directement sur la solution sans comprendre le terrain.",
      },
      {
        id: 'b',
        label: 'Comment s’organise aujourd’hui le traitement des demandes sur vos sites ?',
        feedback: 'Oui : tu pars du fonctionnement actuel avant de parler produit.',
      },
      {
        id: 'c',
        label: 'Vous avez déjà pensé à changer d’outil ?',
        feedback: "C'est trop orienté solution et changement dès la première minute.",
      },
    ],
    correctOptionId: 'b',
  },
  {
    id: 'drill-value-link',
    pathId: 'initiation',
    type: 'drill',
    badge: 'Exercice',
    duration: '2 min',
    title: 'Relier douleur et valeur ATTRIO',
    shortDescription: 'Trouve la réponse la plus juste à une douleur client.',
    objective: 'Faire le lien entre un problème concret et la valeur ATTRIO.',
    question:
      'Le prospect dit : “on perd le fil entre occupants, accueil et techniciens”. Quelle réponse est la plus juste ?',
    options: [
      {
        id: 'a',
        label: 'ATTRIO a beaucoup de modules très complets pour tout piloter.',
        feedback: 'Trop générique : tu parles produit sans répondre au problème exprimé.',
      },
      {
        id: 'b',
        label: 'Le sujet semble être le manque de suivi partagé. ATTRIO peut aider à centraliser les demandes et clarifier qui fait quoi.',
        feedback: 'Oui : tu pars de la douleur et tu relies la solution à un besoin précis.',
      },
      {
        id: 'c',
        label: 'Si vos équipes suivaient mieux les process, le problème disparaîtrait.',
        feedback: 'Réponse risquée : elle renvoie la faute au client au lieu de l’aider.',
      },
    ],
    correctOptionId: 'b',
  },
]

export const learningModuleMap = Object.fromEntries(learningModules.map((module) => [module.id, module]))

export function getLearningModuleById(moduleId) {
  return learningModuleMap[moduleId] ?? null
}

export function getLearningModulesForPath(pathId) {
  return learningModules.filter((module) => module.pathId === pathId)
}

export function getNextLearningModuleId(currentModuleId) {
  const currentIndex = learningModules.findIndex((module) => module.id === currentModuleId)
  if (currentIndex === -1) return null
  return learningModules[currentIndex + 1]?.id ?? null
}
