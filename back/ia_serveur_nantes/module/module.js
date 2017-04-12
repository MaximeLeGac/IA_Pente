
var maxDepth = 2;					// Indique la profondeur de recherche de l'IA
var winningAlignedPawnCount = 5; 	// Nombre de jetons à aligner pour gagner
var winningTenailleCount = 5;



// ==================================================================
// Gère la réception de la grille et la prochain coup de l'IA
exports.handleBoard = function(req, res) {
	// Récupération des données du service
	var board 			= req.body.board;
	var currentPlayer 	= req.body.player;
	var playerScore 	= req.body.score;
	var opponentScore 	= req.body.score_vs;
	var currentRound 	= req.body.round;

	// Calcul du prochain coup
	var pawn = placePawn(board, currentPlayer, 0, -Infinity, Infinity, currentRound, playerScore);

	// Envoi du pion au client
	res.json({ x: pawn[0], y: pawn[1] });
}
// ==================================================================




// ==================================================================
// Renvoi le prochain coup de l'IA
// Le placement du pion est choisi suivant l'algorithme MinMax
// complété par un élagage alpha-beta
function placePawn(grid, player, depth, alpha, beta, currentRound, playerScore) {
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

				// On vérifie que pour le 2e pion du joueur est à plus de 3 intersections de son premier jeton
				if (currentRound == 3 && Math.abs(Math.trunc(grid.length/2) - x) <= 3 && Math.abs(Math.trunc(grid[x].length/2) - y) <= 3) continue;

				// Case déjà occupée
				if (grid[x][y]) continue;

				// Initialisation du premier coup
				if (!currentTry) currentTry = [x,y];

				// On vérifie si le coup est gagnant
				grid[x][y] = player;
				if (eval = checkWinningMove(x, y, grid, playerScore)) {
					// Restauration de la grille
					grid[x][y] = 0;
					if (!depth) return [x,y];
					return Infinity;
				}

				// Estimation du coup en cours
				eval = -placePawn(grid, player%2+1, depth+1, -beta, -alpha, currentRound, playerScore);
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

	// Augmente la note si nous decouvrons une tenaille dans notre coup eventuelle
	if (checkTenailles > 0) {
		estimation = estimation * (checkTenailles+1)
	}

	return estimation;
}
// ==================================================================

// Vérifie si le dernier coup créé une tenaille
// si c'est le cas, on incrémente le compteur du joueur courant
function checkTenailles(x, y, vGrille) {
	var couleurJeton = vGrille[x][y]; 	// couleur du jeton qui vient d'être joué
	var couleurAdv;						// couleur des jetons de l'adversaire
	var compteurJetonsAdv = 0; 			// compteur permettant de savoir combien de jetons adverses se trouvent entre deux jetons du joueur courant
	var tenaillesTrouve = 0;			// booléen permettant de savoir si le coup à créé une tenaille
	var stopRecherche = false;
	var xt,yt;

	if (couleurJeton == 1) {
		couleurAdv = 2;
	} else {
		couleurAdv = 1;
	}

	for (i = -1; i <= 1; i++) {
		for (j = -1; j <= 1; j++) {
			if ((0 > x+i) || (x+i > 18) || (0 > y+j) || (y+j > 18)
				|| (0 > x+(2*i)) || (x+(2*i) > 18) || (0 > y+(2*j)) || (y+(2*j) > 18)
				|| (0 > x+(3*i)) || (x+(3*i) > 18) || (0 > y+(3*j)) || (y+(3*j) > 18)) {
				continue;
			}

			if (vGrille[x + i][y + j] === couleurAdv) {
				if (vGrille[x + (2*i)][y + (2*j)] === couleurAdv) {
					if (vGrille[x + (3*i)][y + (3*j)] === couleurJeton) {
						// On est dans le cas d'une tenaille
						// On supprime les jetons pris en tenaille et on incrémente le compteur de tenailles du joueur
						vGrille[x+i][y+j] = 0;
						vGrille[x+(2*i)][y+(2*j)] = 0;
						
						document.getElementById("grid_"+(x+i)+"_"+(y+j)).className = "no-color";
						document.getElementById("grid_"+(x+(2*i))+"_"+(y+(2*j))).className = "no-color";

						tenaillesTrouve++;
					}
				}
			}
		}
	}

	// Si on a trouvé une tenaille, on incrémente le compteur du joueur
	if (tenaillesTrouve != 0) {
		if (couleurTour === 1) {
			nbTenailles1 += tenaillesTrouve;
		} else {
			nbTenailles2 += tenaillesTrouve;
		}
	}

	return tenaillesTrouve;
}

// ==================================================================
// Vérifie si un coup donne la victoire au joueur
function checkWinningMove(x, y, grid, playerScore) {
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

	// Si il y a le total des tenailles alors on gagne
	if(checkTenailles(x, y, grid) == winningTenailleCount){
		return col;
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