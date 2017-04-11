var grille = []; 
var nx = 19;
var ny = 19;
	
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
	var idJoeurParam = req.params.idJoueur;
	var code = 401;

	var idjson = recuperationInfos().id;
	var grillejson = recuperationInfos().grille;

	var jetonEnCours = grillejson[xParam, yParam];

	if(jetonEnCours != 0){
		grillejson[xParam, yParam] = idJoeurParam;	
	}
	

	res.json({
		code: code
	});
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
	res.json({ok:0});
}