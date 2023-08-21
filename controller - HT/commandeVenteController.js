const express = require("express");
const router = express.Router();
var commandeVente = require("../models/commandeVente");
var ligneCmdVente = require("../models/ligneCmdVente");
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

const auth = require("../middlewares/passport");
const User = require("../models/user");

router.post("/addCmd", auth, async (req, res) => {
  commandeVente
    .create({
      id_user: req.body.entitiesEntete.id_user,
      id_pharmacie: req.body.entitiesEntete.id_pharmacie,
      type: req.body.entitiesEntete.type,
      numero: req.body.entitiesEntete.numero,
      fournisseur: req.body.entitiesEntete.fournisseur,
      total: req.body.entitiesEntete.total,
      etat: 0,
      date: req.body.entitiesEntete.date,
    })
    .then((r) => {
      return res.status(200).send({ data: r, msg: true });
    })
    .catch((error) => {
      console.log(error);
      return res.status(403).send({ error: error, msg: false });
    });
});

router.post("/addLigneCmd", auth, async (req, res) => {
  var array = req.body.entities;
  ligneCmdVente
    .bulkCreate(array)
    .then((r) => {
      return res.status(200).send({ data: r, msg: true });
    })
    .catch((error) => {
      console.log(error);
      return res.status(403).send({ error: error, msg: false });
    });
});

router.get("/countNum/:idUser", auth, async (req, res) => {
  const idUser = req.params.idUser;
  /* var countNum = await commandeVente.count({
    distinct: true,
    col: "id",
    where: { id_user: idUser },
  }); */
  var last = await commandeVente.findOne({
    where: { id_user: idUser },
    attributes: ["numero","id"],
    order: [ [ 'id', 'DESC' ]]
  });
  var countNum = last!=null?last.dataValues.numero:"";
  res.status(200).send({ countNum });
});
router.put("/changeEtat", auth, async(req, res) => {
  var id = req.body.id;
  var etat = req.body.etat;
  var commentaire = req.body.commentaire;

  /*var getBlByUser = await bl.findOne({ where: { id: id }, include: ["users"] });
   var txt ="";
  var etatNotif=0;
  if(etat == 1 ) {
    txt="Bl accepter : "+getBlByUser.dataValues.numeroBL;
    etatNotif = 2;
  }
  else{
    txt="Bl refuser : "+getBlByUser.dataValues.numeroBL;
    etatNotif = 3;
  }
  
  notification.create({
    id_user:getBlByUser.dataValues.iduser,
    etat:etatNotif,
    text:txt
  }) */
  commandeVente.update(
    {
      etat: etat,
      commentaire:commentaire
    },
    { where: { id: id } }
  )
    .then((r2) => {
      return res.status(200).send(r2);
    })
    .catch((error) => {
      return res.status(403).send(false);
    });
});


router.get("/getCmd/:idRole/:idLine/:idUser/:annee", auth, async (req, res) => {
  const idDelegue = parseInt(req.params.idUser);
  const idLine = parseInt(req.params.idLine);
  const idRole = parseInt(req.params.idRole);
  const year = parseInt(req.params.annee);
  var where = {};
  var whereU = {};
  if (idRole == 1 || idRole == 2) {
    whereU = { line: idLine };
    if (idRole == 1){
      where = { etat: 0 };
      if (idDelegue != 0) 
        where = { etat: 0, id_user: idDelegue };
      /* 
      else where = { etat: 0 }; */
    }
    if (idRole == 2)
      if (idDelegue != 0) where = { etat: [0, 2], id_user: idDelegue };
      else where = { etat: [0, 2] };
  } else {
    where = { etat: 0}
    /* if (idDelegue != 0) where = { id_user: idDelegue }; */
  }
  commandeVente
    .findAll({
      where: {
        [Op.and]: [
          sequelize.where(sequelize.fn("year", sequelize.col("date")), year),
          where,
        ],
      },
      include: [{ model: User, as: "users", where: whereU }, "pharmacies"],
    })
    .then((val) => {
      res.status(200).send(val);
    });
});
router.get("/getCmdValider/:idRole/:idLine/:idUser/:annee", auth, async (req, res) => {
  const idDelegue = parseInt(req.params.idUser);
  const idLine = parseInt(req.params.idLine);
  const idRole = parseInt(req.params.idRole);
  const year = parseInt(req.params.annee);
  var whereD = {};
  var whereC = {};
  var whereU = {};
  if (idRole != 0 && idRole != 3) {
    whereU = { line: idLine };
    if (idDelegue != 0) whereD = { id_user: idDelegue };
  } else {
    if (idDelegue != 0) whereD = { id_user: idDelegue };
  }
  commandeVente.findAll({
    where: {
      [Op.and]: [
        sequelize.where(sequelize.fn("year", sequelize.col("date")), year),
        { etat: 1 },
        whereC,
        whereD,
      ],
    },
    include: [
      { model: User, as: "users", where: whereU }, 
      "pharmacies"
    ],
  }).then(val=>{    
    res.status(200).send(val);
  });
});
router.delete("/delete/:id", auth, async (req, res) => {
  var id = req.params.id;
  var cmdFind = await commandeVente.findOne({ where: { id: id } });
  if (cmdFind != null) {
    ligneCmdVente
      .destroy({ where: { id_cmd_vente: id } })
      .then((r2) => {
        commandeVente.destroy({ where: { id: id } }).then((r2) => {
          return res.status(200).send(true);
        });
      })
      .catch((error) => {
        return res.status(403).send(false);
      });
  }
});
router.get("/getDetail/:id", auth, async (req, res) => {
  var id = req.params.id;
  var l = await ligneCmdVente.findAll({
    where: { id_cmd_vente: id },
    include: [
      "produits"
    ],
  });
  return res.status(200).send(l);
});
module.exports = router;
