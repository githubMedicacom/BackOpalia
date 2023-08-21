const express = require("express");
const router = express.Router();
var ims = require("../models/ims");
var detailsims = require("../models/detailsims");
const auth = require("../middlewares/passport");
const sequelize = require("sequelize");
const { Op } = require("sequelize");

// Desplay all lignes of client ...
router.post("/addIms", auth, (req, res) => {
  var id = req.body.id;
  if (id == 0) {
    ims
      .create({
        libelle: req.body.libelle,
        etat: 1,
      })
      .then((r) => {
        return res.status(200).send(true);
      })
      .catch((error) => {
        return res.status(403).send(false);
      });
  } else {
    ims.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        ims
          .update(
            {
              libelle: req.body.libelle,
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
  ims.findAll({ where: { etat: 1 } }).then(function (r) {
    return res.status(200).send(r);
  });
});
router.post("/allIms", auth, (req, res) => {
  ims.findAll({where: { id: { [Op.ne]: 0 } },order:[["id","desc"]]}).then(function (r) {
    return res.status(200).send(r);
  });
});
router.put("/changeEtat/:id", auth, (req, res) => {
  var id = req.params.id;
  ims.findOne({ where: { id: id } }).then(function (r1) {
    var etat = 0;
    if (r1.dataValues.etat == 0) etat = 1;
    if (!r1) {
      return res.status(403).send(false);
    } else {
      ims
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

router.post("/getIms", auth, (req, res) => {
  var id = req.headers["id"];
  ims.findOne({ where: { id: id } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      return res.status(200).json(r1.dataValues);
    }
  });
});

router.post("/addcsvims", auth, function (req, res) {
  // try {

  try {
    var jsondata = req.body;
    var nb = 0;
    var datesys = new Date();
    for (var i = 1; i < jsondata.length; i++) {
      if (jsondata[i].ims.trim() != "") {
        ims
          .findOne({
            where: sequelize.where(
              sequelize.fn("lower", sequelize.col("libelle")),
              jsondata[i].ims.toLowerCase()
            ),
          })
          .then(function (result) {
            var r = 0;
            if (result != null) r = result.dataValues.id;
            detailsims.create({
              idIms: r,
              chef_produit: jsondata[nb].chef_produit.replace("MARCHE ", ""),
              produit: jsondata[nb].produit,
              volume: jsondata[nb].volume,
              total: jsondata[nb].total,
              date: jsondata[nb].date,
              dateInsertion: datesys,
              etat: 1,
            });
            nb++;
          });
      }
    }
    return res.status(200).json(true);
  } catch (error) {
    return res.status(500).json({ errors: error });
  }
});
router.post("/getDetailsims", auth, (req, res) => {
  var mois = "";
  if (req.body.month != 0)
    mois = sequelize.where(
      sequelize.fn("month", sequelize.col("date")),
      req.body.month
    );
  detailsims
    .findAll({
      where: {
        [Op.and]: [
          sequelize.where(
            sequelize.fn("year", sequelize.col("date")),
            req.body.year
          ),
          mois,
        ],
      },
      include:["ims"]
    })
    .then(function (r1) {
      return res.status(200).json(r1);
    });
});

//Delete client
router.delete("/deleteDetail/:id", auth, (req, res) => {
  var id = req.params.id;
  detailsims.findOne({ where: { id: id } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      detailsims
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
router.post("/getLastDetail", auth, async (req, res) => {
  var details = await detailsims.findOne({
    attributes: ["date","id"],
    order: [ [ 'date', 'DESC' ]]
  });
  var lastDate = details!=null?details.dataValues.date:"";
  return res.status(200).send({date:lastDate});
});

module.exports = router;
