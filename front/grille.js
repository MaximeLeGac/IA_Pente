var nx = 19; 				// nombre de cellules en largeur
var ny = 19; 				// nombre de cellules en hauteur
var nbAligne = 5; 			// nombre de jetons à aligner pour gagner
var couleurTour = 1; 		// couleur dont c'est le tour
var continueJeu = false; 	// permet d'indiquer si le jeu est arrêté ou non

var iaProfondeurMax = 2;	// indique la profondeur de recherche de l'IA
var iaNoir = false; 		// indique si le joueur noir est une IA
var iaBlanc = true; 		// indique si le joueur blanc est une IA

var grille = []; 			// grille du jeu
var iaWorker; 				// worker gérant l'IA (si le navigateur supportent les workers)

var elemTable; 				// élément contenant les éléments d'affichage du jeu
var elemIA; 				// élément indiquant que l'ordinateur réfléchi
var progressIA; 			// élément permettant d'indiquer où en est l'ordinateur
var limiteCoup = 30;
var nbCoup1 = limiteCoup;	// nombre de coup disponible pour le joueur
var nbCoup2 = limiteCoup;	// nombre de coup disponible pour le joueur
var lastPlayTime; 			// en secondes

window.addEventListener("load", init, false);

// Initialisation d'une partie
function init() {

	// Initialisation de la grille
	for (var x = 0; x < nx; x++) {
		grille[x] = [];
		for (var y = 0; y < ny; y++) {
			grille[x][y] = 0;
		}
	}

	// Suppression de la grille précédente dans le DOM
	if(elemTable) {
		document.body.removeChild(elemTable);
	}

	// Affichage de la grille de jeu
	elemTable = document.createElement("table");
	var row,cel;
	for (y = 0; y < ny; y++) {
		row = elemTable.insertRow(-1);
		for (x = 0; x < nx; x++) {
			cel = row.insertCell(-1);
			cel.id = "grille"+x+"_"+y;
			cel.onclick = setClick(x,y);
			switch (grille[x][y]) {
				case 1:
					cel.className = "noir";
					break;
				case 2:
					cel.className = "blanc";
					break;
				case 0:
				default:
					cel.className = "empty";
			}
		}
	}
	document.body.appendChild(elemTable);
	couleurTour = 1;
	continueJeu = true;

	// Force le premier joueur à placer au milieu
	joue(Math.trunc(nx/2), Math.trunc(ny/2));
	lastPlayTime = Math.floor(Date.now() / 1000);
	// On vérifie si c'est au tour de l'IA de jouer
	iaToPlay(); 
};

//permet de changer la couleur lors d'un coup
function changeCouleur(x, y) {
	grille[x][y] = couleurTour;
	var elem = document.getElementById("grille"+x+"_"+y);
	if (elem) {
		elem.className = couleurTour === 1 ? "noir" : "blanc";
	}
}

// permet de jouer un coup en x,y
function joue(x, y) {
	// Le joueur a 10 secondes pour jouer
	if (Math.floor(Date.now() / 1000) - lastPlayTime > 10) {
		alert("Votre temps de jeu est dépassé");
		couleurTour = couleurTour%2+1;
		lastPlayTime = Math.floor(Date.now() / 1000);
		iaToPlay();
	}

	// Si c'est le 2e coup du premier joueur, il doit être à plus de
	// 3 intersections du premier jeton
	if (nbCoup1 == limiteCoup -1  && !((couleurTour === 1 && iaNoir) || (couleurTour === 2 && iaBlanc)) && !checkCoordinate(x, y)) {
		alert("Vous devez jouer à plus de 3 intersections de votre premier jeton !");
		return false;
 	}

	if (!continueJeu) return false;
	if (grille[x][y]) return false;
	var rslt;
	changeCouleur(x, y);
	couleurTour = couleurTour%2+1;

	if (rslt = verifVainqueur(x,y)) {
		continueJeu = false;
		alert("Vainqueur : " + (rslt === 1 ? "Noir" : "Blanc"));
		init();
	}

	if (!verifNbLibre() || (nbCoup1 == 0 && nbCoup2 == 0)) {
		continueJeu = false;
		alert("Parie nulle : égalité");
		init();
	}

	if ((couleurTour === 1 && iaNoir) || (couleurTour === 2 && iaBlanc)) {
		nbCoup1--;
	} else {
		nbCoup2--;
	}
	lastPlayTime = Math.floor(Date.now() / 1000);
	iaToPlay();

}

