const prematurePitchPattern =
  /(attrio|notre solution|notre plateforme|notre outil|notre produit|d[ée]mo|module curatif|module pr[ée]ventif|dashboard|calendrier|atty)/i

const transitionPattern =
  /(si je comprends bien|si je r[ée]sume|si je reformule|donc aujourd'hui|on est d'accord|est-ce que j'ai bien compris)/i

function buildContextRules(goodPattern, fallbackFeedback) {
  return [
    {
      name: 'premature_pitch',
      pattern: prematurePitchPattern,
      score: 2,
      type: 'error',
      feedback:
        "Tu pitches trop tôt. Commence par comprendre le terrain du prospect avant de parler d'ATTRIO.",
    },
    {
      name: 'good_context',
      pattern: goodPattern,
      score: 10,
      type: 'success',
      feedback:
        "Bon réflexe : tu cadres le contexte opérationnel avant de chercher à vendre. C'est la bonne entrée.",
    },
    {
      name: 'no_question',
      pattern: /^[^?]*$/,
      score: 3,
      type: 'error',
      feedback:
        "Tu n'as pas posé de question. En phase de contexte, le prospect doit parler de son organisation.",
    },
    {
      name: 'fallback',
      pattern: /.*/i,
      score: 5,
      type: 'warning',
      feedback: fallbackFeedback,
    },
  ]
}

function buildProblemRules(goodPattern, fallbackFeedback) {
  return [
    {
      name: 'premature_pitch',
      pattern: prematurePitchPattern,
      score: 2,
      type: 'error',
      feedback:
        "Tu reviens trop vite sur la solution. Fais d'abord verbaliser la douleur concrète.",
    },
    {
      name: 'good_problem',
      pattern: goodPattern,
      score: 10,
      type: 'success',
      feedback:
        "Tu es bien dans la découverte du problème. Tu aides le prospect à préciser ce qui coince vraiment.",
    },
    {
      name: 'too_generic',
      pattern: /(je vois|ok|d'accord|int[ée]ressant|je comprends)/i,
      score: 4,
      type: 'warning',
      feedback:
        'Tu restes trop générique. Creuse une friction précise plutôt que de simplement acquiescer.',
    },
    {
      name: 'fallback',
      pattern: /.*/i,
      score: 5,
      type: 'warning',
      feedback: fallbackFeedback,
    },
  ]
}

function buildImpactRules(goodPattern, fallbackFeedback) {
  return [
    {
      name: 'premature_pitch',
      pattern: prematurePitchPattern,
      score: 2,
      type: 'error',
      feedback:
        "Tu sautes l'étape d'impact. Sans urgence ressentie, ton pitch ATTRIO perdra en force.",
    },
    {
      name: 'good_impact',
      pattern: goodPattern,
      score: 10,
      type: 'success',
      feedback:
        "Excellent : tu transformes la douleur en enjeu business et opérationnel. C'est là que la vente prend du poids.",
    },
    {
      name: 'soft_reaction',
      pattern: /(je comprends|pas simple|c'est emb[êe]tant|oui je vois)/i,
      score: 5,
      type: 'warning',
      feedback:
        "Tu valides l'émotion, mais pas encore l'impact. Fais ressortir le coût, le risque ou l'urgence.",
    },
    {
      name: 'fallback',
      pattern: /.*/i,
      score: 5,
      type: 'warning',
      feedback: fallbackFeedback,
    },
  ]
}

function buildNeedsRules(goodPattern, fallbackFeedback) {
  return [
    {
      name: 'premature_pitch',
      pattern: prematurePitchPattern,
      score: 3,
      type: 'error',
      feedback:
        "Tu as presque le droit de pitcher, mais pas encore. Clarifie d'abord ce que le prospect veut vraiment obtenir.",
    },
    {
      name: 'good_needs',
      pattern: goodPattern,
      score: 10,
      type: 'success',
      feedback:
        'Très bien : tu cadres les attentes, les critères de succès et les contraintes avant de proposer quoi que ce soit.',
    },
    {
      name: 'too_fast',
      pattern: /(parfait|super|on a ce qu'il faut|tr[èe]s bien)/i,
      score: 4,
      type: 'warning',
      feedback:
        "Tu conclus trop vite. Fais-le préciser ce qu'il considère comme une vraie réussite.",
    },
    {
      name: 'fallback',
      pattern: /.*/i,
      score: 5,
      type: 'warning',
      feedback: fallbackFeedback,
    },
  ]
}

function buildTransitionRules(fallbackFeedback) {
  return [
    {
      name: 'good_transition',
      pattern: transitionPattern,
      score: 10,
      type: 'success',
      feedback:
        "Parfait. Tu fais une vraie transition commerciale : reformulation, validation, puis permission d'avancer.",
    },
    {
      name: 'jump_to_pitch',
      pattern: /(attrio|notre solution|voici comment|on fait exactement|je vais vous montrer)/i,
      score: 4,
      type: 'warning',
      feedback:
        "Tu avances trop vite. Reformule d'abord et obtiens l'accord du prospect avant de pitcher.",
    },
    {
      name: 'missing_validation',
      pattern: /^[^?]*$/,
      score: 4,
      type: 'warning',
      feedback:
        'Ta transition manque de validation. Termine avec une question pour obtenir son accord.',
    },
    {
      name: 'fallback',
      pattern: /.*/i,
      score: 5,
      type: 'warning',
      feedback: fallbackFeedback,
    },
  ]
}

function buildSolutionRules(goodPattern, fallbackFeedback) {
  return [
    {
      name: 'good_solution',
      pattern: goodPattern,
      score: 10,
      type: 'success',
      feedback:
        "Très bon pitch : tu relies ATTRIO au besoin qualifié au lieu de dérouler un discours produit générique.",
    },
    {
      name: 'feature_dump',
      pattern: /(ia|plein de modules|tout-en-un|fonctionnalit[ée]s?|leader|innovation|meilleur)/i,
      score: 4,
      type: 'error',
      feedback:
        'Tu tombes dans le catalogue de features. Reviens à ce qui répond à sa situation précise.',
    },
    {
      name: 'too_vague',
      pattern: /(c'est un outil|c'est une plateforme|c'est une solution|on centralise)/i,
      score: 5,
      type: 'warning',
      feedback:
        "Ta présentation reste trop vague. Explique en quoi ATTRIO répond à son contexte spécifique.",
    },
    {
      name: 'fallback',
      pattern: /.*/i,
      score: 6,
      type: 'warning',
      feedback: fallbackFeedback,
    },
  ]
}

function buildObjectionRules(goodPattern, badPattern, fallbackFeedback) {
  return [
    {
      name: 'good_objection_handling',
      pattern: goodPattern,
      score: 10,
      type: 'success',
      feedback:
        "Très bon traitement d'objection : tu reconnais le risque perçu puis tu rassures avec une réponse crédible.",
    },
    {
      name: 'defensive_answer',
      pattern: badPattern,
      score: 3,
      type: 'error',
      feedback:
        "Tu balayes l'objection trop vite. Accueille-la d'abord avant de proposer une réponse concrète.",
    },
    {
      name: 'fallback',
      pattern: /.*/i,
      score: 5,
      type: 'warning',
      feedback: fallbackFeedback,
    },
  ]
}

function buildClosingRules(fallbackFeedback) {
  return [
    {
      name: 'good_closing',
      pattern:
        /(appel|visio|d[ée]mo|rendez-vous|cr[ée]neau|agenda|15 minutes|20 minutes|site pilote|atelier|audit|semaine prochaine|demain|dispo)/i,
      score: 10,
      type: 'success',
      feedback:
        "Excellent closing : tu transformes l'intérêt en prochaine étape concrète et crédible.",
    },
    {
      name: 'soft_close',
      pattern: /(je vous envoie un mail|tenez-moi au courant|je vous laisse regarder|quand vous voulez)/i,
      score: 4,
      type: 'warning',
      feedback:
        'Tu relâches trop la pression commerciale. Propose une prochaine étape courte, claire et datée.',
    },
    {
      name: 'fallback',
      pattern: /.*/i,
      score: 5,
      type: 'warning',
      feedback: fallbackFeedback,
    },
  ]
}

export const trainingScenarios = [
  {
    id: 'marie-first-site-foundation',
    trainingPathId: 'foundations',
    title: 'Marie • Premier site à structurer',
    shortDescription:
      'Premier cas ATTRIO pour apprendre à vendre une meilleure gestion curative et préventive sans sur-vendre.',
    difficulty: 'Débutant',
    difficultyClass: 'easy',
    personaId: 'marie-horizon',
    trainingGoal:
      "Dérouler correctement le process ATTRIO face à un prospect ouvert : comprendre l'organisation actuelle, révéler les pertes de suivi puis proposer ATTRIO comme interface simple et centralisée.",
    difficultyDrivers: ['Douleur visible', 'Prospect assez ouvert', 'Peu d’objections frontales'],
    coachFocus:
      'Apprends à bien qualifier avant de présenter ATTRIO. Le danger ici, c’est de pitcher trop tôt parce que le besoin semble évident.',
    steps: [
      {
        stageId: 'context',
        goal: "Comprendre comment le site est piloté aujourd'hui.",
        prospectMessage:
          "Je gère la technique d'un bâtiment tertiaire et, franchement, les demandes me tombent dessus par mail, téléphone et WhatsApp. Avant de me parler d'outil, tu veux comprendre quoi ?",
        prospectMessageVariants: [
          "Je pilote la technique d’un immeuble tertiaire et les demandes arrivent par tous les canaux possibles : mails, appels, WhatsApp. Avant de parler solution, qu’est-ce que tu veux comprendre ?",
          "Chez nous, ça remonte de partout : téléphone, accueil, mails, messages. Avant d’aller plus loin, tu veux partir de quel angle ?",
        ],
        coachDirective:
          "Cadre son contexte : volume, équipe, organisation, types de demandes et fonctionnement actuel.",
        rules: buildContextRules(
          /(comment|aujourd'hui|actuellement|organis[ée]|combien|demandes|[ée]quipe|techniciens|b[âa]timent|site|intervenants)/i,
          "Pose une question sur son organisation actuelle : qui reçoit les demandes, comment elles arrivent et qui agit derrière.",
        ),
      },
      {
        stageId: 'problem',
        goal: 'Faire émerger les irritants concrets du quotidien.',
        prospectMessage:
          "Le vrai sujet, c'est qu'on oublie parfois des demandes ou qu'on perd le fil. Entre l'accueil, les occupants et les techniciens, personne n'a la même vision.",
        prospectMessageVariants: [
          "Ce qui nous pénalise surtout, c’est qu’on oublie certaines demandes et que chacun a sa propre version du suivi.",
          "Le point de friction, c’est qu’entre l’accueil, les occupants et les techniciens, le suivi se disperse très vite.",
        ],
        coachDirective:
          "Creuse ce qui se perd, ce qui se duplique et là où le manque de traçabilité fait mal.",
        rules: buildProblemRules(
          /(o[uù]|quand|qu'est-ce qui|oubli|perd|fil|tra[cç]abilit[ée]|vision|suivi|relance|double)/i,
          "Recentre-toi sur la douleur concrète : qu'est-ce qui se perd, qui relance, et à quel moment le suivi casse ?",
        ),
      },
      {
        stageId: 'impact',
        goal: 'Faire ressortir le coût du chaos opérationnel.',
        prospectMessage:
          "Résultat : les occupants nous relancent, les techniciens repartent sans historique et moi je passe du temps à arbitrer au lieu de piloter.",
        prospectMessageVariants: [
          "Au bout du compte, les occupants nous relancent, les techniciens n’ont pas l’historique et je passe mon temps à recoller les morceaux.",
          "Concrètement, je me retrouve à arbitrer au jour le jour au lieu de piloter, avec des relances et très peu de visibilité.",
        ],
        coachDirective:
          "Quantifie l'impact : temps perdu, image interne, retards, qualité de service et charge mentale.",
        rules: buildImpactRules(
          /(impact|combien|temps|retard|co[uû]t|qualit[ée] de service|relancent|image|risque|si rien ne change)/i,
          "Fais parler Marie sur le coût réel : temps perdu, retards, pression des occupants et manque de visibilité.",
        ),
      },
      {
        stageId: 'needs',
        goal: 'Clarifier la cible à atteindre.',
        prospectMessage:
          "Si je pouvais centraliser les demandes, savoir qui fait quoi et arrêter d'oublier le préventif, ce serait déjà énorme. Tu veux cadrer quoi exactement avant d'aller plus loin ?",
        prospectMessageVariants: [
          "Si j’avais un endroit unique pour centraliser les demandes, suivre les actions et ne plus laisser filer le préventif, ce serait déjà un gros cap.",
          "Pour moi, le vrai gain serait simple : centraliser, savoir qui agit et ne plus subir les oublis sur le préventif. Qu’est-ce que tu veux cadrer maintenant ?",
        ],
        coachDirective:
          "Clarifie ce qu'elle attend concrètement : simplicité, visibilité, adoption, suivi curatif/préventif.",
        rules: buildNeedsRules(
          /(objectif|attendez|souhaitez|simple|visibilit[ée]|adoption|pr[ée]ventif|curatif|priorit[ée]|r[ée]ussite)/i,
          "Reste sur le besoin : qu'est-ce qu'un bon résultat voudrait dire pour elle au quotidien ?",
        ),
      },
      {
        stageId: 'transition',
        goal: 'Reformuler puis obtenir le droit de présenter ATTRIO.',
        prospectMessage:
          "Oui, si j'ai quelque chose de simple pour centraliser et suivre, je suis preneuse. Tu me résumes ta lecture ?",
        prospectMessageVariants: [
          "Oui, si c’est simple et que ça me donne enfin une vraie vue d’ensemble, ça m’intéresse. Résume-moi comment tu vois la situation.",
          "Exactement. Si on parle d’un outil simple pour centraliser et suivre, je t’écoute. Vas-y, reformule.",
        ],
        coachDirective:
          "Reformule contexte, problème, impact et besoin. Puis demande si tu peux montrer une approche.",
        rules: buildTransitionRules(
          "Ta transition est encore fragile. Reformule la situation de Marie puis demande-lui si tu peux lui partager une piste.",
        ),
      },
      {
        stageId: 'solution',
        goal: 'Présenter ATTRIO comme réponse simple au besoin.',
        prospectMessage:
          "Vas-y. Si tu penses qu'ATTRIO peut m'aider sans me rajouter une usine à gaz, je t'écoute.",
        prospectMessageVariants: [
          "D’accord. Si Attrio peut m’aider sans alourdir le quotidien de l’équipe, je veux bien écouter.",
          "Je t’écoute, à condition que ce ne soit pas encore une couche de complexité en plus.",
        ],
        coachDirective:
          "Présente ATTRIO de façon ciblée : une interface unique, des rôles clairs, du curatif et du préventif pilotés au même endroit.",
        rules: buildSolutionRules(
          /(attrio).*(centralis|interface unique|demandes|ticket|gestionnaire|intervenant|pr[ée]ventif|curatif|suivi|visibilit[ée])/i,
          "Ton pitch peut être plus précis : relie ATTRIO à la centralisation des demandes, au suivi des interventions et au préventif.",
        ),
      },
      {
        stageId: 'objections',
        goal: 'Rassurer sur la simplicité et l’adoption terrain.',
        prospectMessage:
          "Ma peur, c'est de me retrouver avec un outil de plus que personne n'utilise vraiment. Mes techniciens n'ont pas le temps pour quelque chose de lourd.",
        prospectMessageVariants: [
          "Mon vrai frein, c’est d’ajouter un outil de plus que les techniciens contourneront au bout de deux semaines.",
          "Ce qui m’inquiète, c’est la prise en main terrain. Si c’est lourd, mes équipes n’iront pas dedans.",
        ],
        coachDirective:
          "Accueille l'objection puis rassure sur la simplicité, les rôles clairs et l'adoption progressive.",
        rules: buildObjectionRules(
          /(je comprends|c'est l[ée]gitime|simple|prise en main|terrain|progressif|adoption|pas une usine [àa] gaz|r[ôo]les)/i,
          /(pas du tout|aucun souci|faites-moi confiance|ce n'est pas un probl[èe]me)/i,
          "Traite le vrai risque perçu : adoption faible et outil trop lourd pour le terrain.",
        ),
      },
      {
        stageId: 'closing',
        goal: 'Obtenir une démo concrète et courte.',
        prospectMessage:
          "Si tu peux me montrer quelque chose de concret, sur un cas simple, je regarderai volontiers. Tu proposes quoi ?",
        prospectMessageVariants: [
          "Si tu as une démonstration simple et très concrète, je suis prête à regarder. Tu ferais ça comment ?",
          "Montre-moi un cas concret, sans grand discours, et là oui je prendrai le temps. Quelle suite tu proposes ?",
        ],
        coachDirective:
          "Conclue avec une démo courte, concrète, idéalement centrée sur un premier bâtiment ou un flux simple.",
        rules: buildClosingRules(
          "Tu es au closing : propose une démo courte et concrète, par exemple sur un premier site ou un flux curatif simple.",
        ),
      },
    ],
  },
  {
    id: 'julien-provider-referral-foundation',
    trainingPathId: 'foundations',
    title: 'Julien • Recommandé par un prestataire',
    shortDescription:
      "Cas niveau 1 : le prospect a entendu parler d'Attrio par un prestataire qui l'utilise déjà, ce qui facilite l'ouverture.",
    difficulty: 'Débutant',
    difficultyClass: 'easy',
    personaId: 'julien-meridian',
    trainingGoal:
      "Apprendre à mener un process propre même quand le terrain est favorable : transformer une recommandation prestataire en besoin structuré, sans sauter trop vite au pitch.",
    difficultyDrivers: ['Lead tiède positif', 'Réassurance naturelle', 'Risque de pitcher trop tôt'],
    coachFocus:
      "Quand le prospect est déjà bien disposé, le piège est de croire que la vente est gagnée. Reste structuré jusqu’au next step.",
    steps: [
      {
        stageId: 'context',
        goal: "Comprendre le contexte de Julien et la place du prestataire dans son quotidien.",
        prospectMessage:
          "Mon prestataire principal utilise déjà Attrio chez d'autres clients et il m'en a parlé. Chez nous, je pilote deux bâtiments avec pas mal d'échanges entre occupants, prestataire et équipe technique. Tu veux comprendre quoi en premier ?",
        prospectMessageVariants: [
          "Dupont Maintenance me parle souvent d’Attrio parce qu’ils l’utilisent déjà ailleurs. De mon côté, je gère deux bâtiments et beaucoup d’allers-retours entre occupants, équipe technique et prestataire. Qu’est-ce que tu veux cadrer d’abord ?",
          "J’ai entendu parler d’Attrio via mon prestataire principal. Aujourd’hui, sur mes deux sites, tout passe entre occupants, maintenance et équipe interne. Tu veux partir de quel angle ?",
        ],
        coachDirective:
          "Cadre le contexte réel : bâtiments, acteurs, rôle du prestataire, volume d'échanges et fonctionnement actuel.",
        rules: buildContextRules(
          /(comment|aujourd'hui|prestataire|b[âa]timents|acteurs|organisation|qui fait quoi|occupants|[ée]quipe|fonctionne)/i,
          "Profite de l’ouverture, mais reste sur le contexte : qui intervient, comment les échanges circulent et qui pilote aujourd’hui.",
        ),
      },
      {
        stageId: 'problem',
        goal: 'Faire préciser les irritants malgré la bonne prédisposition.',
        prospectMessage:
          "Le sujet, c'est qu'aujourd'hui une demande part par mail, je relance au téléphone, puis je renvoie parfois au prestataire avec des infos incomplètes. On perd du temps bêtement.",
        prospectMessageVariants: [
          "Le vrai point de friction, c’est qu’une demande démarre souvent par mail, se poursuit par téléphone, puis finit chez le prestataire avec des infos pas toujours propres.",
          "Ce qui me gêne aujourd’hui, c’est le côté très dispersé : mail, appel, relance, puis requalification avant d’envoyer au prestataire.",
        ],
        coachDirective:
          "Creuse où se perd l'information, qui relance, et ce qui ralentit la coordination.",
        rules: buildProblemRules(
          /(mail|t[ée]l[ée]phone|relance|infos incompl[èe]tes|coordination|perd du temps|o[uù]|quand|qui)/i,
          "Creuse la mécanique concrète : où l’information se perd, qui relance, et ce qui fait perdre du temps.",
        ),
      },
      {
        stageId: 'impact',
        goal: 'Faire ressortir le coût du fonctionnement éclaté.',
        prospectMessage:
          "Au final, quand je ne suis pas là, personne n'a la vision complète. Et le prestataire me rappelle pour reconstituer le contexte, donc on rallonge tout.",
        prospectMessageVariants: [
          "Dans les faits, si je suis absent, le suivi devient flou. Le prestataire doit rappeler pour comprendre et on rallonge chaque sujet.",
          "Le problème derrière, c’est qu’on dépend trop de moi pour recoller le contexte. Résultat : les interventions prennent plus de temps.",
        ],
        coachDirective:
          "Quantifie le coût : dépendance à une personne, délais, perte de fluidité et charge de coordination.",
        rules: buildImpactRules(
          /(si je ne suis pas l[àa]|vision compl[èe]te|rallonge|d[ée]pend|temps|d[ée]lais|charge|coordination|combien)/i,
          "Mets des conséquences sur cette dépendance : temps perdu, rallongement des délais et dépendance à Julien.",
        ),
      },
      {
        stageId: 'needs',
        goal: 'Clarifier le résultat attendu.',
        prospectMessage:
          "Si on pouvait avoir un suivi partagé entre moi, mes occupants et le prestataire, avec quelque chose de simple, ce serait déjà très bien. Pour toi, il manque quoi pour cadrer la suite ?",
        prospectMessageVariants: [
          "Ce que j’attends, c’est surtout un suivi partagé, simple, où chacun voit ce qu’il doit voir sans me repasser par-dessus à chaque fois.",
          "Pour moi, la cible serait simple : occupants, prestataire et équipe technique dans le même flux, sans complexifier le quotidien. Qu’est-ce que tu veux encore cadrer ?",
        ],
        coachDirective:
          "Clarifie ses attentes : simplicité, visibilité partagée, rôle du prestataire et fluidité des échanges.",
        rules: buildNeedsRules(
          /(suivi partag[ée]|simple|occupants|prestataire|visibilit[ée]|chacun voit|r[ôo]le|fluidit[ée]|r[ée]ussite)/i,
          "Reste sur le besoin : à quoi ressemble un bon fonctionnement partagé pour Julien ?",
        ),
      },
      {
        stageId: 'transition',
        goal: 'Reformuler et obtenir le droit de présenter une approche.',
        prospectMessage:
          "Oui, c'est ça. Si tu as bien compris l'enjeu entre moi et le prestataire, résume-moi ta lecture.",
        prospectMessageVariants: [
          "Exactement. Si tu as bien saisi le sujet de coordination entre moi, le terrain et le prestataire, je t’écoute.",
          "Oui, c’est bien là-dessus que je t’attends. Vas-y, reformule-moi ce que tu retiens.",
        ],
        coachDirective:
          "Reformule contexte, friction, impact et besoin. Puis demande si tu peux partager une piste.",
        rules: buildTransitionRules(
          "Ta transition doit montrer que tu as compris le sujet central : fluidifier la coordination entre occupants, Julien et le prestataire.",
        ),
      },
      {
        stageId: 'solution',
        goal: 'Présenter ATTRIO comme un flux partagé et simple.',
        prospectMessage:
          "Très bien. Si Attrio peut vraiment simplifier ça sans me rajouter du pilotage manuel, vas-y.",
        prospectMessageVariants: [
          "D’accord. Si Attrio peut fluidifier ce lien avec le prestataire sans m’ajouter du travail, explique-moi comment.",
          "Je t’écoute, à condition que ça simplifie vraiment le suivi partagé au lieu de créer une couche de plus.",
        ],
        coachDirective:
          "Présente ATTRIO avec des rôles clairs : demandeur, gestionnaire, intervenant, suivi partagé et traçabilité.",
        rules: buildSolutionRules(
          /(attrio).*(demandeur|gestionnaire|intervenant|prestataire|suivi partag[ée]|tra[cç]abilit[ée]|demandes|coordination|simple)/i,
          "Reste très concret : montre comment ATTRIO fluidifie la coordination et le suivi partagé avec le prestataire.",
        ),
      },
      {
        stageId: 'objections',
        goal: 'Rassurer sur la dépendance au prestataire.',
        prospectMessage:
          "Ce que je ne veux pas, c'est un outil pensé uniquement pour mon prestataire. Il faut aussi que ça reste utile pour moi et simple pour mes équipes.",
        prospectMessageVariants: [
          "Mon petit point d’attention, c’est de ne pas me retrouver avec un outil calibré seulement pour le prestataire. Il faut que j’y gagne moi aussi.",
          "Je suis preneur, mais pas si l’outil sert surtout le prestataire. Il faut que ce soit vraiment utile pour mon pilotage et simple côté équipe.",
        ],
        coachDirective:
          "Accueille l'objection et rassure sur l'équilibre des rôles : utilité pour Julien, visibilité pour les équipes et coordination avec le prestataire.",
        rules: buildObjectionRules(
          /(je comprends|c'est l[ée]gitime|r[ôo]les|pilotage|visibilit[ée]|utile pour vous|[ée]quipes|prestataire|chacun)/i,
          /(pas du tout|ce n'est pas un probl[èe]me|faites-moi confiance|bien s[ûu]r que non)/i,
          "Réponds au vrai risque perçu : l’outil doit rester utile pour Julien, pas seulement pour le prestataire.",
        ),
      },
      {
        stageId: 'closing',
        goal: 'Conclure sur une démo courte et concrète.',
        prospectMessage:
          "Si on continue, je veux voir quelque chose de simple, avec un cas concret entre moi et le prestataire. Tu proposes quoi ?",
        prospectMessageVariants: [
          "Pour avancer, il me faut une démonstration très concrète, sur un cas réel de coordination avec le prestataire. Tu verrais quoi comme suite ?",
          "Si on prend un prochain temps, je veux du simple et du concret. Quelle est la meilleure prochaine étape selon toi ?",
        ],
        coachDirective:
          "Conclue avec une démo courte centrée sur un cas de coordination réel entre Julien et son prestataire.",
        rules: buildClosingRules(
          "Propose une prochaine étape très concrète : une démo courte sur un cas réel de coordination avec son prestataire.",
        ),
      },
    ],
  },
  {
    id: 'karim-existing-tool-adoption',
    trainingPathId: 'progression',
    title: 'Karim • Déjà un outil, peu adopté',
    shortDescription:
      "Cas intermédiaire : le prospect a déjà essayé de s'outiller, mais les équipes reviennent toujours aux canaux parallèles.",
    difficulty: 'Intermédiaire',
    difficultyClass: 'medium',
    personaId: 'karim-retailpark',
    trainingGoal:
      "Apprendre à vendre ATTRIO sans attaquer frontalement l'existant : comprendre pourquoi l'outil actuel n'est pas adopté, qualifier le coût de ce contournement et vendre une approche progressive.",
    difficultyDrivers: ['Outil déjà en place', 'Adoption faible', 'Canaux parallèles persistants'],
    coachFocus:
      "Ici, le vrai piège est de dire trop vite 'changez d'outil'. Tu dois d'abord comprendre pourquoi l'existant échoue.",
    steps: [
      {
        stageId: 'context',
        goal: "Comprendre l'organisation multi-sites et la place de l'outil actuel.",
        prospectMessage:
          "On a déjà un outil, plus des tableaux Excel, et malgré ça les demandes repassent encore par mail et téléphone sur mes 6 sites. Avant de me parler d'ATTRIO, tu veux comprendre quoi ?",
        coachDirective:
          "Cadre le contexte : sites, utilisateurs, outil actuel, processus réel et niveau d'adoption.",
        rules: buildContextRules(
          /(comment|aujourd'hui|outil actuel|sites|adoption|qui utilise|process|organisation|r[ée]ellement|tableaux)/i,
          "Pose une question sur l'usage réel : qui utilise quoi aujourd'hui, sur combien de sites, et où le process se casse ?",
        ),
      },
      {
        stageId: 'problem',
        goal: 'Faire émerger pourquoi l’existant est contourné.',
        prospectMessage:
          "Le problème, c'est que l'outil est censé tout gérer, mais les demandeurs le trouvent compliqué, les techniciens préfèrent qu'on les appelle et moi je consolide à la main derrière.",
        coachDirective:
          "Creuse la friction d'adoption : qui contourne, pourquoi, à quel moment et avec quelles conséquences.",
        rules: buildProblemRules(
          /(pourquoi|compliqu[ée]|contourn|pr[ée]f[èe]rent|consolide|[àa] la main|demandeurs|techniciens|quand)/i,
          "Creuse la cause du contournement : qui décroche, pourquoi, et comment cela finit en double gestion.",
        ),
      },
      {
        stageId: 'impact',
        goal: 'Quantifier le coût de ce faux outillage.',
        prospectMessage:
          "Au final, j'ai le pire des deux mondes : un outil que je paie, des équipes qui ne l'utilisent pas vraiment, et des relances manuelles partout.",
        coachDirective:
          "Fais ressortir le coût : double saisie, absence de vision consolidée, temps de relance, perte de confiance dans la donnée.",
        rules: buildImpactRules(
          /(co[uû]t|double saisie|relances|vision consolid[ée]e|temps|fiabilit[ée]|donn[ée]e|risque|combien)/i,
          "Mets des conséquences dessus : coût, temps, perte de fiabilité et absence de pilotage consolidé.",
        ),
      },
      {
        stageId: 'needs',
        goal: 'Cadrer ce qu’une amélioration crédible devrait apporter.',
        prospectMessage:
          "Si on avance sur un autre modèle, il faut que ce soit plus simple pour les demandeurs, plus clair pour les gestionnaires et surtout faisable sans tout casser.",
        coachDirective:
          "Clarifie les critères de succès : simplicité, adoption, multi-sites, continuité, visibilité.",
        rules: buildNeedsRules(
          /(simple|adoption|sans tout casser|multi-sites|visibilit[ée]|gestionnaires|demandeurs|crit[èe]res?|succ[èe]s)/i,
          "Reste sur le besoin : à quelles conditions Karim jugerait-il un changement crédible et acceptable ?",
        ),
      },
      {
        stageId: 'transition',
        goal: 'Reformuler sans dénigrer l’existant.',
        prospectMessage:
          "Exactement. Je ne veux pas changer d'outil pour changer d'outil. Si tu as compris ça, résume-moi ta lecture.",
        coachDirective:
          "Reformule la situation et demande l'autorisation de partager une approche progressive.",
        rules: buildTransitionRules(
          "Reformule le problème de fond — adoption et contournement — puis demande si tu peux partager une approche progressive.",
        ),
      },
      {
        stageId: 'solution',
        goal: 'Présenter ATTRIO comme approche d’usage, pas juste comme remplacement.',
        prospectMessage:
          "Vas-y. Si tu me montres quelque chose de plus simple et plus pilotable, je veux bien écouter.",
        coachDirective:
          "Présente ATTRIO comme une solution qui fluidifie les usages : rôles clairs, interface simple, visibilité site par site, curatif et préventif pilotés ensemble.",
        rules: buildSolutionRules(
          /(attrio).*(simple|adoption|demandeur|gestionnaire|intervenant|site|curatif|pr[ée]ventif|visibilit[ée]|pilotage)/i,
          "Ton pitch doit montrer pourquoi ATTRIO serait mieux utilisé : simplicité des rôles, visibilité et pilotage multi-sites.",
        ),
      },
      {
        stageId: 'objections',
        goal: 'Traiter le risque de re-lancer un chantier inutile.',
        prospectMessage:
          "Honnêtement, j'ai déjà vécu un projet outil qui devait tout régler. Je ne referai pas un big bang si mes équipes ne suivent pas.",
        coachDirective:
          "Accueille l'objection et réponds avec une logique de pilote, progressivité et adoption terrain.",
        rules: buildObjectionRules(
          /(je comprends|vous avez d[ée]j[àa] tent[ée]|site pilote|progressif|adoption|sans big bang|par usage|[ée]quipe terrain)/i,
          /(pas du tout|cette fois c'est diff[ée]rent|croyez-moi|il suffit de)/i,
          "Réponds au risque de changement raté : adoption, pilote, progressivité et preuve terrain.",
        ),
      },
      {
        stageId: 'closing',
        goal: 'Obtenir une suite crédible sur un périmètre maîtrisé.',
        prospectMessage:
          "Si on avance, ce sera sur quelque chose de très concret, pas une présentation générique. Tu proposes quoi ?",
        coachDirective:
          "Conclue avec un atelier ou une démo ciblée sur un site pilote ou un flux précis.",
        rules: buildClosingRules(
          "Propose une suite très concrète : démo ciblée ou atelier sur un site pilote, pas une présentation générique.",
        ),
      },
    ],
  },
  {
    id: 'sophie-change-management-preventive',
    trainingPathId: 'progression',
    title: 'Sophie • Peur du changement',
    shortDescription:
      'Cas intermédiaire/avancé : forte valeur du préventif, mais crainte réelle de perturber les équipes et les prestataires.',
    difficulty: 'Intermédiaire +',
    difficultyClass: 'medium',
    personaId: 'sophie-aurora',
    trainingGoal:
      "Apprendre à vendre ATTRIO quand le besoin existe mais que le frein principal est la conduite du changement : continuité d'exploitation, coordination prestataires et sécurisation du préventif.",
    difficultyDrivers: ['Peur du changement', 'Continuité opérationnelle', 'Préventif à sécuriser'],
    coachFocus:
      "Le bon vendeur ici n'appuie pas seulement sur la douleur. Il rassure sur la méthode de déploiement autant que sur la solution.",
    steps: [
      {
        stageId: 'context',
        goal: "Comprendre la réalité opérationnelle multi-sites de Sophie.",
        prospectMessage:
          "Je gère plusieurs résidences avec des équipes internes et des prestataires. On ne peut pas se permettre de désorganiser l'exploitation. Tu veux comprendre quoi avant d'aller plus loin ?",
        coachDirective:
          "Cadre le contexte : nombre de sites, types d'acteurs, criticité opérationnelle, organisation actuelle.",
        rules: buildContextRules(
          /(comment|sites|prestataires|interne|organisation|critic|aujourd'hui|r[ôo]les|coordonn)/i,
          "Pose une question sur la coordination réelle : qui intervient, sur combien de sites, et où la continuité est la plus sensible.",
        ),
      },
      {
        stageId: 'problem',
        goal: 'Faire émerger les fragilités actuelles.',
        prospectMessage:
          "Le préventif existe, mais il est trop manuel. Entre les échéances, les rapports et les observations critiques, on n'a pas toujours la bonne information au bon moment.",
        coachDirective:
          "Creuse la fragilité : oublis, manque d'alertes, coordination, liens entre préventif et curatif.",
        rules: buildProblemRules(
          /(manuel|[ée]ch[ée]ances|rapports|observations|critiques|alertes|oubli|coordination|bon moment)/i,
          "Creuse ce qui rend le préventif fragile aujourd'hui : alertes, échéances, rapports, observations critiques et coordination.",
        ),
      },
      {
        stageId: 'impact',
        goal: 'Faire verbaliser le risque opérationnel.',
        prospectMessage:
          "Quand une échéance glisse ou qu'une observation critique n'est pas traitée proprement, on prend un risque d'exploitation et derrière tout le monde se met à courir.",
        coachDirective:
          "Quantifie le risque : conformité, urgence, charge, perte de temps, stress et impact terrain.",
        rules: buildImpactRules(
          /(risque|conformit[ée]|urgence|charge|temps|stress|si rien ne change|cons[ée]quence|combien)/i,
          "Fais préciser le risque : conformité, stress d'exploitation, temps perdu et effet domino sur les équipes.",
        ),
      },
      {
        stageId: 'needs',
        goal: 'Clarifier le cadre d’une solution acceptable.',
        prospectMessage:
          "Ce que je veux, c'est plus d'anticipation, plus de traçabilité, mais sans lancer un projet qui perturbe tout le monde pendant des mois.",
        coachDirective:
          "Cadre le succès : anticipation, traçabilité, adoption progressive, continuité et simplicité pour les équipes.",
        rules: buildNeedsRules(
          /(anticipation|tra[cç]abilit[ée]|sans perturber|progressif|continuit[ée]|simple|r[ée]ussite|attendez)/i,
          "Reste sur les critères de succès : qu'est-ce qui doit s'améliorer sans fragiliser l'exploitation ?",
        ),
      },
      {
        stageId: 'transition',
        goal: 'Reformuler le besoin et la crainte de changement.',
        prospectMessage:
          "Oui, voilà. Si tu as compris qu'il faut à la fois mieux piloter et sécuriser le changement, tu peux me résumer.",
        coachDirective:
          "Reformule douleur, impact, besoin et frein principal. Puis demande si tu peux partager une approche adaptée.",
        rules: buildTransitionRules(
          "Ta transition doit montrer les deux sujets : mieux piloter le préventif et ne pas casser l'exploitation pendant le changement.",
        ),
      },
      {
        stageId: 'solution',
        goal: 'Présenter ATTRIO comme levier de pilotage et de sécurisation.',
        prospectMessage:
          "D'accord. Si ATTRIO peut réellement m'aider là-dessus, explique-moi comment.",
        coachDirective:
          "Présente ATTRIO avec les éléments utiles : plans de maintenance, alertes, observations critiques, lien curatif/préventif, rôles clairs et déploiement progressif.",
        rules: buildSolutionRules(
          /(attrio).*(plan[s]? de maintenance|alertes|observations|curatif|pr[ée]ventif|tra[cç]abilit[ée]|r[ôo]les|progressif)/i,
          "Ton pitch doit montrer qu'ATTRIO aide à piloter le préventif tout en gardant une mise en place progressive et maîtrisée.",
        ),
      },
      {
        stageId: 'objections',
        goal: 'Rassurer sur la conduite du changement.',
        prospectMessage:
          "Ma vraie crainte, c'est le chantier de mise en place. Si mes équipes ou mes prestataires décrochent, je me retrouve avec plus de chaos qu'avant.",
        coachDirective:
          "Accueille la crainte et rassure avec une logique de déploiement progressif, rôles simples et continuité d'exploitation.",
        rules: buildObjectionRules(
          /(je comprends|c'est l[ée]gitime|progressif|coexistence|accompagnement|prestataires|continuit[ée]|pas de big bang|par [ée]tapes)/i,
          /(aucun souci|ce sera rapide|pas de risque|croyez-moi)/i,
          "Réponds à la peur du changement : méthode progressive, accompagnement et continuité opérationnelle.",
        ),
      },
      {
        stageId: 'closing',
        goal: 'Obtenir une prochaine étape structurée.',
        prospectMessage:
          "Si on continue, je veux voir comment vous sécurisez le déploiement, pas juste l'outil. Quelle suite tu proposes ?",
        coachDirective:
          "Conclue avec une démo ou un atelier centré sur le cas d'usage et la méthode de déploiement.",
        rules: buildClosingRules(
          "Propose une suite centrée sur le cas d'usage et la méthode : démo ciblée + échange sur le déploiement progressif.",
        ),
      },
    ],
  },
  {
    id: 'laurent-pointilleux-roi-governance',
    trainingPathId: 'expert',
    title: 'Laurent • Client pointilleux et ROI',
    shortDescription:
      'Cas avancé : prospect multi-sites, déjà équipé, exigeant sur le ROI, la gouvernance, les droits et la capacité réelle à déployer.',
    difficulty: 'Avancé',
    difficultyClass: 'hard',
    personaId: 'laurent-patrimoine',
    trainingGoal:
      "Tenir un décideur exigeant sans dériver dans le marketing : comprendre où l'existant échoue, qualifier le coût d'un mauvais pilotage et présenter ATTRIO comme une méthode crédible de gouvernance et d'adoption.",
    difficultyDrivers: ['Client pointilleux', 'Outil déjà en place', 'ROI et gouvernance très challengés'],
    coachFocus:
      "Le niveau expert, c'est rester structuré même face à un prospect qui te teste. Pas de blabla, pas de sur-promesse.",
    steps: [
      {
        stageId: 'context',
        goal: "Comprendre le cadre de décision et la gouvernance de Laurent.",
        prospectMessage:
          "J'ai déjà une GMAO, des responsables locaux, des prestataires et une direction qui me demande des comptes sur 25 sites. Avant de me vendre quoi que ce soit, qu'est-ce que tu veux comprendre ?",
        coachDirective:
          "Cadre la gouvernance : organisation, sites, rôles, processus de décision et niveau d'exploitation réel de l'existant.",
        rules: buildContextRules(
          /(gouvernance|25 sites|responsables locaux|prestataires|direction|outil actuel|process de d[ée]cision|comment|aujourd'hui)/i,
          "Pose une vraie question de gouvernance : comment s'organisent les sites, qui décide, et comment l'existant est réellement utilisé.",
        ),
      },
      {
        stageId: 'problem',
        goal: 'Faire préciser où l’existant échoue réellement.',
        prospectMessage:
          "Le problème, ce n'est pas d'avoir un outil. C'est d'avoir un outil peu exploité, des tableaux à côté, des relances manuelles et des responsables locaux qui n'utilisent pas tous la même méthode.",
        coachDirective:
          "Creuse l'écart entre l'outil théorique et l'usage réel : méthode, pilotage, adoption, visibilité consolidée.",
        rules: buildProblemRules(
          /(peu exploit[ée]|tableaux|relances manuelles|m[ée]thode|responsables locaux|usage r[ée]el|visibilit[ée] consolid[ée]e|pourquoi)/i,
          "Creuse l'écart entre la promesse de l'outil et la réalité terrain : qui contourne, pourquoi, et avec quel impact sur le pilotage.",
        ),
      },
      {
        stageId: 'impact',
        goal: 'Faire ressortir le coût d’un mauvais pilotage multi-sites.',
        prospectMessage:
          "Derrière, je perds du temps à reconstituer une vue groupe, je pilote trop tard et je ne peux pas défendre clairement mes arbitrages en direction.",
        coachDirective:
          "Quantifie le coût : temps de consolidation, arbitrages tardifs, manque de visibilité, difficulté à prouver le ROI ou la conformité.",
        rules: buildImpactRules(
          /(vue groupe|pilote trop tard|direction|roi|conformit[ée]|temps|co[uû]t|arbitrages|combien|risque)/i,
          "Fais préciser ce que coûte ce pilotage tardif : temps, arbitrages, direction, visibilité et crédibilité.",
        ),
      },
      {
        stageId: 'needs',
        goal: 'Clarifier ce qu’il attend d’une vraie amélioration.',
        prospectMessage:
          "Si j'avance avec un éditeur, il faut qu'il comprenne les rôles, les droits, la réalité multi-sites et surtout qu'il sache me montrer un ROI crédible sans me promettre la lune.",
        coachDirective:
          "Clarifie les critères : droits, gouvernance, adoption, ROI, méthode de déploiement et crédibilité.",
        rules: buildNeedsRules(
          /(r[ôo]les|droits|multi-sites|roi|cr[ée]dible|m[ée]thode|d[ée]ploiement|attendez|crit[èe]res?)/i,
          "Reste sur les attentes : quels critères doivent être réunis pour qu'un projet soit crédible à ses yeux ?",
        ),
      },
      {
        stageId: 'transition',
        goal: 'Reformuler sans survendre.',
        prospectMessage:
          "Oui. Si tu as compris que je cherche autant une méthode de pilotage qu'un outil, résume-moi ça.",
        coachDirective:
          "Reformule la gouvernance, l'échec de l'existant, l'impact et les critères de décision. Puis demande si tu peux partager une approche.",
        rules: buildTransitionRules(
          "Ta transition doit montrer que Laurent n'achète pas un outil de plus : il achète un pilotage crédible, gouverné et mesurable.",
        ),
      },
      {
        stageId: 'solution',
        goal: 'Présenter ATTRIO comme un cadre de pilotage crédible.',
        prospectMessage:
          "Très bien. Si ATTRIO sait répondre à ça sans me raconter une histoire, vas-y.",
        coachDirective:
          "Présente ATTRIO avec sobriété : rôles demandeur/gestionnaire/intervenant, visibilité multi-sites, curatif/préventif, droits, pilotage, calendrier, alertes et méthode de mise en œuvre.",
        rules: buildSolutionRules(
          /(attrio).*(multi-sites|pilotage|r[ôo]les|droits|curatif|pr[ée]ventif|alertes|calendrier|tra[cç]abilit[ée]|roi|m[ée]thode)/i,
          "Ton pitch doit lier ATTRIO à la gouvernance : rôles, visibilité multi-sites, droits, pilotage et méthode de déploiement.",
        ),
      },
      {
        stageId: 'objections',
        goal: 'Traiter une objection de crédibilité, pas juste de prix.',
        prospectMessage:
          "Très franchement, des éditeurs qui me promettent de la visibilité et du ROI, j'en vois tous les mois. Ce qui m'intéresse, c'est la preuve, la méthode et la capacité à embarquer mes équipes.",
        coachDirective:
          "Accueille l'objection et réponds avec preuve, méthode, pilote, gouvernance et accompagnement.",
        rules: buildObjectionRules(
          /(je comprends|preuve|m[ée]thode|pilote|gouvernance|embarquer|accompagnement|mesurable|r[ôo]les|progressif)/i,
          /(croyez-moi|on fait [çc]a tout le temps|aucun probl[èe]me|vous verrez bien)/i,
          "Réponds à la crédibilité : preuve, méthode, pilotage, accompagnement et déploiement progressif.",
        ),
      },
      {
        stageId: 'closing',
        goal: 'Obtenir une suite exigeante mais réaliste.',
        prospectMessage:
          "Si on va plus loin, je veux un échange utile, pas une démo gadget. Tu proposes quoi comme prochaine étape ?",
        coachDirective:
          "Conclue avec une étape crédible : atelier cadré, démonstration ciblée, cas multi-sites, participants adaptés.",
        rules: buildClosingRules(
          "Propose une prochaine étape exigeante mais réaliste : atelier ou démo ciblée avec les bons interlocuteurs et un angle multi-sites clair.",
        ),
      },
    ],
  },
]
