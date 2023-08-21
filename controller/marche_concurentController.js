const express = require("express");
const router = express.Router();
var marche_concurent = require("../models/marche_concurent");
const auth = require("../middlewares/passport"); 
router.post("/addMarche_concurent", auth, (req, res) => {
  var id = req.body.id;
  if (id == 0) {
    marche_concurent
      .create({
        designation: req.body.designation,
        id_marche: req.body.id_marche,
        etat: 1,
      })
      .then(() => {
        return res.status(200).send(true);
      })
      .catch((err) => {
        console.log(err)
        return res.status(403).send(false);
      });
  } else {
    marche_concurent.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        marche_concurent
          .update(
            {
              designation: req.body.designation,
              id_marche: req.body.id_marche,
              etat: 1,
            },
            { where: { id: id } }
          )
          .then(() => {
            return res.status(200).send(true);
          })
          .catch(() => {
            return res.status(403).send(false);
          });
      }
    });
  }
});

router.post("/allMarche_concurent", auth, (req, res) => {
  marche_concurent.findAll({ order: [["id", "desc"]] }).then(function (val) {
    return res.status(200).send(val);
  });
});

router.post("/getActive", auth, (req, res) => {
  marche_concurent
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

router.put("/changeEtat/:id", auth, (req, res) => {
  var id = req.params.id;
  marche_concurent.findOne({ where: { id: id } }).then(function (r1) {
    var etat = 0;
    if (r1.dataValues.etat == 0) etat = 1;
    if (!r1) {
      return res.status(403).send(false);
    } else {
      marche_concurent
        .update(
          {
            etat: etat,
          },
          { where: { id: id } }
        )
        .then(() => {
          return res.status(200).send(true);
        })
        .catch(() => {
          return res.status(403).send(false);
        });
    }
  });
});

router.post("/getMarche_concurent", auth, (req, res) => {
  var id = req.headers["id"];
  marche_concurent.findOne({ where: { id: id } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      return res.status(200).json(r1.dataValues);
    }
  });
});
module.exports = router;
