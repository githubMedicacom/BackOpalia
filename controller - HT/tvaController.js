const express = require("express");
const router = express.Router();
var tva = require("../models/tva");
const auth = require("../middlewares/passport");
const { Op } = require("sequelize");

// Desplay all lignes of client ...
router.post("/addTva", auth, (req, res) => {
  var id = req.body.id;
  if (id == 0) {
    tva
      .create({
        tva: req.body.tva,
        annee: req.body.annee,
      })
      .then((r) => {
        return res.status(200).send(true);
      })
      .catch((error) => {
        console.log(error)
        return res.status(403).send(false);
      });
  } else {
    tva.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        tva
          .update(
            {
              tva: req.body.tva,
              annee: req.body.annee,
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
router.post("/allTva", auth, (req, res) => {
  tva.findAll({where: { id: { [Op.ne]: 0 } },order:[["id","desc"]]}).then(function (r) {
    return res.status(200).send(r);
  });
});
router.post("/getActive",auth, (req, res) => {
  tva.findAll({ where: { etat: 1 } }).then(function (r) {
    return res.status(200).send(r);
  })
});
router.get("/getTvaByAnnee/:annee",auth, (req, res) => {
  var annee = req.params.annee;
  tva.findOne({ where: { etat: 1,annee: annee } }).then(function (r) {
    return res.status(200).send(r);
  }).catch((error)=>{
    console.log("error",error)
    return res.status(403).send(false);
  });
});

router.put("/changerEtat/:id", auth, (req, res) => {
  var id = req.params.id;
  tva.findOne({ where: { id: id } }).then(function (r1) {
    var etat = 0;
    if(r1.dataValues.etat == 0)
      etat = 1;
    if (!r1) {
      return res.status(403).send(false);
    } else {
      tva.update({
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
router.post("/getTva", auth, (req, res) => {
  var id = req.headers["id"];
  tva.findOne({ where: { id: id } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      return res.status(200).json(r1.dataValues);
    }
  });
});

module.exports = router;