// Vérifie si les coordonnées en entrée sont à au moins
// 3 intersections du centre du la grille
function checkCoordinate(x, y) {
	var refX = Math.trunc(nx/2);
	var refY = Math.trunc(ny/2);
	return (Math.abs(refX - x) > 3 || Math.abs(refY - y) > 3);
}

// est-ce que le prochain coup doit être joué par l'IA ?
function iaToPlay() {
	if (!continueJeu) return false;

	// On vérifie si c'est le tour de l'IA
	if ((couleurTour === 1 && iaNoir) || (couleurTour === 2 && iaBlanc)) {
		// Pour empêcher un humain de jouer
		continueJeu = false;
		setTimeout(function(){
			var rslt = iaJoue(grille, couleurTour);
			continueJeu = true;
			joue(rslt[0], rslt[1]);
		}, 10); // Au cas où deux ordi jouent ensemble et pour voir le coup pendant que l'IA réfléchit
	}
}

//permet de créer une fonction listener sur un élément x,y
function setClick(x, y) {
	return function(){
		joue(x,y);
	};
}

//permet de vérifier s'il reste des coups jouables
function verifNbLibre() {
	var nbLibre = 0;
	for (var x = 0; x < nx; x++) {
		for (var y = 0; y < ny; y++) {
			if (grille[x][y] === 0) {
				nbLibre++;
			}
		}
	}
	return nbLibre;
}

//permet de vérifier s'il y a un vainqueur (en ne regardant que le dernier coup joué)
function verifVainqueur(x, y, vGrille) {
	vGrille = vGrille || grille;
	var col = vGrille[x][y]; //couleur du jeton qui vient d'être joué
	var alignH = 1; 	//nombre de jetons alignés horizontalement
	var alignV = 1; 	//nombre de jetons alignés verticalement
	var alignD1 = 1; 	//nombre de jetons alignés diagonalement NO-SE
	var alignD2 = 1; 	//nombre de jetons alignés diagonalement SO-NE
	var xt,yt;

	//vérification horizontale
	xt=x-1;
	yt=y;
	while (xt >= 0 && vGrille[xt][yt] === col) {
		xt--;
		alignH++;
	}
	xt=x+1;
	yt=y;
	while (xt < nx && vGrille[xt][yt] === col) {
		xt++;
		alignH++;
	}

	//vérification verticale
	xt=x;
	yt=y-1;
	while (yt >= 0 && vGrille[xt][yt] === col) {
		yt--;
		alignV++;
	}
	xt=x;
	yt=y+1;
	while(yt < ny && vGrille[xt][yt] === col){
		yt++;
		alignV++;
	}

	//vérification diagonale NO-SE
	xt=x-1;
	yt=y-1;
	while (xt >= 0 && yt >= 0 && vGrille[xt][yt] === col) {
		xt--;
		yt--;
		alignD1++;
	}
	xt=x+1;
	yt=y+1;
	while (xt < nx && yt < ny && vGrille[xt][yt] === col) {
		xt++;
		yt++;
		alignD1++;
	}

	//vérification diagonale SO-NE
	xt=x-1;
	yt=y+1;
	while (xt >= 0 && yt < ny && vGrille[xt][yt] === col) {
		xt--;
		yt++;
		alignD2++;
	}
	xt=x+1;
	yt=y-1;
	while (xt < nx && yt >= 0 && vGrille[xt][yt] === col) {
		xt++;
		yt--;
		alignD2++;
	}

	//parmis tous ces résultats on regarde s'il y en a un qui dépasse le nombre nécessaire pour gagner
	if (Math.max(alignH, alignV, alignD1, alignD2) >= nbAligne) {
		return col;
	}
	return 0;
}