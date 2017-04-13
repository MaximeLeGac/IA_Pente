
var maxDepth = 2;					// Indique la profondeur de recherche de l'IA
var winningAlignedPawnCount = 5; 	// Nombre de jetons à aligner pour gagner
var winningTenailleCount = 5;		// Nombre de tenailles donnant la victoire



// ==================================================================
// Gère la réception de la grille et la prochain coup de l'IA
exports.handleBoard = function(req, res) {
	
	// Récupération des données du service
	var board 			= [];
	var currentPlayer 	= 0;
	var playerScore 	= 0;
	var opponentScore 	= 0;
	var currentRound 	= 0;

	if (Array.isArray(req.body.board)) {
		board 			= req.body.board
	}
	if (Number.isInteger(currentPlayer)) {
		currentPlayer 	= req.body.player;
	}
	if (Number.isInteger(req.body.score)) {
		playerScore 	= req.body.score;
	}
	if (Number.isInteger(req.body.score_vs)) {
		opponentScore 	= req.body.score_vs;
	}
	if (Number.isInteger(req.body.round)) {
		currentRound 	= req.body.round;
	}

	// Calcul du prochain coup
	var pawn = placePawn(board, currentPlayer, currentPlayer, 0, -Infinity, Infinity, currentRound, playerScore, opponentScore);

	// Envoi du pion au client
	res.json({ x: pawn[0], y: pawn[1] });
}
// ==================================================================



// ==================================================================
// Renvoi le prochain coup de l'IA
// Le placement du pion est choisi suivant l'algorithme MinMax
// complété par un élagage alpha-beta
function placePawn(grid, currentPlayer, player, depth, alpha, beta, currentRound, playerScore, opponentScore) {
	if (depth === maxDepth) {
		// On a atteint la limite de profondeur de calcul on retourne donc une estimation de la position actuelle
		var eval = evaluate(grid, player, depth);
		return currentPlayer === player ? eval : -eval;
	} else {
		var best = -Infinity;	// Estimation du meilleur coup actuel
		var eval; 				// Estimation de la valeur d'un coup
		var currentTry = null; 	// Meilleur coup actuel

		// On parcourt la grille pour tester toutes les combinaisons possibles
		for (var x = 0; x < grid.length; x++) {
			for (var y = 0; y < grid[x].length; y++) {

				// On vérifie que pour le 2e pion du joueur est à plus de 3 intersections de son premier jeton
				if (currentRound == 3 && Math.abs(Math.trunc(grid.length/2) - x) <= 3 && Math.abs(Math.trunc(grid[x].length/2) - y) <= 3) continue;

				// Case déjà occupée
				if (grid[x][y] != 0) continue;

				// Initialisation du premier coup
				if (!currentTry) currentTry = [x,y];

				// On vérifie si le coup est gagnant
				grid[x][y] = player;
				if (eval = checkWinningMove(x, y, grid, playerScore, opponentScore, currentPlayer === player, depth)) {
					// Restauration de la grille
					grid[x][y] = 0;
					if (!depth) return [x,y];
					return Infinity;
				}

				// Estimation du coup en cours
				eval = -placePawn(grid, currentPlayer, player%2+1, depth+1, -beta, -alpha, currentRound, playerScore);
				if (eval > best) {
					// On vient de trouver un meilleur coup
					best = eval;
					if (best > alpha) {
						alpha = best;
						currentTry = [x,y];
						if (alpha >= beta) {
							// Ce coup est mieux que le meilleur des coups qui aurait pu être joué si on avait joué un autre coup.
							// Cela signifie que jouer le coup qui a amené cette position n'est pas bon.
							// Il est inutile de continuer à estimer les autres possibilités de cette position (principe de l'élagage alpha-beta).
							// Restauration de la grille
							grid[x][y] = 0;
							if (!depth) return currentTry;
							return best;
						}
					}
				}
				// Restauration de la grille
				grid[x][y] = 0;
			}
		}
		if (!depth) {
			return currentTry;
		}
		else if (currentTry) {
			return best;
		}
		// Si le coup n'a jamais été défini c'est qu'il n'y a plus de possibilité de jeu
		return 0;
	}
}
// ==================================================================



