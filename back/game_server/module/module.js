

exports.connexion = function(req, res){
	var groupName = req.params.groupName;
	var id = genererMonId();
	var code = 401;
	if(id == 0){
		code = 200;
	}

	res.json({
		idJoueur: id,
		code: code,
		nomJoueur: groupName
	});

}


exports.genererMonId = function(){
	var monId = 0;

	// On genere l'id
	var idjson 	= recuperationInfos().id;
	var monId = idjson + 1;


	// ici donc on ajoute une infos pour dire que nous avons un joueur dans la partie 
	// ainsi que le nouveaux dernier id
	var nbJoueurEnCourTempo = recuperationInfos().nbJoueurEnCour;
	if(nbJoueurEnCourTempo >= 2){
		return 0;
	}else{
		ecrireInfos({
			id: monId, 
			nbJoueurEnCour: nbJoueurEnCourTempo + 1 
		});
		return monId;
	}
	
}

exports.recuperationInfos = function(){
    var jsonRetour = fs.readFileSync("./infos.json", "UTF8");
    return JSON.parse(jsonRetour);
}

exports.ecrireInfos = function(req){
	fs.writeFileSync("./infos.json", req, "UTF-8");
}