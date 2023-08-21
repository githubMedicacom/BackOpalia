const express = require("express");
const router = express.Router();
var notification = require("../models/notification");
const auth = require("../middlewares/passport");
const jwt = require("jsonwebtoken");
const privateKey = "mySecretKeyabs";
var configuration = require("../config");
var Sequelize = require("sequelize");
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

router.get("/getNotification",auth, async(req, res) => {
  /* 
  1-extration bl 
  2-valide bl
  3-refuse bl
  4-Nouveau produit
  5-new action
  6-new todoliste
  7-tache terminer
  8-Delegue à accepter commande
  9-Delegue à refuser commande
  10-Superviseur à refuser commande
  11-Superviseur à refuser commande
  12- action cloturer
  */
  var token =(req.headers["x-access-token"])
  const decoded = jwt.verify(token, privateKey);
  var id = decoded.userauth.id;
  var notif = await notification.findAll({ where: {lu:0,id_user:id} ,order: [["id", "DESC"]]});
  return res.status(200).json(notif);
});
router.delete("/update/:id/:idUser",auth, (req, res) => {
  var id = req.params.id; 
  var idUser = req.params.idUser; 
  var where = null;
  if(id==0) where={id_user:idUser}
  else where ={ id: id }
  notification.destroy({ where: where }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      return res.status(200).json(r1.dataValues);
    }
  });
});

module.exports = router;