// ==================================================================
// Permet d'évaluer chaque position de la grille
function evaluate(grid, currentPlayer, depth) {
	// Estimation globale de la position
	var eval = 0;
	for (var x = 0; x < grid.length; x++) {
		for (var y = 0; y < grid[x].length; y++) {
			if (!grid[x][y]) continue;
			// Estimation de la valeur de ce jeton et ajout au calcul d'estimation global
			if (grid[x][y] == currentPlayer) {
				eval += getAnalysis(grid, x, y, true, depth);
			}
			else {
				eval -= getAnalysis(grid, x, y, false, depth);
			}
		}
	}
	return eval;
}
// ==================================================================



// ==================================================================
// Permet de calculer le nombre de "libertés" pour la case donnée
function getAnalysis(grid, x, y, isPlayer, depth) {
	var couleur = grid[x][y];
	var estimation = 0; // Estimation pour toutes les directions
	var compteur = 0; 	// Compte le nombre de possibilités pour une direction
	var centre = 0; 	// Regarde si le jeton a de l'espace de chaque côté
	var bonus = 0; 		// Point bonus liée aux jetons alliés dans cette même direction
	var i,j; 			// Pour les coordonnées temporaires
	var pass = false; 	// Permet de voir si on a passé la case étudiée
	var pLiberte = 1; 	// Pondération sur le nombre de liberté
	var pBonus = !isPlayer ? 2 : 1; 	// Pondération Bonus
	var pCentre = 2; 	// Pondération pour l'espace situé de chaque côté
	var start = 0;		// start pour recherche sur une porter de 6
	var end = 0;		// end pour une recherche sur une porter de 6

	start = (x-6 < 0 ? 0 : x-6);
	end = (x + 6 > grid.length-1 ? grid.length-1 : x +6);
	// Recherche horizontale
	for (i = start; i < end; i++) {
		if (i == x) {
			centre = compteur++;
			pass = true;
			continue;
		}
		switch (grid[i][y]) {
			case 0: // Case vide
				compteur++;
				break;
			case couleur: // Jeton allié
				compteur++;
				bonus++;
				break;
			default: // Jeton adverse
				if (pass) {
					i = grid.length; // Il n'y aura plus de liberté supplémentaire, on arrête la recherche ici
				} else {
					// On réinitialise la recherche
					compteur = 0;
					bonus = 0;
				}
		}
	}
	if (compteur >= winningAlignedPawnCount) {
		// Il est possible de gagner dans cette direction
		estimation += compteur*pLiberte + bonus*pBonus + (1-Math.abs(centre/(compteur-1)-0.5))*compteur*pCentre;
	}


	start = (y-6 < 0 ? 0 : y-6);
	end = (y + 6 > grid[x].length-1 ? grid[x].length - 1 : y + 6);
	// Recherche verticale
	compteur = 0;
	bonus = 0;
	pass = false;
	for (j = start; j < end; j++) {
		if (j == y) {
			centre = compteur++;
			pass = true;
			continue;
		}
		switch (grid[x][j]) {
			case 0: // Case vide
				compteur++;
				break;
			case couleur: // Jeton allié
				compteur++;
				bonus++;
				break;
			default: // Jeton adverse
				if (pass) {
					j = grid[x].length; // Il n'y aura plus de liberté supplémentaire, on arrête la recherche ici
				} else {
					// On réinitialise la recherche
					compteur = 0;
					bonus = 0;
				}
		}
	}
	if (compteur >= winningAlignedPawnCount) {
		// Il est possible de gagner dans cette direction
		estimation += compteur*pLiberte + bonus*pBonus + (1-Math.abs(centre/(compteur-1)-0.5))*compteur*pCentre;
	}

	// Recherche diagonale (NO-SE)
	compteur = 0;
	bonus = 0;
	i = x;
	j = y;
	start = (x-6 < 0 ? 0 : x-6);
	end = (y-6 < 0 ? 0 : y-6);
	while (i-->start && j-->end) {
		switch (grid[i][j]) {
			case 0: // Case vide
				compteur++;
				break;
			case couleur: // Jeton allié
				compteur++;
				bonus++;
				break;
			default: // Jeton adverse, on arrête de rechercher
				i = 0;
		}
	}
	centre = compteur++;
	i = x;
	j = y;
	start = (x + 6 > grid.length-1 ? grid.length-1 : x +6);
	end = (y + 6 > grid[x].length-1 ? grid[x].length - 1 : y + 6);
	while (++i<start && ++j<end) {
		switch (grid[i][j]) {
			case 0: // Case vide
				compteur++;
				break;
			case couleur: // Jeton allié
				compteur++;
				bonus++;
				break;
			default: // Jeton adverse, on arrête de rechercher
				i = grid.length;
		}
	}
	if (compteur >= winningAlignedPawnCount) {
		// Il est possible de gagner dans cette direction
		estimation += compteur*pLiberte + bonus*pBonus + (1-Math.abs(centre/(compteur-1)-0.5))*compteur*pCentre;
	}

	// Recherche diagonale (NE-SO)
	compteur = 0;
	bonus = 0;
	i = x;
	j = y;
	start = (x-6 < 0 ? 0 : x-6);
	end = (y + 6 > grid[x].length-1 ? grid[x].length - 1 : y + 6);
	while (i-->start && ++j<end) {
		switch (grid[i][j]) {
			case 0: // Case vide
				compteur++;
				break;
			case couleur: // Jeton allié
				compteur++;
				bonus++;
				break;
			default: // Jeton adverse, on arrête de rechercher
				i = 0;
		}
	}
	centre = compteur++;
	i = x;
	j = y;
	start = (x + 6 > grid.length-1 ? grid.length-1 : x +6);
	end = (y-6 < 0 ? 0 : y-6);
	while (++i<start && j-->end) {
		switch (grid[i][j]) {
			case 0: // Case vide
				compteur++;
				break;
			case couleur: // Jeton allié
				compteur++;
				bonus++;
				break;
			default: // Jeton adverse, on arrête de rechercher
				i = grid.length;
		}
	}
	if (compteur >= winningAlignedPawnCount) {
		// Il est possible de gagner dans cette direction
		estimation += compteur*pLiberte + bonus*pBonus + (1-Math.abs(centre/(compteur-1)-0.5))*compteur*pCentre;
	}

	if (depth <= 1 ) {
		// Augmente la note si nous decouvrons une tenaille dans notre coup eventuelle
		var nbTenaillesTrouve = checkTenailles(x, y, grid, 0, 0, isPlayer);
		if (nbTenaillesTrouve) {
			estimation *= (isPlayer ? nbTenaillesTrouve : nbTenaillesTrouve * 4);
			//estimation *=  (nbTenaillesTrouve+100);
		}
	}

	return estimation;
}
// ==================================================================



