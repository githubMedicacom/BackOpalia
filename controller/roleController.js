const express = require("express");
const router = express.Router();
var role = require("../models/role");
const auth = require("../middlewares/passport");

// Desplay all lignes of client ...
router.post("/addRole",auth, (req, res) => {
  var id = req.body.id;
  if (id == 0) {
    role
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
    role.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        role
          .update({
            nom: req.body.nom
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
router.post("/allRole",auth, (req, res) => {
  role.findAll().then(function (r) {
    return res.status(200).send(r);
  });
});

//Delete client
router.delete("/deleteRole/:id",auth, (req, res) => {
  var id = req.params.id;
  role.findOne({ where: { id: id } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      role.destroy({ where: { id: id } })
        .then((r2) => {
          return res.status(200).send(true);
        })
        .catch((error) => {
          return res.status(403).send(false);
        });
    }
  });
});
router.post("/getRole",auth, (req, res) => {
  var id = req.headers["id"];
  role.findOne({ where: { id: id } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      return res.status(200).json(r1.dataValues);
    }
  });
});

module.exports = router;
