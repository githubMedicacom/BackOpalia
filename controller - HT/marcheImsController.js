const express = require("express");
const router = express.Router();
var marcheIms = require("../models/marcheIms");
const auth = require("../middlewares/passport");
const { Op } = require("sequelize");

// Desplay all lignes of client ...
router.post("/addMarcheIms",auth, (req, res) => {
    var id = req.body.id;
    if (id == 0) {
      marcheIms
        .create({
          lib: req.body.lib,
          etat : 1
        })
        .then((r) => {
          return res.status(200).send(true);
        })
        .catch((error) => {
          return res.status(403).send(false);
        });
    } else {
      marcheIms.findOne({ where: { id: id } }).then(function (r1) {
        if (!r1) {
          return res.status(403).send(false);
        } else {
          marcheIms
            .update({
              lib: req.body.lib,
              etat : 1
            },{ where: { id: id } })
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
router.post("/allMarcheIms",auth, (req, res) => {
  marcheIms.findAll({where: { id: { [Op.ne]: 0 } },order:[["id","desc"]]}).then(function (r) {
    return res.status(200).send(r);
  });
});
router.post("/getActive",auth, (req, res) => {
  marcheIms.findAll({ where: { etat: 1,id: { [Op.ne]: 0 } } }).then(function (r) {
    return res.status(200).send(r);
  });
});

//Delete client
router.put("/changerEtat/:id", auth, (req, res) => {
  var id = req.params.id;
  marcheIms.findOne({ where: { id: id } }).then(function (r1) {
    var etat = 0;
    if(r1.dataValues.etat == 0)
      etat = 1;
    if (!r1) {
      return res.status(403).send(false);
    } else {
      marcheIms.update({
        etat: etat
      },{ where: { id: id } })
        .then((r2) => {
          return res.status(200).send(true);
        })
        .catch((error) => {
          return res.status(403).send(false);
        });
    }
  });
});
router.post("/getMarcheIms",auth, (req, res) => { 
  var id = req.headers["id"];
  marcheIms.findOne({ where: { id: id } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      return res.status(200).json(r1.dataValues);
    }
  });
});

module.exports = router;