// ==================================================================
// Vérifie si le dernier coup créé une tenaille
// si c'est le cas, on incrémente le compteur du joueur courant
function checkTenailles(x, y, vGrille, playerScore, opponentScore, isPlayer) {
	var couleurJeton = vGrille[x][y]; 	// Couleur du jeton qui vient d'être joué
	var couleurAdv = couleurJeton%2+1;	// Couleur des jetons de l'adversaire
	var tenaillesTrouve = 0;			// Compte le nombre de tenailles créées par le coup
	for (i = -1; i <= 1; i++) {
		for (j = -1; j <= 1; j++) {
			if (!checkCoordinate(x+i, y+j, vGrille) || !checkCoordinate(x+(2*i), y+(2*j), vGrille) || !checkCoordinate(x+(3*i), y+(3*j), vGrille)) continue;
			if (JSON.stringify([vGrille[x + i][y + j], vGrille[x + (2*i)][y + (2*j)], vGrille[x + (3*i)][y + (3*j)]]) 
				== JSON.stringify([couleurAdv, couleurAdv, couleurJeton])) {
				// On est dans le cas d'une tenaille
				// On supprime les jetons pris en tenaille et on incrémente le compteur de tenailles du joueur
				vGrille[x+i][y+j] = 0;
				vGrille[x+(2*i)][y+(2*j)] = 0;
				tenaillesTrouve++;
			}
		}
	}

	// Si l'on a trouvé une tenaille, on incrémente le compteur du joueur
	if (tenaillesTrouve) return (isPlayer ? (playerScore + tenaillesTrouve) : (opponentScore + tenaillesTrouve));
	return 0;
}
// ==================================================================



