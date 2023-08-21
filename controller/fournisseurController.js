const express = require("express");
const router = express.Router();
var fournisseur = require("../models/fournisseur");
const auth = require("../middlewares/passport");
const fuzz = require("fuzzball");

// Desplay all lignes of client ...
router.post("/addFournisseur", auth, (req, res) => {
  console.log(req.body)
  var id = req.body.id;
  if (id == 0) {
    fournisseur
      .create({
        nom: req.body.nom,
        code: req.body.code,
        tva: req.body.tva,
        regionId: req.body.id_region,
        userId: req.body.id_user,
        poleId: req.body.id_pole,
        etat: 1,
      })
      .then((r) => {
        return res.status(200).send(true);
      })
      .catch((error) => {
        return res.status(403).send(false);
      });
  } else {
    fournisseur.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else { 
        fournisseur
          .update(
            {
              nom: req.body.nom,
              code: req.body.code,
              tva: req.body.tva,
              regionId: req.body.id_region,
              userId: req.body.id_user,
              poleId: req.body.id_pole,
              etat: 1,
            },
            { where: { id: id } }
          )
          .then((r2) => {
            return res.status(200).send(true);
          })
          .catch((error) => {
            return res.status(403).send(false);
          });
      }
    });
  }
});
router.post("/getActive", auth, (req, res) => {
  fournisseur.findAll({ where: { etat: 1 } }).then(function (r) {
    return res.status(200).send(r);
  });
});
router.post("/allFournisseur", auth, (req, res) => {
  fournisseur.findAll({
    order:[["id","desc"]]
  }).then(function (r) {
    return res.status(200).send(r);
  });
});

router.put("/changerEtat/:id", auth, (req, res) => {
  var id = req.params.id;
  fournisseur.findOne({ where: { id: id } }).then(function (r1) {
    var etat = 0;
    if (r1.dataValues.etat == 0) etat = 1;
    if (!r1) {
      return res.status(403).send(false);
    } else {
      fournisseur
        .update(
          {
            etat: etat,
          },
          { where: { id: id } }
        )
        .then((r2) => {
          return res.status(200).send(true);
        })
        .catch((error) => {
          return res.status(403).send(false);
        });
    }
  });
});

router.post("/getFournisseur", auth, (req, res) => {
  var id = req.headers["id"];
  fournisseur.findOne({ where: { id: id } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      return res.status(200).json(r1.dataValues);
    }
  });
});
router.post("/cheeck", auth, (req, res) => {
  var nomFournisseur = req.body.nomFournisseur;

  fournisseur.findAll({ where: { etat: 1 } }).then(function (rowsdes) {
    if (rowsdes) {
      var arrayDes = [];
      var arrayCode = [];
      var arrayDesFinal = [];
      for (i = 0; i < rowsdes.length; i++) {
        arrayDes[rowsdes[i].id] = rowsdes[i].nom; 
      }
      /* for (i = 0; i < jsondata.length; i++) { */

      if (arrayDes.indexOf(nomFournisseur) >= 0) {
        var index = arrayDes.indexOf(nomFournisseur);
        arrayDesFinal.push([nomFournisseur, 100, index]);
      } else {
        options = {
          scorer: fuzz.ratio, // Any function that takes two values and returns a score, default: ratio
          limit: 2, // Max number of top results to return, default: no limit / 0.
          cutoff: 80, // Lowest score to return, default: 0
          nsorted: false, // Results won't be sorted if true, default: false. If true limit will be ignored.
        };

        arrayDesFinal.push(fuzz.extract(nomFournisseur, arrayDes, options)[0]);
        /* } */
      }
      return res.send(arrayDesFinal);
    }
  });
});

module.exports = router;
