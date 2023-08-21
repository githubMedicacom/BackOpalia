const express = require("express");
const router = express.Router();
var ligneIms = require("../models/ligneIms");
const auth = require("../middlewares/passport");
const { Op } = require("sequelize");

// Desplay all lignes of client ...
router.post("/addLigneIms", auth, (req, res) => {
  var id = req.body.id;
  if (id == 0) {
    ligneIms
      .create({
        nom: req.body.nom,
      })
      .then((r) => {
        return res.status(200).send(true);
      })
      .catch((error) => {
        return res.status(403).send(false);
      });
  } else {
    ligneIms.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        ligneIms
          .update(
            {
              nom: req.body.nom,
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
router.post("/allLigneIms", auth, (req, res) => {
  ligneIms.findAll({where: { id: { [Op.ne]: 0 } },order:[["id","desc"]]}).then(function (r) {
    return res.status(200).send(r);
  });
});
router.post("/getActive",auth, (req, res) => {
  ligneIms.findAll({ where: { etat: 1 } }).then(function (r) {
    return res.status(200).send(r);
  });
});

router.put("/changerEtat/:id", auth, (req, res) => {
  var id = req.params.id;
  ligneIms.findOne({ where: { id: id } }).then(function (r1) {
    var etat = 0;
    if(r1.dataValues.etat == 0)
      etat = 1;
    if (!r1) {
      return res.status(403).send(false);
    } else {
      ligneIms.update({
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
router.post("/getLigneIms", auth, (req, res) => {
  var id = req.headers["id"];
  ligneIms.findOne({ where: { id: id } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      return res.status(200).json(r1.dataValues);
    }
  });
});

module.exports = router;