// ==================================================================
// Vérifie si un coup donne la victoire au joueur
function checkWinningMove(x, y, grid, playerScore, opponentScore, isPlayer, depth) {
	var col = grid[x][y]; 	// Couleur du jeton qui vient d'être joué
	var alignH = 1; 		// Nombre de jetons alignés horizontalement
	var alignV = 1; 		// Nombre de jetons alignés verticalement
	var alignD1 = 1; 		// Nombre de jetons alignés diagonalement NO-SE
	var alignD2 = 1; 		// Nombre de jetons alignés diagonalement SO-NE
	var xt,yt;
	
	// Vérification horizontale (gauche)
	xt=x-1;
	yt=y;
	while (checkCoordinate(xt, yt, grid) && grid[xt][yt] === col) {
		xt--;
		alignH++;
	}
	// Vérification horizontale (droite)
	xt=x+1;
	yt=y;
	while (checkCoordinate(xt, yt, grid) && grid[xt][yt] === col) {
		xt++;
		alignH++;
	}
	// Vérification verticale (bas)
	xt=x;
	yt=y-1;
	while (checkCoordinate(xt, yt, grid) && grid[xt][yt] === col) {
		yt--;
		alignV++;
	}
	// Vérification verticale (haut)
	xt=x;
	yt=y+1;
	while(checkCoordinate(xt, yt, grid) && grid[xt][yt] === col){
		yt++;
		alignV++;
	}
	// Vérification diagonale (NO)
	xt=x-1;
	yt=y-1;
	while (checkCoordinate(xt, yt, grid) && grid[xt][yt] === col) {
		xt--;
		yt--;
		alignD1++;
	}
	// Vérification diagonale (SE)
	xt=x+1;
	yt=y+1;
	while (checkCoordinate(xt, yt, grid) && grid[xt][yt] === col) {
		xt++;
		yt++;
		alignD1++;
	}
	// Vérification diagonale (SO)
	xt=x-1;
	yt=y+1;
	while (checkCoordinate(xt, yt, grid) && grid[xt][yt] === col) {
		xt--;
		yt++;
		alignD2++;
	}
	// Vérification diagonale (NE)
	xt=x+1;
	yt=y-1;
	while (checkCoordinate(xt, yt, grid) && grid[xt][yt] === col) {
		xt++;
		yt--;
		alignD2++;
	}

	// Si il y a le total des tenailles alors on gagne
	//if (depth <= 1 && checkTenailles(x, y, grid, playerScore, opponentScore, isPlayer) == winningTenailleCount) return col;

	// Parmis tous ces résultats on regarde s'il y en a un qui dépasse le nombre nécessaire pour gagner
	if (Math.max(alignH, alignV, alignD1, alignD2) >= winningAlignedPawnCount) return col;
	return 0;
}
// ==================================================================



// ==================================================================
// Vérifie que les coordonnées en entrées sont bien dans la grille
function checkCoordinate(x, y, grid) {
	return x >= 0 && x < grid.length && y >= 0 && y < grid[x].length;
}
// ==================================================================