const express = require("express");
const router = express.Router();
var seg_pharma = require("../models/seg_pharma");
var packproduit = require("../models/packproduit");
var pack = require("../models/pack");
var commande_bl = require("../models/commande_bl");
var commande = require("../models/commande");
const auth = require("../middlewares/passport");
const { Op } = require("sequelize");
const ligneBl = require("../models/ligneBl");
const bl = require("../models/bl");
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
router.post("/addPack", auth, (req, res) => {
  var id = req.body.id;
  var pharma = req.body.idPharmacie == 0 ? null : req.body.idPharmacie;
  if (id == 0) {
    pack
      .create({
        nom: req.body.nom,
        bonification: req.body.bonification,
        id_pharmacie: pharma,
        segment: req.body.segment,
        type: req.body.type,
        etat: 1,
      })
      .then((p) => {
        packproduit
          .destroy({ where: { id: p.dataValues.id } })
          .then((des) => {
            if (req.body.packproduit.length > 0) {
              req.body.packproduit.forEach((element) => {
                packproduit
                  .create({
                    packId: p.dataValues.id,
                    produitId: element.produitId,
                    quantite: element.quantite,
                    montant: element.montant,
                    quantiteUg: element.quantiteUg,
                  })
                  .then((pp) => {})
                  .catch((error) => {
                    console.log(error);
                    return res.status(403).send(false);
                  });
              });
            }
          })
          .catch((error) => {
            return res.status(403).send(false);
          });
        /* */
        return res.status(200).send(true);
      })
      .catch((error) => {
        return res.status(403).send(false);
      });
  } else {
    pack.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        pack
          .update(
            {
              nom: req.body.nom,
              bonification: req.body.bonification,
              id_pharmacie: pharma,
              segment: req.body.segment,
              type: req.body.type,
              etat: 1,
            },
            { where: { id: id } }
          )
          .then((p) => {
            packproduit
              .destroy({ where: { packId: id } })
              .then((des) => {
                if (req.body.packproduit.length > 0) {
                  req.body.packproduit.forEach((element) => {
                    packproduit
                      .create({
                        packId: id,
                        produitId: element.produitId,
                        quantite: element.quantite,
                        montant: element.montant,
                        quantiteUg: element.quantiteUg,
                      })
                      .then((pp) => {})
                      .catch((error) => {
                        console.log(error);
                        return res.status(403).send(false);
                      });
                  });
                }
              })
              .catch((error) => {
                console.log(error);
                return res.status(403).send(error);
              });
            return res.status(200).send(true);
          })
          .catch((error) => {
            console.log(error);
            return res.status(403).send(error);
          });
      }
    });
  }
});

router.post("/allPack", auth, (req, res) => {
  pack
    .findAll({ where: { id: { [Op.ne]: 0 } }, order: [["id", "desc"]] })
    .then(function (r) {
      return res.status(200).send(r);
    });
});
router.post("/getActive", auth, (req, res) => {
  pack.findAll({ where: { etat: 1 } }).then(function (r) {
    return res.status(200).send(r);
  });
});

