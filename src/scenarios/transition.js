/**
 * Base de données des scénarios pour le module "La Transition".
 */
export const transitionScenarios = [
  {
    id: "crm-frustre-thomas",
    title: "Le CRM Chronophage",
    shortDescription: "Thomas, Directeur Commercial, en a marre que son équipe passe sa vie à remplir Salesforce plutôt que de vendre.",
    difficulty: "Intermédiaire",
    difficultyClass: "medium",
    prospect: {
      name: "Thomas",
      title: "Directeur Commercial",
      company: "ScaleUp Corp",
      avatarInitials: "T",
      teamSize: "12 commerciaux",
      crm: "Salesforce",
      details: "Thomas gère une équipe de 12 commerciaux. Ses objectifs de croissance sont très ambitieux, mais il fait face à une baisse de productivité. Son équipe se plaint constamment de la lourdeur des tâches administratives dans Salesforce."
    },
    coachBrief: "Thomas est extrêmement tendu à cause de la perte de productivité de ses commerciaux. Il va exprimer une douleur forte dès le début. Ta mission est de creuser l'impact de ce problème sur son business et ses équipes, pour ensuite lui proposer un échange téléphonique, le tout SANS pitcher la solution ATTRIO (qui automatise le CRM).",
    turns: [
      {
        prospectMessage: "Salut. Franchement, je n'en peux plus. Mes 12 commerciaux passent plus de 2 heures par jour à remplir le CRM Salesforce au lieu de prospecter et de vendre. On perd un temps fou en saisie manuelle.",
        guideline: "Conseil d'ATTY : Valide sa frustration (empathie) et pose une question ouverte sur les conséquences réelles de cette perte de temps. Pas de pitch !",
        rules: [
          {
            name: "premature_pitch",
            pattern: /(notre (solution|logiciel|application|outil|produit|plateforme))|(nous (avons|proposons|faisons|pouvons vous aider))|(attrio)|(automatiser|saisie automatique|gagner du temps|facile à intégrer)|\b(démo|démonstration)\b/i,
            score: 2,
            type: "error",
            feedback: "Aïe ! Tu passes en mode pitch produit dès le premier message. Thomas exprime une frustration, mais tu ne sais rien de l'impact business de son problème. Si tu lui dis immédiatement 'notre logiciel automatise ça', il va se méfier et se fermer. Recommence en lui posant une question pour comprendre les conséquences de cette perte de temps."
          },
          {
            name: "no_question",
            pattern: /^[^?]*$/,
            score: 3,
            type: "error",
            feedback: "Tu t'exprimes sans lui poser de question à la fin. En phase de découverte, c'est le prospect qui doit parler. Termine toujours ta réponse par une question ouverte (contenant un point d'interrogation) pour garder la main sur la conversation."
          },
          {
            name: "technical_details",
            pattern: /(pourquoi salesforce|lightning|classic|version|technique|api|configuration|crm)/i,
            score: 5,
            type: "warning",
            feedback: "Tu te focalises trop sur la technique (des questions sur Salesforce). Ce n'est pas le moment de jouer les consultants informatiques. Recentres-toi sur l'humain et l'impact commercial de ce temps perdu."
          },
          {
            name: "good_investigation",
            pattern: /(combien|comment|quel|quelle|conséquence|impact|perte|perdent|financier|objectif|chiffre|manque)/i,
            score: 10,
            type: "success",
            feedback: "Excellent ! Tu as validé sa frustration et tu cherches à creuser l'impact business (la perte d'opportunités, le chiffre d'affaires manqué ou le moral de l'équipe). C'est ainsi qu'on bâtit de la valeur avant d'aborder la solution. Poursuis comme ça."
          },
          {
            name: "fallback",
            pattern: /.*/,
            score: 4,
            type: "warning",
            feedback: "C'est un peu trop générique ou passif. Montre que tu comprends la frustration de perdre 2 heures par jour et pose-lui une question directe sur l'impact de ce problème sur ses objectifs de vente."
          }
        ]
      },
      {
        prospectMessage: "L'impact ? C'est simple, on a raté nos objectifs du trimestre de 15% et l'équipe est complètement démotivée par cette paperasse administrative. Ils ont l'impression de faire du flicage.",
        guideline: "Conseil d'ATTY : Il vient de te donner un chiffre (-15%) et un problème humain (démotivation). Rebondis dessus et tente une transition douce (ex: 'Si on pouvait éliminer ça...'). Toujours pas de pitch produit !",
        rules: [
          {
            name: "premature_pitch",
            pattern: /(notre (solution|logiciel|application|outil|produit|plateforme))|(nous (avons|proposons|faisons|pouvons vous aider))|(attrio)|\b(essayer|tester|démo|démonstration)\b/i,
            score: 3,
            type: "error",
            feedback: "Toujours trop tôt pour vendre ! Thomas vient de te donner une information cruciale : -15% d'objectifs et baisse de moral. Valide cette douleur. Montre que tu mesures la gravité du problème avant de proposer ton produit."
          },
          {
            name: "no_question",
            pattern: /^[^?]*$/,
            score: 3,
            type: "error",
            feedback: "Tu n'as pas posé de question. Pour engager le prospect et l'amener vers la transition, tu dois lui poser une question fermée d'accord de principe ou une question ouverte sur sa volonté de changer."
          },
          {
            name: "good_transition",
            pattern: /(si (on |vous )?(pouvait|pouvez|aviez|éliminer|libérer|récupérer|gagner|résoudre|éviter))|(imaginez|comment ce serait|si vos commerciaux)/i,
            score: 10,
            type: "success",
            feedback: "Superbe transition ! Tu as rebondi sur le chiffre clé (-15% d'objectifs) et tu lui proposes de se projeter dans une situation où le problème serait résolu, sans même prononcer le nom de ton produit. C'est la transition idéale vers l'étape suivante."
          },
          {
            name: "neutral_question",
            pattern: /(comment|pourquoi|depuis quand)/i,
            score: 6,
            type: "warning",
            feedback: "Tu continues à creuser le problème, ce qui est correct en soi, mais tu as déjà toutes les cartes en main (chiffres, moral). Il est temps d'orienter doucement la conversation vers une solution sans pour autant pitcher. Essaie une question de transition comme 'Si on pouvait éliminer ce problème...'"
          },
          {
            name: "fallback",
            pattern: /.*/,
            score: 5,
            type: "warning",
            feedback: "Ta réponse manque d'impact. Rebondis sur le fait qu'ils ont raté leurs objectifs de 15% et demande-lui s'il serait prêt à explorer une solution si l'on pouvait éliminer ce temps administratif."
          }
        ]
      },
      {
        prospectMessage: "C'est évident. Si vous avez une méthode ou un moyen pour qu'ils arrêtent de saisir des données et qu'ils passent leur temps au téléphone avec des clients, je suis preneur. Vous proposez quoi concrètement ?",
        guideline: "Conseil d'ATTY : C'est le moment d'obtenir le rendez-vous. Ne lui explique pas ton produit par chat. Propose-lui un court appel téléphonique pour étudier son cas particulier.",
        rules: [
          {
            name: "heavy_pitch",
            pattern: /(notre logiciel fonctionne|on utilise l'ia|on se connecte à salesforce|l'outil fait|les fonctionnalités sont|notre application permet de)/i,
            score: 4,
            type: "error",
            feedback: "Non, n'explique pas tout ton produit par chat ! Tu vas te lancer dans un monologue écrit qu'il lira à moitié et tu perdras l'occasion d'un échange direct. Il est chaud pour avancer, profite-en pour basculer sur un court appel téléphonique pour qualifier ses besoins."
          },
          {
            name: "good_meeting_request",
            pattern: /(échange|échanger|téléphone|appel|rencontrer|visio|rendez-vous|rdv|10 minutes|15 minutes|semaine prochaine|dispo)/i,
            score: 10,
            type: "success",
            feedback: "Parfait ! C'est un sans-faute. Le client a validé la transition, et au lieu de lui envoyer un pavé technique par chat, tu lui proposes un court échange téléphonique de 10-15 minutes pour étudier son cas spécifique. C'est exactement ce qu'on attend d'un commercial d'élite !"
          },
          {
            name: "fallback",
            pattern: /.*/,
            score: 5,
            type: "warning",
            feedback: "Le prospect est d'accord pour en savoir plus. Ne lui donne pas tous les détails par écrit maintenant. Propose-lui simplement un court appel de 10-15 minutes la semaine prochaine pour lui montrer comment d'autres directeurs commerciaux ont résolu ce problème."
          }
        ]
      }
    ]
  },
  {
    id: "dsi-mefiant-lucas",
    title: "Le DSI Méfiant",
    shortDescription: "Lucas, DSI dans le secteur de la santé, refuse catégoriquement d'utiliser des applications SaaS tierces par peur des fuites.",
    difficulty: "Difficile",
    difficultyClass: "hard",
    prospect: {
      name: "Lucas",
      title: "Directeur des Systèmes d'Information",
      company: "MedTech Solutions",
      avatarInitials: "L",
      teamSize: "150 collaborateurs",
      crm: "Interne / Sensible",
      details: "Lucas est le gardien de la sécurité des données chez MedTech Solutions. Il est très méfiant envers les solutions cloud / SaaS externes en raison des réglementations strictes sur les données médicales."
    },
    coachBrief: "Lucas est un profil technique et méfiant. Il va attaquer directement sur l'aspect sécurité. Ton but n'est pas de débattre de la sécurité de ton produit par chat, mais de valider son exigence et d'ouvrir la porte à un échange technique / envoi de dossier de sécurité. Sois pro et précis, pas de marketing !",
    turns: [
      {
        prospectMessage: "J'ai vu passer votre message, mais pour être honnête, la sécurité des données médicales est trop sensible chez nous. On ne peut pas se permettre d'utiliser des outils externes SaaS qui stockent nos données ailleurs.",
        guideline: "Conseil d'ATTY : Valide sa crainte légitime concernant les données de santé. Ne commence pas à dire 'notre produit est super sécurisé'. Pose une question sur son protocole de sécurité actuel.",
        rules: [
          {
            name: "premature_security_pitch",
            pattern: /(notre (solution|outil|produit|plateforme) (est|a))|(sécurisé|rgpd|conforme|certifié|chiffré|crypté|hébergé en france|hébergement|ne vous inquiétez pas|aucun risque)/i,
            score: 2,
            type: "error",
            feedback: "Aïe, tu te lances dans une argumentation technique et sécuritaire tout de suite ! Lucas est méfiant. Si tu lui dis immédiatement 'notre produit est super sécurisé', il va voir ça comme du blabla de vendeur. Recommence en validant son point (la sensibilité des données de santé est en effet extrême) et pose-lui une question sur ses exigences de sécurité actuelles."
          },
          {
            name: "no_question",
            pattern: /^[^?]*$/,
            score: 3,
            type: "error",
            feedback: "Tu n'as pas posé de question. Avec un DSI méfiant, tu dois mener la danse en l'interrogeant sur son cahier des charges sécurité pour qu'il voie que tu respectes ses contraintes."
          },
          {
            name: "good_empathy_investigation",
            pattern: /(comprends|légitime|sensible|effectivement|quelles sont|quels sont|critères|normes|exigences|cahier des charges|politique)/i,
            score: 10,
            type: "success",
            feedback: "Très bien ! Tu as fait preuve d'empathie professionnelle en validant la sensibilité du secteur de la santé, et tu as posé une question sur leurs critères de sécurité. C'est la bonne méthode pour désarmer sa méfiance."
          },
          {
            name: "fallback",
            pattern: /.*/,
            score: 4,
            type: "warning",
            feedback: "C'est trop neutre. Un DSI veut du sérieux. Valide d'abord la sensibilité des données médicales, puis demande-lui quelles sont ses contraintes de sécurité principales pour l'intégration de logiciels."
          }
        ]
      },
      {
        prospectMessage: "On impose un hébergement sur des serveurs certifiés HDS (Hébergeur de Données de Santé) et un chiffrement de bout en bout. 95% des outils SaaS du marché ne passent pas nos exigences.",
        guideline: "Conseil d'ATTY : Il te donne ses critères stricts (HDS + chiffrement). Ne dis pas 'on est conformes !'. Valide l'exigence et pose une question de transition sur l'étude d'un cas client similaire.",
        rules: [
          {
            name: "premature_pitch",
            pattern: /(nous sommes HDS|notre outil est certifié|chiffrement AES|notre cloud)/i,
            score: 3,
            type: "error",
            feedback: "Erreur classique ! Tu t'empresses de dire 'on est HDS'. C'est trop tôt. Même si tu as la certification, valide le fait que leur niveau d'exigence est très élevé et nécessaire dans la santé. Demande-lui s'il serait ouvert à voir comment d'autres DSI dans la santé ont validé notre architecture."
          },
          {
            name: "no_question",
            pattern: /^[^?]*$/,
            score: 3,
            type: "error",
            feedback: "N'oublie pas la question à la fin ! Tu dois lui demander s'il accepterait de comparer son cahier des charges à un dossier de sécurité type ou un cas client."
          },
          {
            name: "good_transition_dsi",
            pattern: /(si (on |vous )?(pouvait|pouvez|aviez|apporter|garanties|cas|dossier|confrères|cliniques|hôpitaux|secteur))/i,
            score: 10,
            type: "success",
            feedback: "Parfait ! Tu as validé la rigueur de sa politique et tu lui proposes de regarder comment d'autres acteurs de la santé (cliniques/hôpitaux) ont validé notre modèle sécuritaire. C'est une excellente transition."
          },
          {
            name: "fallback",
            pattern: /.*/,
            score: 5,
            type: "warning",
            feedback: "Ne commence pas à te justifier sur la sécurité. Rebondis sur le fait que la certification HDS est en effet indispensable dans leur métier, puis demande-lui s'il serait prêt à jeter un œil à notre dossier technique de sécurité."
          }
        ]
      },
      {
        prospectMessage: "Si vous êtes vraiment HDS et que vous avez des cas d'usage concrets avec d'autres cliniques, je veux bien y jeter un œil. Mais je n'ai pas de temps à perdre avec des présentations commerciales.",
        guideline: "Conseil d'ATTY : Lucas est d'accord pour regarder la technique mais déteste le blabla commercial. Propose-lui un échange direct et court centré sur l'architecture technique, ou l'envoi du dossier sécurité.",
        rules: [
          {
            name: "commercial_pitch",
            pattern: /(démonstration commerciale|démo produit|présenter notre outil|tarifs|nos offres)/i,
            score: 3,
            type: "error",
            feedback: "Il vient de te dire qu'il déteste les présentations commerciales et tu lui proposes une démo de produit ! Propose-lui plutôt un échange purement technique (SecOps / architecture) ou l'envoi direct de la documentation de sécurité."
          },
          {
            name: "good_meeting_tech",
            pattern: /(dossier|document|technique|architecture|expert|sécurité|appel|10 minutes|15 minutes)/i,
            score: 10,
            type: "success",
            feedback: "Impeccable ! Tu as compris que Lucas parle technique. Tu lui proposes d'éviter le blabla marketing et de caler un appel rapide de 10-15 minutes axé sur l'architecture de sécurité (ou de lui envoyer le dossier SecOps). C'est parfait !"
          },
          {
            name: "fallback",
            pattern: /.*/,
            score: 5,
            type: "warning",
            feedback: "Lucas est un DSI pressé. Propose-lui d'envoyer le dossier technique de sécurité et d'en discuter lors d'un appel rapide de 10 minutes avec un de vos experts SecOps (et non un commercial)."
          }
        ]
      }
    ]
  }
];
