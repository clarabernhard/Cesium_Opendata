/**
* La classe Data lit le fichier de paramétrage param.json et récupère les informations pour créer l'intérieur du menu dynamiquement (toutes les couches de données) <br/>
* Elle créé ensuite les évènements liés aux couches de données
*
*/


class Data {

  /**
  * Le constructeur de la classe Data fait le lien avec la classe Globe pour pouvoir manipuler les objets et utiliser les fonctions <br/>
  * déclare le LegendManager
  *
  * @param  {Object} globe L'objet globe défini dans la classe Globe
  */
  constructor(globe){
    this.globe = globe;
    this.terrain = terrain; // format entités
    this.tileset = tileset; // format 3DTileset
    this.viewer = Globe.viewer;
    this.handler = Globe.handler;
    this.dataSources = globe.dataSources; // liste des dataSources (photomaillage, json, 3dtiles)

    this.leftPane = document.querySelector('#left-pane');
    // Créer un gestionnaire pour les légendes
    this.legendManager = new LegendManager(this.leftPane);
    globe.legendManager = this.legendManager;

  }

  /**
  * Lit le fichier param.json, créé les éléments html correspondants et associe les événements pour afficher la donnée
  *
  */
  couchesJson() {
    var params = globe.getAllUrlParams(window.location.href);
    var lectureURL = params[Object.keys(params)[0]];

    var filePath = 'src/param.json'; // donne le chemin d'accès au dossier

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('GET', filePath);
    xmlhttp.responseType = 'json';
    xmlhttp.send();


    xmlhttp.onreadystatechange = function () {
      if(xmlhttp.readyState === 4 && xmlhttp.status === 200) {

        var paramJson = xmlhttp.response;
        console.log(paramJson);

        for(let i=0;i<paramJson.menu.length;i++) {
          // ajout du menu déroulant thématique
          let boutonMenu = document.createElement('BUTTON');
          boutonMenu.classList.add('panel-title');
          boutonMenu.innerHTML = paramJson.menu[i].name;

          var space = document.createTextNode("     ");
          boutonMenu.appendChild(space);

          // et la flèche pour le dérouler
          let fleche = document.createElement('i');
          fleche.classList.add('arrow');
          boutonMenu.appendChild(fleche);

          // on l'ajoute à la div panel = contient tout le menu
          var panel = document.getElementsByClassName("panel");
          panel[0].appendChild(boutonMenu);

          // on créé la div sous le bouton (cachée par défaut) et qui va contenir les couches de données
          let couchesDiv = document.createElement('div');
          couchesDiv.classList.add('panel-content');
          couchesDiv.style.display = "none";
          panel[0].appendChild(couchesDiv);


          for(let j=0;j<paramJson.menu[i].couches.length;j++) {

            // on créé la div propre à la couche qui va contenir la checkbox et le bouton info
            let couche = document.createElement('div');
            couche.classList.add('nowrap');
            couche.classList.add('show');
            couche.style.display === "block";

            // la checkbox
            let coucheCheckbox = document.createElement("input");
            coucheCheckbox.type = "checkbox";
            coucheCheckbox.id = paramJson.menu[i].couches[j].id_data;
            coucheCheckbox.style.display === "block";

            // et le nom qu'on lui donne
            var nom = document.createElement("Label");
            nom.setAttribute("for",coucheCheckbox.id);
            nom.innerHTML = paramJson.menu[i].couches[j].name;

            couche.appendChild(coucheCheckbox);
            couche.appendChild(nom);

            var spaceBouton = document.createTextNode("     ");
            couche.appendChild(spaceBouton);

            // on créé le bouton info et le lien vers la donnée correspondante
            let lienInfo = document.createElement("a");
            lienInfo.href = paramJson.menu[i].couches[j].url_info;
            lienInfo.target = "_blank";
            let boutonInfo = document.createElement('BUTTON');
            boutonInfo.classList.add('button');
            boutonInfo.title = "Informations sur les données"
            boutonInfo.innerHTML = '<img src="src/img/icons8-info.png">';
            lienInfo.appendChild(boutonInfo);
            couche.appendChild(lienInfo);

            // Si la donnée est en temps réel, on créé un bouton actualiser
            if(paramJson.menu[i].couches[j].temps_reel === 'oui') {
              if(paramJson.menu[i].couches[j].type_donnee != 'point') {
                // premier clone pour les données temps réel
                var cloneRefresh = JSON.parse(JSON.stringify(paramJson.menu[i].couches[j].couleur_classif));
              }

              couche.appendChild(spaceBouton);

              let boutonRefresh = document.createElement('BUTTON');
              boutonRefresh.classList.add('button');
              boutonRefresh.id = paramJson.menu[i].couches[j].id_data + 'Refresh';
              boutonRefresh.title = "Rafraîchir la donnée"
              boutonRefresh.innerHTML = '<img src="src/img/icons8-synchroniser.png">';
              couche.appendChild(boutonRefresh);
            }

            // idem si la donnée est temporelle, on créé le bouton horloge pour l'animation
            if(paramJson.menu[i].couches[j].animation === 'oui') {
              couche.appendChild(spaceBouton);
              let boutonTime = document.createElement('BUTTON');
              boutonTime.classList.add('button');
              boutonTime.id = paramJson.menu[i].couches[j].id_data + 'Time';
              boutonTime.title = "Démarrer l'animation des données"
              boutonTime.innerHTML = '<img src="src/img/icons8-temps.png">';
              couche.appendChild(boutonTime);
            }

            couchesDiv.appendChild(couche);


            // on créé une variable différente unique pour chaque array de ligne de contour et de billboard
            window['line'+i+j] = [];
            window['billboard'+i+j] = [];

            // l'évenement à ajouter lorsqu'on coche la checkbox de la donnée
            coucheCheckbox.addEventListener('change', (e) => {
              // surfaces
              if(paramJson.menu[i].couches[j].type_donnee === 'surface' && paramJson.menu[i].couches[j].animation === 'non') {
                // pour les objets linéaires et surfaciques qui nécessitent une classification:
                // on clone l'objet qui contient les couleurs car Cesium modifie la structure après le passage
                // dans les fonctions show et perd ensuite la classification
                var cloneColor = JSON.parse(JSON.stringify(paramJson.menu[i].couches[j].couleur_classif));
                // On fait un 2ème clone qu'on garde en mémoire avant que le 1er ne soit modifié par la fonction showPolygon
                var cloneBis = JSON.parse(JSON.stringify(cloneColor));

                globe.showPolygon(e.target.checked, paramJson.menu[i].couches[j].id_data, paramJson.menu[i].couches[j].url_data, paramJson.menu[i].couches[j].choice, {
                  classification: true,
                  classificationField: paramJson.menu[i].couches[j].champ_classif,
                  colors: cloneColor,
                  alpha: paramJson.menu[i].couches[j].alpha,
                  choiceTableau: paramJson.menu[i].couches[j].choiceTableau,
                  line: window['line'+i+j],
                  nameLigne: paramJson.menu[i].couches[j].name_contour,
                  couleurLigne: paramJson.menu[i].couches[j].couleur_contour,
                  tailleLigne: paramJson.menu[i].couches[j].taille_contour,
                  nameLigne: paramJson.menu[i].couches[j].name_contour,
                  couleurSurf:  paramJson.menu[i].couches[j].couleur_highlight,
                  transparence: paramJson.menu[i].couches[j].alpha_highlight
                });

                // on redonne le bon format à la couleur
                cloneColor = cloneBis;

                if(paramJson.menu[i].couches[j].nom_legende !== undefined) {
                  if(e.target.checked){
                    globe.legendManager.addLegend(paramJson.menu[i].couches[j].nom_legende, paramJson.menu[i].couches[j].id_data + 'Legend', paramJson.menu[i].couches[j].couleur_legende, paramJson.menu[i].couches[j].type_donnee);
                  } else{
                    globe.legendManager.removeLegend(paramJson.menu[i].couches[j].id_data + 'Legend');
                  }
                }

                globe.viewer.scene.requestRender();
              }

              // lignes
              if(paramJson.menu[i].couches[j].type_donnee === 'ligne') {
                var cloneColor = JSON.parse(JSON.stringify(paramJson.menu[i].couches[j].couleur_classif));
                // On fait un 2ème clone qu'on garde en mémoire avant que le 1er ne soit modifié par la fonction showPolygon
                var cloneBis = JSON.parse(JSON.stringify(cloneColor));

                globe.showPolyline(e.target.checked, paramJson.menu[i].couches[j].id_data, paramJson.menu[i].couches[j].url_data, paramJson.menu[i].couches[j].ligne_2D, paramJson.menu[i].couches[j].choice, {
                  classification: true,
                  classificationField: paramJson.menu[i].couches[j].champ_classif,
                  colors: cloneColor,
                  alpha: paramJson.menu[i].couches[j].alpha,
                  epaisseur: paramJson.menu[i].couches[j].epaisseur,
                  choiceTableau: paramJson.menu[i].couches[j].choiceTableau
                });

                // on redonne le bon format à la couleur
                cloneColor = cloneBis;

                if(paramJson.menu[i].couches[j].nom_legende !== undefined) {
                  if(e.target.checked){
                    globe.legendManager.addLegend(paramJson.menu[i].couches[j].nom_legende, paramJson.menu[i].couches[j].id_data + 'Legend', paramJson.menu[i].couches[j].couleur_legende, paramJson.menu[i].couches[j].type_donnee);
                  } else{
                    globe.legendManager.removeLegend(paramJson.menu[i].couches[j].id_data + 'Legend');
                  }
                }

                globe.viewer.scene.requestRender();
              }

              // points
              if(paramJson.menu[i].couches[j].type_donnee === 'point') {
                if(paramJson.menu[i].couches[j].couche_attributaire === 'oui') {
                  globe.showPoint(e.target.checked, paramJson.menu[i].couches[j].id_data, paramJson.menu[i].couches[j].url_data, paramJson.menu[i].couches[j].url_attribut, paramJson.menu[i].couches[j].image, window['billboard'+i+j], paramJson.menu[i].couches[j].point_3D, paramJson.menu[i].couches[j].cluster, {
                    line: window['line'+i+j],
                    couleur: paramJson.menu[i].couches[j].couleur_ligne,
                    choiceTableau: paramJson.menu[i].couches[j].choiceTableau
                  });
                } else {
                  globe.showPoint(e.target.checked, paramJson.menu[i].couches[j].id_data, paramJson.menu[i].couches[j].url_data, undefined, paramJson.menu[i].couches[j].image, window['billboard'+i+j], paramJson.menu[i].couches[j].point_3D, paramJson.menu[i].couches[j].cluster, {
                    line: window['line'+i+j],
                    couleur: paramJson.menu[i].couches[j].couleur_ligne,
                    choiceTableau: paramJson.menu[i].couches[j].choiceTableau
                  });
                }

                if(paramJson.menu[i].couches[j].nom_legende !== undefined) {
                  if(e.target.checked){
                    globe.legendManager.addLegend(paramJson.menu[i].couches[j].nom_legende, paramJson.menu[i].couches[j].id_data + 'Legend', paramJson.menu[i].couches[j].couleur_legende, paramJson.menu[i].couches[j].type_donnee, paramJson.menu[i].couches[j].billboard_legende);
                  } else{
                    globe.legendManager.removeLegend(paramJson.menu[i].couches[j].id_data + 'Legend');
                  }
                }

                globe.viewer.scene.requestRender();
              }

              // données surfaciques 4D
              if(paramJson.menu[i].couches[j].type_donnee === 'surface' && paramJson.menu[i].couches[j].animation === 'oui') {
                var cloneColor = JSON.parse(JSON.stringify(paramJson.menu[i].couches[j].couleur_classif));
                // On fait un 2ème clone qu'on garde en mémoire avant que le 1er ne soit modifié par la fonction
                var cloneBis = JSON.parse(JSON.stringify(cloneColor));

                // paramètres pour l'horloge
                var today = Cesium.JulianDate.now();
                var start = Cesium.JulianDate.addDays(today, Number(paramJson.menu[i].couches[j].start), new Cesium.JulianDate());
                var end = Cesium.JulianDate.addDays(today, Number(paramJson.menu[i].couches[j].end), new Cesium.JulianDate());
                globe.viewer.clock.currentTime = end;

                globe.showTimeJson(e.target.checked, paramJson.menu[i].couches[j].id_data, paramJson.menu[i].couches[j].url_data, window['line'+i+j] , paramJson.menu[i].couches[j].choice, start, end, {
                  classification: true,
                  classificationField: paramJson.menu[i].couches[j].champ_classif,
                  colors: cloneColor,
                  alpha: paramJson.menu[i].couches[j].alpha,
                  nameLigne: paramJson.menu[i].couches[j].name_contour,
                });

                // on redonne le bon format à la couleur
                cloneColor = cloneBis;

                if(paramJson.menu[i].couches[j].nom_legende !== undefined) {
                  if(e.target.checked){
                    globe.legendManager.addLegend(paramJson.menu[i].couches[j].nom_legende, paramJson.menu[i].couches[j].id_data + 'Legend', paramJson.menu[i].couches[j].couleur_legende, paramJson.menu[i].couches[j].type_donnee);
                  } else{
                    globe.legendManager.removeLegend(paramJson.menu[i].couches[j].id_data + 'Legend');
                  }
                }

                globe.viewer.scene.requestRender();

              }

            }); // fin de l'évènement change

            // les évènements de rafraichissement de la donnée
            if(paramJson.menu[i].couches[j].type_donnee === 'surface' && paramJson.menu[i].couches[j].temps_reel === 'oui') {

              document.querySelector('#' + paramJson.menu[i].couches[j].id_data + 'Refresh').addEventListener('click', function() {
                // On fait un 2ème clone qu'on garde en mémoire avant que le 1er ne soit modifié par la fonction
                var cloneBis = JSON.parse(JSON.stringify(cloneRefresh));

                globe.showPolygon(true, paramJson.menu[i].couches[j].id_data, paramJson.menu[i].couches[j].url_data, paramJson.menu[i].couches[j].choice, window['line'+i+j], {
                  classification: true,
                  classificationField: paramJson.menu[i].couches[j].champ_classif,
                  colors: cloneRefresh,
                  alpha: paramJson.menu[i].couches[j].alpha,
                  couleurLigne: paramJson.menu[i].couches[j].couleur_contour,
                  tailleLigne: paramJson.menu[i].couches[j].taille_contour,
                  nameLigne: paramJson.menu[i].couches[j].name_contour,
                  couleurSurf:  paramJson.menu[i].couches[j].couleur_highlight,
                  transparence: paramJson.menu[i].couches[j].alpha_highlight
                });

                // on redonne le bon format à la couleur
                cloneRefresh = cloneBis;
              });
            }

            if(paramJson.menu[i].couches[j].type_donnee === 'ligne' && paramJson.menu[i].couches[j].temps_reel === 'oui') {

              document.querySelector('#' + paramJson.menu[i].couches[j].id_data + 'Refresh').addEventListener('click', function() {
                // On fait un 2ème clone qu'on garde en mémoire avant que le 1er ne soit modifié par la fonction
                var cloneBis = JSON.parse(JSON.stringify(cloneRefresh));

                globe.showPolyline(true, paramJson.menu[i].couches[j].id_data, paramJson.menu[i].couches[j].url_data, paramJson.menu[i].couches[j].ligne_2D, paramJson.menu[i].couches[j].choice, {
                  classification: true,
                  classificationField: paramJson.menu[i].couches[j].champ_classif,
                  colors: cloneRefresh,
                  alpha: paramJson.menu[i].couches[j].alpha,
                  epaisseur: paramJson.menu[i].couches[j].epaisseur
                });

                // on redonne le bon format à la couleur
                cloneRefresh = cloneBis;
              });
            }

            if(paramJson.menu[i].couches[j].type_donnee === 'point' && paramJson.menu[i].couches[j].temps_reel === 'oui' && paramJson.menu[i].couches[j].couche_attributaire === 'non') {
              document.querySelector('#' + paramJson.menu[i].couches[j].id_data + 'Refresh').addEventListener('click', function() {
                globe.updatePoint(paramJson.menu[i].couches[j].url_data, undefined, paramJson.menu[i].couches[j].id_data, paramJson.menu[i].couches[j].image, window['billboard'+i+j], paramJson.menu[i].couches[j].choice, window['line'+i+j], paramJson.menu[i].couches[j].couleur_ligne,{});
              });
            }

            if(paramJson.menu[i].couches[j].type_donnee === 'point' && paramJson.menu[i].couches[j].temps_reel === 'oui' && paramJson.menu[i].couches[j].couche_attributaire === 'oui') {
              document.querySelector('#' + paramJson.menu[i].couches[j].id_data + 'Refresh').addEventListener('click', function() {
                globe.updatePoint(paramJson.menu[i].couches[j].url_data, paramJson.menu[i].couches[j].url_attribut, paramJson.menu[i].couches[j].id_data, paramJson.menu[i].couches[j].image, window['billboard'+i+j], paramJson.menu[i].couches[j].choice, window['line'+i+j], paramJson.menu[i].couches[j].couleur_ligne,{});
              });
            }

            // lancer l'animation lorsqu'on clique sur le bouton horloge
            if(paramJson.menu[i].couches[j].type_donnee === 'surface' && paramJson.menu[i].couches[j].animation === 'oui') {
              document.querySelector('#' + paramJson.menu[i].couches[j].id_data + 'Time').addEventListener('click', function() {
                var today = Cesium.JulianDate.now();
                var start = Cesium.JulianDate.addDays(today, Number(paramJson.menu[i].couches[j].start), new Cesium.JulianDate());
                var end = Cesium.JulianDate.addDays(today, Number(paramJson.menu[i].couches[j].end), new Cesium.JulianDate());

                globe.viewer.clock.startTime = start;
                globe.viewer.clock.stopTime = end;
                globe.viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; // loop when we hit the end time
                globe.viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
                globe.viewer.clock.multiplier = 50000; // how much time to advance each tick
                globe.viewer.clock.shouldAnimate = true; // Animation on by default

              });
            }

            // ouvre la couche à l'ouverture de la page si le paramètre est dans l'url
            var minuscule = paramJson.menu[i].couches[j].id_data.toLowerCase();
            if(lectureURL === 'enable' + minuscule) {
              coucheCheckbox.checked = true;
              var action = new Event('change');
              coucheCheckbox.dispatchEvent(action); // on déclenche l'évenement associé à la couche correspondante

              // lancer l'animation si une couche temporelle est présente dans l'url
              if(paramJson.menu[i].couches[j].animation === 'oui') {
                var today = Cesium.JulianDate.now();
                var start = Cesium.JulianDate.addDays(today, Number(paramJson.menu[i].couches[j].start), new Cesium.JulianDate());
                var end = Cesium.JulianDate.addDays(today, Number(paramJson.menu[i].couches[j].end), new Cesium.JulianDate());

                globe.viewer.clock.startTime = start;
                globe.viewer.clock.stopTime = end;
                globe.viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; // loop when we hit the end time
                globe.viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
                globe.viewer.clock.multiplier = 50000; // how much time to advance each tick
                globe.viewer.clock.shouldAnimate = true; // Animation on by default

              }
            }


          } // fin du for j

          // la fonction pour ouvrir la div caché sous le menu déroulant
          boutonMenu.addEventListener('click', function() {
            boutonMenu.classList.toggle("active");
            if (couchesDiv.style.display === "block") {
              couchesDiv.style.display = "none";
            } else {
              couchesDiv.style.display = "block";
            }
          });


        } // fin du for i

      }

    }
  }

}