router.put("/changeEtat/:id", auth, (req, res) => {
  var id = req.params.id;
  pack.findOne({ where: { id: id } }).then(function (r1) {
    var etat = 0;
    if (r1.dataValues.etat == 0) etat = 1;
    if (!r1) {
      return res.status(403).send(false);
    } else {
      pack
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
router.post("/getPack", auth, async (req, res) => {
  var id = req.headers["id"];
  var table = await packproduit.findAll({
    where: { packId: id },
    include: ["packs", "produits"],
  });
  var header = await pack.findOne({
    where: { id: id },
    include: ["segments", "pharmacies"],
  });
  return res.status(200).json({ header, table });
});


router.get("/getPackBySegment/:id", auth, async (req, res) => {
  var id = req.params.id;
  /* var reqFromPack = await pack.findAll({
    where: {
      [Op.or]: [{ id_pharmacie: id }, { id: 0 }],
    },
  });
  if (reqFromPack.length == 1) {
    var reqParma = await seg_pharma.findAll({ where: { id_pharmacie: id } });
    if (reqParma.length != 0) {
      reqFromPack = await pack.findAll({
        where: {
          [Op.or]: [{ segment: reqParma[0].dataValues.Segment }, { id: 0 }]
        },
      });
    } else {
      reqFromPack = await pack.findAll();
    }
  } 
  var entities = Object.values(JSON.parse(JSON.stringify(reqFromPack)));
  
  entities.forEach((e) => {
    arrayOption.push({ value: e.id, label: e.nom });
  });
  
  */
  var arrayOption = [];
  var reqParma = await seg_pharma.findOne({ where: { id_pharmacie: id } });
  var reqFromPack = await pack.findAll({
    where: {
      [Op.or]: [{ id_pharmacie: id }, { id_pharmacie: { [Op.is]: null } }],
    },
    order: [["id_pharmacie", "desc"]],
  });
  var entities = Object.values(JSON.parse(JSON.stringify(reqFromPack)));

  entities.forEach((e) => {
    if (reqParma) {
      if (e.segment == reqParma.dataValues.Segment)
        arrayOption.push({ value: e.id, label: e.nom + "(Recommandé)" });
      else {
        arrayOption.push({ value: e.id, label: e.nom });
      }
    } else {
      arrayOption.push({ value: e.id, label: e.nom });
    }
  });
  return res.status(200).json(arrayOption);
});

/* bech inlawjo idha ken produit mawjoud fil pack mte3 action walla la idha ken mawjoud islectioni pack 
  idha ken moch mawjoud islectionni pack commande groupées
  */
router.post("/getPackByProduits", auth, async (req, res) => {
  var idUser = req.body.idUser;
  var arrayFinal = req.body.arrayFinal;
  var idClient = req.body.idClient;
  var mntTotal = req.body.mntTotal;
  var id_action = req.body.id_action;

  var idPacks = req.body.idPacks;
  var arrayId = idPacks.split(",");

  var findPack = await packproduit.findAll({
    include: [
      {
        model: pack,
        as: "packs",
        where: {
          id: arrayId,
        },
      },
    ],
  });

  var fetchPack = await pack.findOne({
    where: {
      id: arrayId,
    },
  });
  var typePack = fetchPack.type;

  var packSelected = [];
  var arrayRemove = [];
  var test = false;
  var objPack = new Object();
  objPack[0] = {
    value: 0,
    label: "Commande spontanée",
    mnt: 0,
    qte: 0,
  };
  arrayRemove[0] = true;
  if (idClient !== null) {
    for (const key1 in findPack) {
      var element = findPack[key1].dataValues;
      arrayRemove[element.packs.id] = true;
      objPack[element.packs.id] = {
        value: element.packs.id,
        label: element.packs.nom,
        qte: element.quantite,
        mnt: element.montant,
      };
    }
  }

  for (const key in arrayFinal) {
    if (typePack == 1) {
      if (idClient !== null) {
        var findProduit = await packproduit.findOne({
          where: { produitId: arrayFinal[key].idProduit, packId: arrayId },
          include: [
            {
              model: pack,
              as: "packs",
            },
          ],
        });
        if (findProduit) {
          arrayFinal[key].id_pack = findProduit.dataValues.packId;
          arrayFinal[key].quantite_rest_p = findProduit.dataValues.quantite;
          arrayFinal[key].montant_rest_p = findProduit.dataValues.montant;
          var getPacks = findProduit.dataValues.packs;
          packSelected.push({
            value: getPacks.id,
            label: getPacks.nom,
            qte: findProduit.dataValues.quantite,
            mnt: findProduit.dataValues.montant,
          });
        } else {
          arrayFinal[key].id_pack = 0;
          arrayFinal[key].montant_rest_p = 0;
          arrayFinal[key].quantite_rest_p = 0;
          test = true;
          packSelected.push({
            value: 0,
            label: "Commande spontanée",
            mnt: 0,
            qte: 0,
          });
        }
      } else {
        arrayFinal[key].id_pack = 0;
        arrayFinal[key].montant_rest_p = 0;
        arrayFinal[key].quantite_rest_p = 0;
        test = true;
        packSelected.push({
          value: 0,
          label: "Commande spontanée",
          mnt: 0,
          qte: 0,
        });
      }
    } else {
      arrayFinal[key].id_pack = fetchPack.dataValues.id,
      arrayFinal[key].montant_rest_p = 0;
      arrayFinal[key].quantite_rest_p = 0;
      test = true;
      packSelected.push({
        value: fetchPack.dataValues.id,
        label: fetchPack.dataValues.nom,
        mnt: 0,
        qte: 0,
      });
    }
  }
  var arrayOption = Object.values(objPack);
  var arrayOptionF = [];
    for (const key in arrayOption) {
      const element = arrayOption[key];
      arrayOptionF.push(element);
      /* if (arrayRemove[element.value])  */
    }
  
  /* arrayOptionF = arrayOption.concat(arrayOptionF) */
  return res.status(200).json({
    arrayFinal: arrayFinal,
    packSelected: packSelected,
    test: test,
    arrayOption: arrayOptionF,
  });
});

/**
 * bech in9arno produit selectionner idha ken mawjoud fil pack ou non
 **/
router.get(
  "/verifPackByProduits/:idProduit/:idPack",
  auth,
  async (req, res) => {
    var idProduit = req.params.idProduit;
    var idPack = req.params.idPack;
    if (idPack == 0) {
      return res.status(200).json({ msg: true });
    } else {
      packproduit
        .findOne({
          where: {
            produitId: idProduit,
            packId: idPack,
          },
        })
        .then((val) => {
          if (val == null) {
            return res.status(200).json({ msg: false });
          } else {
            return res.status(200).json({ msg: true });
          }
        });
    }
  }
);

router.get("/allProduitPack", auth, (req, res) => {
  packproduit.findAll({ order: [["id", "desc"]] }).then(function (prod) {
    var array = new Object();
    prod.forEach((element) => {
      /* if() */
      /* array[element.packId+"-"+element.produitId] = element; */
      if (!array[element.packId]) {
        array[element.packId] = {};
      }

      array[element.packId][element.produitId] = element;
    });

    return res.status(200).send(array);
  });
});
module.exports = router;
