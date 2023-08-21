const express = require("express");
const router = express.Router();
var produit = require("../models/produit");
var ligne_veille = require("../models/ligne_veilles");
var produitconcurent = require("../models/marche_concurent");
var LigneReleveMedical = require("../models/ligne_releve_medical");
var veille = require("../models/veille");

const jwt = require("jsonwebtoken");
const privateKey = "mySecretKeyabs";
var bcrypt = require("bcrypt");
const auth = require("../middlewares/passport");
const ReleveMedical = require("../models/releveMedical");

router.post("/getProduitsByMarche", (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var id = decoded.userauth.id;
  LigneReleveMedical.findAll({
    include: [
      {
        model: produit,
        as: "produits",
        where: { etat: 1 },
      },
      {
        model: ReleveMedical,
        as: "releves_medicals",
        where: { id_delegue: id , annee : req.body.annee , id_fournisseur : req.body.id_fournisseur , mois : parseInt(req.body.mois) },
      },
    ],
  })
    .then(function (r) {
      var obj = {};
      var objprod = {};
      if (r.length > 0) {
        r.forEach((element) => {
          if (!objprod[element.produits.dataValues.desigims])
            objprod[element.produits.dataValues.desigims] = [];
          var stock = 0;
          var vente = 0;
          if (element.dataValues.type == 1) stock = element.dataValues.mesure;
          else {
            vente = element.dataValues.mesure;
          }
          if (
            objprod[element.dataValues.produits.desigims][
              element.dataValues.produits.id
            ]
          ) {
            if (element.dataValues.type == 1)
              objprod[element.dataValues.produits.desigims][
                element.dataValues.produits.id
              ].stock = stock;
            else
              objprod[element.dataValues.produits.desigims][
                element.dataValues.produits.id
              ].vente = vente;
          } else {
            objprod[element.dataValues.produits.desigims][
              element.dataValues.produits.id
            ] = {
              id_produit: element.dataValues.produits.id,
              nom_produit: element.dataValues.produits.designation,
              type: 1,
              stock: stock,
              vente: vente,
              id_marche: element.dataValues.produits.desigims,
            };
          }
        });
        //
        for (const key in objprod) {
          var element = objprod[key];
          for (const k in element) {
            var element1 = element[k];
            if (element1) {
              if (!obj[element.id_marche]) obj[element1.id_marche] = [];
              obj[key].push({
                id_produit: element1.id_produit,
                nom_produit: element1.nom_produit,
                type: element1.type,
                stock: element1.stock,
                vente: element1.vente,
                id_marche: element1.id_marche,
              });
            }
          }
        }
      }
      produitconcurent
        .findAll({ where: { etat: 1 } })
        .then(function (r1) {
          if (r.length > 0) {
            r1.forEach((element) => {
              if (obj[element.dataValues.id_marche]) {
                obj[element.dataValues.id_marche].push({
                  id_produit: element.dataValues.id,
                  nom_produit: element.dataValues.designation,
                  type: 2,
                  stock: 0,
                  vente: 0,
                  id_marche: element.dataValues.desigims,
                });
              }
            });
          }

          return res.status(200).send(obj);
        })
        .catch((error) => {
          return res.status(403).send(error);
        });
    })
    .catch((error) => {
      return res.status(403).send(error);
    });
});

router.post("/addVeille", auth, (req, res) => {
  var titre = req.body.titre;
  var annee = req.body.annee;
  var mois = req.body.mois.value;
  var fournisseur = req.body.id_fournisseur;
  var ligneveille = req.body.ligneVeille;
  var lignesV = Object.values(ligneveille);

  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var id = decoded.userauth.id;

  veille
    .create({
      titre: titre,
      mois: mois,
      annee: annee,
      idUser: id,
      fournisseur : fournisseur ,

    })
    .then((p) => {
      var array = [];

      for (let i = 0; i < lignesV.length; i++) {
        const objArray = lignesV[i];

        for (let j = 0; j < objArray.length; j++) {
          var objet = objArray[j];
          if (objet.type == 2) {
            var idProduit = objet.id_produit;
            var stock = objet.stock;
            var vente = objet.vente;
            array.push({
              id_veille: p.dataValues.id,
              id_concurent: idProduit,
              stock: stock,
              vente: vente,
            });
          }
        }
      }
    
      ligne_veille.bulkCreate(array).then(() => {
        return res.status(200).send(true);
      });
    })
    .catch(() => {
      return res.status(403).send(false);
    });
});

// all itm grossiste
router.post("/allVeille", auth, (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var id = decoded.userauth.id;
  var annee = req.body.annee;
  var whereL = { annee: annee, idUser: id };
  veille
    .findAll({
      where: whereL,
    })
    .then(function (r) {
      return res.status(200).send(r);
    });
});

router.delete("/delete/:id", auth, async (req, res) => {
  var id = req.params.id;
  var veilleFind = await veille.findOne({ where: { id: req.params.id } });

  if (veilleFind != null) {
    veille
      .destroy({ where: { id: id } })
      .then((r2) => {
        return res.status(200).send(true);
      })
      .catch((error) => {
        return res.status(403).send(false);
      });
  }
});

module.exports = router;
