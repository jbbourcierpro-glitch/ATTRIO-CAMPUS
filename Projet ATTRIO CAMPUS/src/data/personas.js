export const personas = [
  {
    id: 'marie-horizon',
    name: 'Marie',
    title: 'Responsable Technique',
    company: 'Résidence Horizon',
    avatarInitials: 'M',
    teamSize: '1 bâtiment • 4 techniciens',
    contextTag: 'Mail + téléphone + WhatsApp',
    currentSetup: 'Demandes dispersées, peu de traçabilité, préventif tenu sur des tableaux.',
    details:
      "Marie pilote l'exploitation technique d'un site tertiaire. Les demandes arrivent de partout et l'équipe réagit au fil de l'eau. Elle veut reprendre la main sans déployer un outil lourd.",
    painSummary: 'Demandes perdues, suivi artisanal, maintenance préventive fragile.',
    resistanceStyle: 'Pragmatique, terrain, ouverte si la solution reste simple.',
  },
  {
    id: 'karim-retailpark',
    name: 'Karim',
    title: "Gestionnaire d'Exploitation",
    company: 'RetailPark Est',
    avatarInitials: 'K',
    teamSize: '6 sites • 12 intervenants',
    contextTag: 'Excel + ancien outil peu adopté',
    currentSetup: 'Un outil existe déjà, mais les équipes repassent par mail et téléphone.',
    details:
      "Karim supervise plusieurs sites. Il a déjà essayé d'outiller ses équipes, mais l'adoption est faible et les canaux parallèles reviennent toujours. Il ne veut pas relancer un chantier inutile.",
    painSummary: "Outil existant mais contourné, double saisie, zéro vision consolidée.",
    resistanceStyle: 'Prudent, orienté adoption, allergique aux remplacements sans valeur claire.',
  },
  {
    id: 'julien-meridian',
    name: 'Julien',
    title: 'Responsable Technique',
    company: 'Parc Meridian',
    avatarInitials: 'J',
    teamSize: '2 bâtiments • 1 prestataire principal',
    contextTag: 'Recommandé par un prestataire utilisateur',
    currentSetup:
      "Le prestataire principal utilise déjà Attrio chez d'autres clients et lui en a parlé pour fluidifier les demandes et le suivi.",
    details:
      "Julien pilote deux sites avec une petite équipe et un prestataire maintenance très présent. Il a entendu parler d'Attrio par ce prestataire, ce qui crée un climat de confiance dès le départ.",
    painSummary: 'Suivi éclaté, dépendance aux relances, envie de structurer sans complexifier.',
    resistanceStyle: 'Ouvert, curieux, mais attend du concret rapidement.',
  },
  {
    id: 'sophie-aurora',
    name: 'Sophie',
    title: "Directrice de l'Exploitation",
    company: 'Aurora Services',
    avatarInitials: 'S',
    teamSize: '14 résidences • maintenance internalisée et prestataires',
    contextTag: 'Préventif sensible + coordination prestataires',
    currentSetup: 'Le préventif est suivi, mais trop manuellement, avec de fortes craintes sur la conduite du changement.',
    details:
      "Sophie doit garantir la continuité opérationnelle sur plusieurs sites avec des équipes internes et des prestataires. Elle voit la valeur d'un meilleur pilotage, mais redoute un projet qui perturbe le terrain.",
    painSummary: 'Peur du changement, risque de rupture opérationnelle, préventif critique.',
    resistanceStyle: 'Exigeante, très attentive au déploiement progressif et à la continuité.',
  },
  {
    id: 'laurent-patrimoine',
    name: 'Laurent',
    title: 'Directeur Technique Patrimoine',
    company: 'Patrimoine Alpha',
    avatarInitials: 'L',
    teamSize: '25 sites • gouvernance multi-acteurs',
    contextTag: 'GMAO existante + enjeux ROI',
    currentSetup: "Une GMAO est en place mais peu exploitée, complétée par Excel, mails et relances manuelles.",
    details:
      "Laurent pilote un parc multi-sites avec des responsables locaux, des prestataires et une direction qui demande des preuves. Il challenge les vendeurs sur le ROI, la gouvernance, les droits et la capacité réelle à faire adopter l'outil.",
    painSummary: 'Client pointilleux, outil déjà en place, exigence ROI et gouvernance forte.',
    resistanceStyle: 'Pointilleux, analytique, très difficile à convaincre sans méthode solide.',
  },
]

export const personaMap = Object.fromEntries(personas.map((persona) => [persona.id, persona]))

export function getPersona(personaId) {
  return personaMap[personaId] ?? null
}
