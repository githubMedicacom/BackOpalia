const express = require("express");
const router = express.Router();
var secteur = require("../models/secteur");
var ims = require("../models/ims");
var secteurIms = require("../models/secteurIms");
const auth = require("../middlewares/passport");
var configuration = require("../config");
var Sequelize = require("sequelize");
const { Op } = require("sequelize");
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
router.post("/addSecteur",auth, (req, res) => {
    var id = req.body.id;
    if (id == 0) {
      secteur
        .create({
          libelleSect: req.body.libelleSect,
          etat : 1
        })
        .then((s) => {
          req.body.imsSelect.forEach((element) => {
            secteurIms
              .create({
                secteurId: s.dataValues.id,
                imsId: element.value,
              })
              .then((pp) => {
              })
              .catch((error) => {
                console.log(error);
                return res.status(403).send(false);
              });
          });
          return res.status(200).send(true);
        })
        .catch((error) => {
          return res.status(403).send(false);
        });
    } else {
      secteur.findOne({ where: { id: id } }).then(function (r1) {
        if (!r1) {
          return res.status(403).send(false);
        } else {
          secteur
            .update({
              libelleSect: req.body.libelleSect,
              etat : 1
            },{ where: { id: id } })
            .then((r2) => { 
              secteurIms
                .destroy({ where: { secteurId: id } })
                .then((des) => {
                  req.body.imsSelect.forEach((element) => {
                    secteurIms
                      .create({
                        secteurId: id,
                        imsId: element.value,
                      })
                      .then((pp) => {
                      })
                      .catch((error) => {
                        console.log(error);
                        return res.status(403).send(false);
                      });
                  });
                })
                .catch((error) => {
                  console.log(error)
                  return res.status(403).send(error);
                });
              return res.status(200).send(true);
            })
            .catch((error) => {
              return res.status(403).send(false);
            });
        }
      });
    }
});
router.post("/allSecteur", auth, (req, res) => {
    secteurIms.findAll({
      include:[{
        model:ims,
        as:"ims"
      },{
        model:secteur,
        as:"secteurs"
      }],
      attributes: [
        'secteurId',
        [sequelize.fn('GROUP_CONCAT', sequelize.col('ims.libelle')), 'imsLib']
      ],
      group:["secteurId"],
      order:[["secteurId","desc"]]
    }).then(function (r) {
      return res.status(200).send(r);
    });
});
  
//Delete client
router.delete("/deleteSecteur/:id",auth, (req, res) => {
    var id = req.params.id;
    secteur.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        secteur.destroy({ where: { id: id } })
          .then((r2) => {
            return res.status(200).send(true);
          })
          .catch((error) => {
            return res.status(403).send(false);
          });
      }
    });
});
router.post("/getSecteur",auth, (req, res) => {
    var id = req.headers["id"];
    secteur.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        return res.status(200).json(r1.dataValues);
      }
    });
});
router.post("/getActive", auth, (req, res) => {
  secteur.findAll({ where: { etat: 1,id: { [Op.ne]: 0 } } }).then(function (r) {
    return res.status(200).send(r);
  });
});
router.post("/getSecteurIms/:id", auth, (req, res) => {
  var id = req.params.id;
  var arrayOption = [];
  secteurIms
    .findAll({ where: { secteurId: id }, include: ["ims"] })
    .then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        r1.forEach((elem) => {
          arrayOption.push({
            value: elem.ims.id,
            label: elem.ims.libelle,
          });
        });
        return res.status(200).json({arrayOption});
      }
    });
});
router.get("/getIdSecteurIms/:id", auth, (req, res) => {
  var id = req.params.id;
  var idIms = [];
  secteurIms
    .findAll({ where: { secteurId: id }, include: ["ims"] })
    .then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        r1.forEach((elem) => {
          idIms.push(elem.ims.id);
        });
        return res.status(200).json(idIms);
      }
    });
});
router.put("/changerEtat/:id", auth, (req, res) => {
  var id = req.params.id;
  //var etat = req.body.etat;
  secteur.findOne({ where: { id: id } }).then(function (r1) {
    var etat = 0;
    if (r1.dataValues.etat == 0) etat = 1;
    if (!r1) {
      return res.status(403).send(false);
    } else {
      secteur
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

module.exports = router;
