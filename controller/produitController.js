const express = require("express");
const router = express.Router();
var produit = require("../models/produit");
var produitfour = require("../models/produitfour");
var notification = require("../models/notification");
var user = require("../models/user");
const auth = require("../middlewares/passport");
const fuzz = require("fuzzball");
const { Op } = require("sequelize");
var Sequelize = require("sequelize");
var configuration = require("../config");
const sequelize = new Sequelize(
  configuration.connection.base,
  configuration.connection.root,
  configuration.connection.password,
  {
    host: configuration.connection.host,
    port: configuration.connection.port,
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    operatorsAliases: false,
  }
);

// Desplay all lignes of client ...
router.post("/addProduit", auth, (req, res) => {
  var id = req.body.id;
  /** 0-type 0 AMM - 1-type 1 AMC **/
  if (id == 0) {
    produit
      .create({
        designation: req.body.designation,
        code: req.body.code,
        prix: req.body.prix,
        prixConseiller: req.body.prixConseiller,
        desigims: req.body.desigims,
        ligne: req.body.ligne,
        direct: req.body.direct,
        type: req.body.type,
        code_pf: req.body.codePf,
        code_lbr: req.body.codeLbr,
        bi: req.body.bi,
        lbr: req.body.lbr,
        etat: 1,
        produit_ims: req.body.produit_ims,
      })
      .then((r) => {
        var idInsert =
          req.body.produitSelect.value == 0
            ? r.id
            : req.body.produitSelect.value;
        produit.update(
          {
            parent: idInsert,
          },
          { where: { id: r.id } }
        );
        return res.status(200).send(true);
        /* return res.status(200).send(r); */
      })
      .catch((error) => {
        return res.status(403).send(false);
      });
  } else {
    produit.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        produit
          .update(
            {
              designation: req.body.designation,
              code: req.body.code,
              prix: req.body.prix,
              prixConseiller: req.body.prixConseiller,
              desigims: req.body.desigims,
              ligne: req.body.ligne,
              parent: req.body.produitSelect.value,
              direct: req.body.direct,
              type: req.body.type,
              code_pf: req.body.codePf,
              code_lbr: req.body.codeLbr,
              bi: req.body.bi,
              lbr: req.body.lbr,
              etat: 1,
              produit_ims: req.body.produit_ims,
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

router.post("/allProduit", auth, (req, res) => {
  produit.findAll({ order: [["id", "desc"]] }).then(function (prod) {
    var array = [];
    prod.forEach((element) => {
      if (element.dataValues.id == element.dataValues.parent) {
        array.push(element);
      }
    });
    return res.status(200).send(array);
  });
});

router.post("/getActive", auth, (req, res) => {
  produit
    .findAll({ where: { etat: 1 }, include: ["marcheims", "ligneims"] })
    .then(function (prod) {
      var array = [];
      prod.forEach((element) => {
        if (element.dataValues.id == element.dataValues.parent) {
          array.push(element);
        }
      });
      return res.status(200).send(array);
    });
});

//get produit lbr
router.post("/getProduitLbr", auth, (req, res) => {
  produit
    .findAll({ where: { etat: 1, lbr: 1 }, include: ["marcheims", "ligneims"] })
    .then(function (prod) {
      var array = [];
      prod.forEach((element) => {
        if (element.dataValues.id == element.dataValues.parent) {
          array.push(element);
        }
      });
      return res.status(200).send(array);
    });
});

//get produit parent
router.post("/getParent", auth, (req, res) => {
  produit.findAll({ include: ["marcheims", "ligneims"] }).then(function (prod) {
    var array = [];
    prod.forEach((element) => {
      if (element.dataValues.id == element.dataValues.parent) {
        array.push(element);
      }
    });
    return res.status(200).send(array);
  });
});

router.put("/changeEtat/:id", auth, (req, res) => {
  var id = req.params.id;
  produit.findOne({ where: { id: id } }).then(function (r1) {
    var etat = 0;
    if (r1.dataValues.etat == 0) etat = 1;
    if (!r1) {
      return res.status(403).send(false);
    } else {
      produit
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
router.post("/getProduit", auth, (req, res) => {
  var id = req.headers["id"];
  produit.findOne({ where: { id: id } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      return res.status(200).json(r1.dataValues);
    }
  });
});
function cheeck(des) {
  return new Promise((resolve, reject) => {
    produitfour
      .findAll({ where: { designation: des } })
      .then(function (results) {
        return resolve(results);
      })
      .catch((error) => {
        return reject(error);
      });
  });
}

//verifier produit si existe avec sa designation/code
router.post("/cheeckProduit", auth, async (req, res) => {
  var jsondata = req.body;
  produit.findAll({ where: { etat: 1 } }).then(async function (rowsdes) {
    if (!rowsdes) {
      return res.status(403).send(false);
    } else {
      var arrayDes = [];
      var arrayId = [];
      var arrayCode = [];
      var arrayDesFinal = [];
      var notif = 0;
      for (i = 0; i < rowsdes.length; i++) {
        arrayDes[rowsdes[i].id] = rowsdes[i].dataValues.designation
          .trim()
          .toLowerCase();
        arrayCode[rowsdes[i].id] = rowsdes[i].dataValues.code;
        arrayId[rowsdes[i].id] = rowsdes[i].dataValues.parent;
      }
      /* for (i = 0; i < jsondata.length; i++) { */
       
      for (const i in jsondata) {
        if (
          jsondata[i].Code != "" &&
          jsondata[i].Code != null &&
          arrayCode.indexOf(jsondata[i].Code.toString()) >= 0
        ) {
          var index = arrayCode.indexOf(jsondata[i].Code.toString());
          var idParent = arrayId[index];
          if (arrayCode.indexOf(jsondata[i].Code.toString()) >= 0)
            arrayDesFinal.push([
              arrayDes[index].toUpperCase(),
              100,
              idParent,
            ]);
          /* arrayDesFinal.push([arrayDes[index].toUpperCase(),100,index]); */
        } else {
          if (
            jsondata[i].Designation != "" &&
            jsondata[i].Designation != null &&
            arrayDes.indexOf(jsondata[i].Designation.toLowerCase()) >= 0
          ) {
            var index = arrayDes.indexOf(jsondata[i].Designation.toLowerCase());
            var idParent = arrayId[index];
            /* arrayDesFinal.push([jsondata[i].Designation.toUpperCase(),100,index]); */
            arrayDesFinal.push([
              jsondata[i].Designation.toUpperCase(),
              100,
              idParent,
            ]);
          } else {
            if (jsondata[i].Code != null || jsondata[i].Designation != null) {
              options = {
                scorer: fuzz.ratio, // Any function that takes two values and returns a score, default: ratio
                limit: 2, // Max number of top results to return, default: no limit / 0.
                cutoff: 91, // Lowest score to return, default: 0
                nsorted: false, // Results won't be sorted if true, default: false. If true limit will be ignored.
              };
              var arrayScore = fuzz.extract(
                jsondata[i].Designation.toLowerCase().trim(),
                arrayDes,
                options
              )[0];
              if (arrayScore) {
                arrayScore[2] = arrayId[arrayScore[2]];
              }
              arrayDesFinal.push(arrayScore);
              //insertion produit fournisseur
              if (
                arrayScore == undefined &&
                jsondata[i].Designation != "" &&
                jsondata[i].Designation != " " &&
                jsondata[i].Designation != "DESIGNATION" &&
                jsondata[i].Designation != "Désignation"
              ) {
                var des = jsondata[i].Designation;
                var four = jsondata[i].Fournisseur;
                var admin = await user.findOne({ where: { idrole: 0 } });
                if (notif == 0) {
                  notification.create({
                    id_user: admin.dataValues.id,
                    etat: 4,
                    text: "Nouveau produit ",
                  });
                }
                notif++;
                var findDes = await produitfour.findOne({
                  where: { designation: jsondata[i].Designation },
                });
                if (findDes == null) {
                  produitfour.create({
                    designation: des,
                    fournisseur: four,
                  });
                }
              }
            }
          }
        }
      }
      return res.send(arrayDesFinal);
    }
  });
});
router.post("/getPrixProduit", auth, async (req, res) => {
  var arrayBody = req.body.arrayBody;
  var arrayFinal = [];
  var som = 0;
  for (const key in arrayBody) {
    var arrayProd = arrayBody[key];
    if (arrayBody[key].idProduit != null) {
      var prodFind = await produit.findOne({
        where: { id: arrayProd.idProduit },
      });
      if (prodFind.dataValues.code != "") {
        arrayProd.Prix = prodFind.dataValues.prix.toFixed(3);
        var mnt =
          parseFloat(prodFind.dataValues.prix) * parseFloat(arrayProd.Quantite);
        arrayProd.Montant = mnt.toFixed(3);
        som += parseFloat(arrayProd.Montant);
      } else {
        var mnt =
          parseFloat(arrayProd.Prix).toFixed(3) *
          parseFloat(arrayProd.Quantite);
        arrayProd.Montant = mnt.toFixed(3);
        som += parseFloat(arrayProd.Montant);
      }
      arrayFinal.push(arrayProd);
    } else {
      var mnt =
        parseFloat(arrayProd.Prix).toFixed(3) * parseFloat(arrayProd.Quantite);
      arrayProd.Montant = mnt.toFixed(3);
      som += parseFloat(arrayProd.Montant);
      arrayFinal.push(arrayProd);
    }
  }
  return res.status(200).json({ arrayBody: arrayFinal, som: som });
});
router.post("/getProduitFour", auth, (req, res) => {
  produitfour.findAll({ order: [["id", "desc"]] }).then(function (r) {
    return res.status(200).send(r);
  });
});
router.delete("/delete/:id", auth, (req, res) => {
  var id = req.params.id;
  produitfour.findOne({ where: { id: id } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      produitfour
        .destroy({ where: { id: id } })
        .then((r2) => {
          return res.status(200).send(true);
        })
        .catch((error) => {
          return res.status(403).send(false);
        });
    }
  });
});

//verif code produit
router.post("/verifCode", auth, (req, res) => {
  return res.status(200).json(false);
  var id = req.body.id;
  var code = req.body.code;
  var codePf = req.body.codePf;
  var parent = req.body.parent;
  var whereId = {};
  var whereCode = {};
  var wherePf = {};
  if (id != 0) Object.assign(whereId, { id: { [Op.ne]: id } });
  if (parent != 0) Object.assign(whereId, { parent: { [Op.ne]: parent } });
  if (code != "" || codePf != "") {
    if (code != "") Object.assign(whereCode, { code: code });
    if (codePf != "") Object.assign(wherePf, { code_pf: codePf });
    produit
      .findAll({
        where: {
          [Op.and]: [whereId],
          [Op.or]: [whereCode, wherePf],
        },
      })
      .then(async function (r) {
        if (r.length != 0) {
          return res.status(200).json(true);
        } else {
          return res.status(200).json(false);
        }
      })
      .catch((err) => {
        console.log(err);
        return res.status(403).json(false);
      });
  } else {
    return res.status(200).json(false);
  }
});
module.exports = router;
