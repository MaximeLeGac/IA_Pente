var grille = []; 
var nx = 19; 				// nombre de cellules en largeur
var ny = 19; 				// nombre de cellules en hauteur
var nbAligne = 5; 			// nombre de jetons à aligner pour gagner
var couleurTour = 1; 		// couleur dont c'est le tour
var continueJeu = false; 	// permet d'indiquer si le jeu est arrêté ou non
var iaProfondeurMax = 2;	// indique la profondeur de recherche de l'IA
var iaNoir = false; 		// indique si le joueur noir est une IA
var iaBlanc = true; 		// indique si le joueur blanc est une IA
var iaWorker; 				// worker gérant l'IA (si le navigateur supportent les workers)
var elemTable; 				// élément contenant les éléments d'affichage du jeu
var progressIA; 			// élément permettant d'indiquer où en est l'ordinateur
var nbCoupLimite = 30;		// nombre de coup maximum
var nbCoup1 = nbCoupLimite;	// nombre de coup disponible pour le joueur1
var nbCoup2 = nbCoupLimite;	// nombre de coup disponible pour le joueur2
var lastPlayTime; 			// Timestamp du dernier coup en secondes
var labelPlayer1 = "noir";	// nom du premier joueur
var labelPlayer2 = "blanc";	// nom du second joueur


// VOIRE POUR NOM DU JOUEUR
exports.connexion = function(req, res){
	var groupName = req.params.groupName;
	var id = genererMonId();
	var code = 401;
	if(id == 0){
		code = 200;
	}

	// Si c'est notre deusieme joueur on init notre grille
	if(recuperationInfos().nbJoueurEnCour == 2){
		initGrid();
	}

	res.json({
		idJoueur: id,
		code: code,
		nomJoueur: groupName,
		numJoueur: id
	});
}

// genere l'id du playeur
exports.genererMonId = function(){
	var monId = 0;
	// On genere l'id
	var idjson 	= recuperationInfos().id;
	var monId = idjson + 1;


	// on pense tjrs a garder notre grille
	// ainsi que le nouveaux dernier id
	var grilleTempo = recuperationInfos().grille;

	if(nbJoueurEnCourTempo > 2){
		monId = 0;
	}else{
		ecrireInfos({
			id: monId,
			grille: grilleTempo
		});
	}
	return monId;
}

exports.recuperationInfos = function(){
    var jsonRetour = fs.readFileSync("./infos.json", "UTF8");
    return JSON.parse(jsonRetour);
}

exports.ecrireInfos = function(req){
	fs.writeFileSync("./infos.json", req, "UTF-8");
}



exports.play = function(req, res){
	var xParam = req.params.x;
	var yParam = req.params.y;
	var idJoueurParam = req.params.idJoueur;
	var code = 401;

	var idjson = recuperationInfos().id;
	var grillejson = recuperationInfos().grille;

	var jetonEnCours = grillejson[xParam, yParam];


	
	if(jetonEnCours != 0){
		// Ici on evite de poser un pion par dessus un autre
		res.json({
			code: 406
		});
	}else if(idJoueurParam > 0 && idJoueurParam =< recuperationInfos().id){
		// Si un joueur n'est pas autoriser a jouer
		res.json({
			code: 401
		});
	}else if(!continueJeu){
		res.json({
			code: 406
		});
	}else if(grille[x][y]){
		res.json({
			code: 406
		});
	}else if (nbCoup1 == nbCoupLimite -1  && !((couleurTour === 1 && iaNoir) || (couleurTour === 2 && iaBlanc)) && !checkCoordinate(x, y)) {
		// Si c'est le 2e coup du premier joueur, il doit être 
		// à plus de 3 intersections du premier jeton
		res.json({
			code: 406
		});
 	}else if (Math.floor(Date.now() / 1000) - lastPlayTime > 10){
 		// Check des 10 secondes max
 		res.json({
			code: 406
		});
 	}else{
 		// OK
 		// Décrémentation du nombre de jeton du joueur
		if ((idJoueurParam === 1 && iaNoir) || (idJoueurParam === 2 && iaBlanc)) {
			nbCoup1--;
		} else {
			nbCoup2--;
		}


		lastPlayTime = Math.floor(Date.now() / 1000);
		grillejson[xParam, yParam] = idJoeurParam;
		ecrireInfos({
			id: idjson,
			grille: grillejson
		});
		res.json({
			code: 200
		});
 	}
		

}
// Vérifie si les coordonnées en entrée sont à au moins
// 3 intersections du centre du la grille

exports.checkCoordinate = function(x, y) {
	return (Math.abs(Math.trunc(nx/2) - x) > 3 || Math.abs(Math.trunc(ny/2) - y) > 3);
}

exports.initGrid = function(){
	// Initialisation de la grille
	for (var x = 0; x < nx; x++) {
		grille[x] = [];
		for (var y = 0; y < ny; y++) {
			grille[x][y] = 0;
		}
	}

	var idjson = recuperationInfos().id;
	ecrireInfos({
		id: monId,
		grille: grille
	});
}



exports.turn = function(req, res){

	// Vérifie les conditions de fin de partie : victoire ou égalité
	if (rslt = checkWinner(x, y, grid)) endGame("Vainqueur : " + (rslt === 1 ? labelPlayer1 : labelPlayer2));
	if (!canPlay(nbCoup1, nbCoup2)) endGame("Parie nulle : égalité");

	res.json({ok:0});
}