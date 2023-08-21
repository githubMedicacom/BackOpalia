const express = require("express");
const router = express.Router();
var pole = require("../models/pole");
const auth = require("../middlewares/passport");
const { Op } = require("sequelize");


// Desplay all poles of client ...
router.post("/addPole", auth, (req, res) => {
  console.log(pole)
    var id = req.body.id;
    if (id == 0) {
      pole
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
      pole.findOne({ where: { id: id } }).then(function (r1) {
        if (!r1) {
          return res.status(403).send(false);
        } else {
          pole
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


  // get all  poles
  router.post("/allPoles", auth, (req, res) => {
    pole.findAll({where: { id: { [Op.ne]: 0 } },order:[["id","desc"]]}).then(function (r) {
      return res.status(200).send(r);
    });
  });


  // get pole by id 
  router.post("/getPole", auth, (req, res) => {
    var id = req.headers["id"];
    pole.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        return res.status(200).json(r1.dataValues);
      }
    });
  });
  

  module.exports = router;
