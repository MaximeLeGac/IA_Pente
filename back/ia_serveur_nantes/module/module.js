
var maxDepth = 2;					// Indique la profondeur de recherche de l'IA
var winningAlignedPawnCount = 5; 	// Nombre de jetons à aligner pour gagner


// ==================================================================
// Gère la réception de la grille à jour
exports.handleBoard = function(req, res) {
	var pawn = placePawn(req.body.board, req.body.player, 0, -Infinity, Infinity)
	res.json({ x: pawn[0], y: pawn[1] });
}
// ==================================================================


// ==================================================================
// Renvoi le prochain coup de l'IA
// Le placement du pion est choisi suivant l'algorithme MinMax
// complété par un élagage alpha-beta
function placePawn(grid, player, depth, alpha, beta) {
	if (depth === maxDepth) {
		// On a atteint la limite de profondeur de calcul on retourne donc une estimation de la position actuelle
		var eval = evaluate(grid, player);
		return player === 1 ? eval : -eval;
	} else {
		var best = -Infinity;	 		// Estimation du meilleur coup actuel
		var eval; 						// Estimation de la valeur d'un coup
		var currentTry = null; 			// Meilleur coup actuel

		// On parcourt la grille pour tester toutes les combinaisons possibles
		for (var x = 0; x < grid.length; x++) {
			for (var y = 0; y < grid[x].length; y++) {

				// Case déjà occupée
				if (grid[x][y]) continue;

				// Initialisation du premier coup
				if (!currentTry) currentTry = [x,y];

				// On vérifie si le coup est gagnant
				grid[x][y] = player;
				if (eval = checkWinningMove(x, y, grid)) {
					// Restauration de la grille
					grid[x][y] = 0;
					if (!depth) return [x,y];
					return Infinity;
				}

				// Estimation du coup en cours
				eval = -placePawn(grid, player%2+1, depth+1, -beta, -alpha);
				if (eval > best) {
					// on vient de trouver un meilleur coup
					best = eval;
					if (best > alpha) {
						alpha = best;
						currentTry = [x,y];
						if (alpha >= beta) {
							/*ce coup est mieux que le meilleur des coups qui aurait pu être joué si on avait joué un autre
							coup. Cela signifie que jouer le coup qui a amené cette position n'est pas bon. Il est inutile
							de continuer à estimer les autres possibilités de cette position (principe de l'élagage alpha-beta). */
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
function evaluate(grid, currentPlayer) {
	// Estimation globale de la position
	var eval = 0;
	for (var x = 0; x < grid.length; x++) {
		for (var y = 0; y < grid[x].length; y++) {
			if (!grid[x][y]) continue;
			// Estimation de la valeur de ce jeton et ajout au calcul d'estimation global
			if (grid[x][y] == currentPlayer) {
				eval += getAnalysis(grid, x, y);
			}
			else {
				eval -= getAnalysis(grid, x, y);
			}
		}
	}
	return eval;
}
// ==================================================================


// ==================================================================
// Permet de calculer le nombre de "libertés" pour la case donnée
function getAnalysis(grid, x, y) {
	var couleur = grid[x][y];
	var estimation = 0; // estimation pour toutes les directions
	var compteur = 0; 	// compte le nombre de possibilités pour une direction
	var centre = 0; 	// regarde si le jeton a de l'espace de chaque côté
	var bonus = 0; 		// point bonus liée aux jetons alliés dans cette même direction
	var i,j; 			// pour les coordonnées temporaires
	var pass = false; 	// permet de voir si on a passé la case étudiée
	var pLiberte = 1; 	// pondération sur le nombre de liberté
	var pBonus = 1; 	// pondération Bonus
	var pCentre = 2; 	// pondération pour l'espace situé de chaque côté

	// Recherche horizontale
	for (i = 0; i < grid.length; i++) {
		if (i == x) {
			centre = compteur++;
			pass = true;
			continue;
		}
		switch (grid[i][y]) {
			case 0: // case vide
				compteur++;
				break;
			case couleur: // jeton allié
				compteur++;
				bonus++;
				break;
			default: // jeton adverse
				if (pass) {
					i = grid.length; //il n'y aura plus de liberté supplémentaire, on arrête la recherche ici
				} else {
					// on réinitialise la recherche
					compteur = 0;
					bonus = 0;
				}
		}
	}
	if (compteur >= winningAlignedPawnCount) {
		// Il est possible de gagner dans cette direction
		estimation += compteur*pLiberte + bonus*pBonus + (1-Math.abs(centre/(compteur-1)-0.5))*compteur*pCentre;
	}

	// Recherche verticale
	compteur = 0;
	bonus = 0;
	pass = false;
	for (j = 0; j < grid[x].length; j++) {
		if (j == y) {
			centre = compteur++;
			pass = true;
			continue;
		}
		switch (grid[x][j]) {
			case 0: // case vide
				compteur++;
				break;
			case couleur: // jeton allié
				compteur++;
				bonus++;
				break;
			default: // jeton adverse
				if (pass) {
					j = grid[x].length; // il n'y aura plus de liberté supplémentaire, on arrête la recherche ici
				} else {
					// on réinitialise la recherche
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
	while (i-->0 && j-->0) {
		switch (grid[i][j]) {
			case 0: // case vide
				compteur++;
				break;
			case couleur: // jeton allié
				compteur++;
				bonus++;
				break;
			default: // jeton adverse, on arrête de rechercher
				i = 0;
		}
	}
	centre = compteur++;
	i = x;
	j = y;
	while (++i<grid.length && ++j<grid[x].length) {
		switch (grid[i][j]) {
			case 0: // case vide
				compteur++;
				break;
			case couleur: // jeton allié
				compteur++;
				bonus++;
				break;
			default: // jeton adverse, on arrête de rechercher
				i = grid.length;
		}
	}
	if (compteur >= winningAlignedPawnCount) {
		// il est possible de gagner dans cette direction
		estimation += compteur*pLiberte + bonus*pBonus + (1-Math.abs(centre/(compteur-1)-0.5))*compteur*pCentre;
	}

	// Recherche diagonale (NE-SO)
	compteur = 0;
	bonus = 0;
	i = x;
	j = y;
	while (i-->0 && ++j<grid[x].length) {
		switch (grid[i][j]) {
			case 0: // case vide
				compteur++;
				break;
			case couleur: // jeton allié
				compteur++;
				bonus++;
				break;
			default: // jeton adverse, on arrête de rechercher
				i = 0;
		}
	}
	centre = compteur++;
	i = x;
	j = y;
	while (++i<grid.length && j-->0) {
		switch (grid[i][j]) {
			case 0: // case vide
				compteur++;
				break;
			case couleur: // jeton allié
				compteur++;
				bonus++;
				break;
			default: // jeton adverse, on arrête de rechercher
				i = grid.length;
		}
	}
	if (compteur >= winningAlignedPawnCount) {
		// Il est possible de gagner dans cette direction
		estimation += compteur*pLiberte + bonus*pBonus + (1-Math.abs(centre/(compteur-1)-0.5))*compteur*pCentre;
	}

	return estimation;
}
// ==================================================================


// ==================================================================
// Vérifie si un coup donne la victoire au joueur
function checkWinningMove(x, y, grid) {
	var col = grid[x][y]; 		// Couleur du jeton qui vient d'être joué
	var alignH = 1; 			// Nombre de jetons alignés horizontalement
	var alignV = 1; 			// Nombre de jetons alignés verticalement
	var alignD1 = 1; 			// Nombre de jetons alignés diagonalement NO-SE
	var alignD2 = 1; 			// Nombre de jetons alignés diagonalement SO-NE
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