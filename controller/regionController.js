const express = require("express");
const router = express.Router();
var region = require("../models/region");
const auth = require("../middlewares/passport");
const { Op } = require("sequelize");


// Desplay all regions of client ...
router.post("/addRegion", auth, (req, res) => {
    var id = req.body.id;
    if (id == 0) {
      region
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
      region.findOne({ where: { id: id } }).then(function (r1) {
        if (!r1) {
          return res.status(403).send(false);
        } else {
          region
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


  // get all  regions
  router.post("/allRegions", auth, (req, res) => {
    region.findAll({where: { id: { [Op.ne]: 0 } },order:[["id","desc"]]}).then(function (r) {
      return res.status(200).send(r);
    });
  });


  // get region by id 
  router.post("/getRegion", auth, (req, res) => {
    var id = req.headers["id"];
    region.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        return res.status(200).json(r1.dataValues);
      }
    });
  });
  

  module.exports = router;
