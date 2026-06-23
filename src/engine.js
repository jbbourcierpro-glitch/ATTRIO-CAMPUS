/**
 * Moteur logique de simulation commerciale pour ATTRIO CAMPUS.
 */
export class SimulationEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.currentScenario = null;
    this.currentTurnIndex = 0;
    this.history = [];
    this.scoreSum = 0;
    this.attempts = 0;
    this.isCompleted = false;
    this.activeTurnAnalysis = null; // Stocke l'analyse du tour en cours avant validation/retry
  }

  /**
   * Initialise un nouveau scénario.
   */
  startScenario(scenario) {
    this.reset();
    this.currentScenario = scenario;
    return this.getCurrentProspectMessage();
  }

  /**
   * Retourne le message actuel du prospect.
   */
  getCurrentProspectMessage() {
    if (!this.currentScenario || this.isCompleted) return null;
    return this.currentScenario.turns[this.currentTurnIndex].prospectMessage;
  }

  /**
   * Retourne la ligne directrice d'ATTY pour le tour en cours.
   */
  getCurrentGuideline() {
    if (!this.currentScenario || this.isCompleted) return null;
    return this.currentScenario.turns[this.currentTurnIndex].guideline;
  }

  /**
   * Analyse la réponse de l'utilisateur.
   */
  analyzeResponse(userText) {
    if (!this.currentScenario || this.isCompleted) return null;
    
    this.attempts++;
    const currentTurn = this.currentScenario.turns[this.currentTurnIndex];
    const rules = currentTurn.rules;
    
    let matchedRule = null;
    
    // Parcourir les règles pour trouver celle qui correspond (dans l'ordre défini)
    for (const rule of rules) {
      if (rule.pattern instanceof RegExp) {
        if (rule.pattern.test(userText)) {
          matchedRule = rule;
          break;
        }
      }
    }
    
    // Si aucune règle ne matche (ne devrait pas arriver grâce au fallback match-all /.*/)
    if (!matchedRule) {
      matchedRule = rules[rules.length - 1] || {
        score: 5,
        type: "warning",
        feedback: "Réponse reçue, mais ATTY n'a pas pu l'analyser précisément. Essaye d'être plus précis dans ta formulation."
      };
    }
    
    this.activeTurnAnalysis = {
      userMessage: userText,
      prospectMessage: currentTurn.prospectMessage,
      score: matchedRule.score,
      feedback: matchedRule.feedback,
      type: matchedRule.type,
      ruleName: matchedRule.name
    };
    
    return this.activeTurnAnalysis;
  }

  /**
   * Valide le tour en cours et passe à l'étape suivante.
   */
  commitTurn() {
    if (!this.activeTurnAnalysis) return null;

    // Enregistrer le tour dans l'historique
    this.history.push({ ...this.activeTurnAnalysis });
    this.scoreSum += this.activeTurnAnalysis.score;
    this.activeTurnAnalysis = null;
    
    this.currentTurnIndex++;
    
    // Vérifier si le scénario est fini
    if (this.currentTurnIndex >= this.currentScenario.turns.length) {
      this.isCompleted = true;
      return { isFinished: true };
    }
    
    return {
      isFinished: false,
      nextProspectMessage: this.getCurrentProspectMessage()
    };
  }

  /**
   * Annule l'analyse en cours pour permettre à l'utilisateur de ressaisir sa réponse.
   */
  retryTurn() {
    this.activeTurnAnalysis = null;
  }

  /**
   * Calcule le score final de la session.
   */
  getFinalScore() {
    return this.scoreSum;
  }

  /**
   * Calcule le score maximal possible.
   */
  getMaxPossibleScore() {
    if (!this.currentScenario) return 0;
    return this.currentScenario.turns.length * 10;
  }

  /**
   * Retourne l'évaluation globale d'ATTY et le grade final.
   */
  getDebriefing() {
    const finalScore = this.getFinalScore();
    const maxScore = this.getMaxPossibleScore();
    const percentage = (finalScore / maxScore) * 100;
    
    let grade = "";
    let gradeClass = "";
    let feedback = "";
    
    if (percentage >= 90) {
      grade = "Elite Closer";
      gradeClass = "success";
      feedback = `"${this.currentScenario.prospect.name} a signé tout de suite ! C'est un sans-faute remarquable. Tu as mené la transition avec brio : tu as écouté avec empathie, tu as creusé l'impact commercial de sa frustration (-15% d'objectifs) et tu as décroché le rendez-vous téléphonique sans jamais pitcher prématurément le produit. C'est exactement le niveau exigé sur ATTRIO CAMPUS. Chapeau !"`;
    } else if (percentage >= 70) {
      grade = "Négociateur Confirmé";
      gradeClass = "success";
      feedback = `"Le rendez-vous est pris, c'est du bon travail. Tu as évité les gros pièges et tu as su rebondir sur ses douleurs. Cependant, pour passer au niveau supérieur, essaie d'être encore plus précis sur la validation de la douleur et l'usage de questions de transition directes. Tu as le niveau pour aller sur le terrain !"`;
    } else if (percentage >= 50) {
      grade = "Pitcher Junior";
      gradeClass = "warning";
      feedback = `"Tu as décroché le rendez-vous, mais c'était laborieux. Tu as posé des questions fermées ou tu t'es intéressé trop vite à des détails techniques. Le client n'a pas ressenti une réelle valeur ajoutée pendant la discussion. Tu dois travailler ta découverte et faire preuve de plus d'empathie commerciale."`;
    } else {
      grade = "Pitcher Hâtif";
      gradeClass = "error";
      feedback = `"Aïe... C'est un échec. Tu as sauté sur le prospect pour lui parler de ton produit à la première occasion. En agissant ainsi, tu t'es comporté comme un vendeur de tapis, ce qui fait fuir n'importe quel prospect qualifié. Prends le temps de lire mes feedbacks, recommence la simulation, et n'aborde le produit qu'après avoir qualifié l'impact de son problème."`;
    }

    return {
      score: finalScore,
      maxScore: maxScore,
      grade: grade,
      gradeClass: gradeClass,
      feedback: feedback,
      attempts: this.attempts,
      history: this.history
    };
  }
}
