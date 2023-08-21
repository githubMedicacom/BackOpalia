const express = require("express");
const router = express.Router();
var user = require("../models/user");
var commande = require("../models/commande");
var seg_pharma = require("../models/seg_pharma");
var pharmacie = require("../models/pharmacie");
var configuration = require("../config");
var Sequelize = require("sequelize");
var notification = require("../models/notification");
const jwt = require("jsonwebtoken");
const privateKey = "mySecretKeyabs";
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
// Desplay all lignes of client ...
function insertCmd(obj) {
  return new Promise((resolve, reject) => {
    var dateCreate = new Date(); // Or the date you'd like converted.
    var date = new Date(dateCreate.getTime() - (dateCreate.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
   
    commande
      .create({
        id_action: obj.id_action,
        id_user: obj.id_user,
        id_pharmacie: obj.id_pharmacie,
        id_segment: obj.id_segment,
        etat: obj.etat,
        note: obj.note,
        date:date
      })
      .then((results) => {
        /* seg_pharma.update(
          { etat: obj.etat },
          { where: { id_pharmacie: obj.id_pharmacie, Segment: obj.id_segment } }
        ); */
        return resolve(results);
      })
      .catch((error) => {
        console.log(error);
        return reject(error);
      });
  });
}
router.post("/addCommande", auth, async(req, res) => {
  var id_action = req.body.id_action;
  var id_user = req.body.id_user;
  var id_pharmacie = req.body.id_pharmacie;
  var id_segment = req.body.id_segment;
  var etat = req.body.etat;
  var note = req.body.note; 
  var obj = {
    id_action: id_action,
    id_user: id_user,
    id_pharmacie: id_pharmacie,
    id_segment: id_segment,
    etat: etat,
    note: note,
  };
  var pharmaFind=await pharmacie.findOne({ where: { id: id_pharmacie } });
  var text=`Commande pharmacie :${pharmaFind.dataValues.nom} clôturer`;
  if(etat == 1 || etat == 2) {
    var etatNotif=etat==1?8:9;
    var userFind=await user.findOne({ where: { id: id_user } });
    var userFindByline=await user.findAll({ where: { line: userFind.dataValues.line, idrole:1 } });
    userFindByline.forEach(e=>{
      notification.create({
        id_user:e.dataValues.id,
        etat:etatNotif,
        text: text
      })
    })
  } else {
    var cmd = await commande.findOne(
      { where: { id_pharmacie: id_pharmacie, id_action: id_action } }
    )
    var etatNotif=etat==3?10:11;
    notification.create({
      id_user:cmd.dataValues.id_user,
      etat:etatNotif,
      text: text
    })
  }
  /* var userFind=await user.findOne({ where: { id: id_user } });
  var userFindByline=await findAll(userFind.dataValues.line); */
  // etat 1: oui delegue *** 2:non delegue *** 3:oui superviseur *** 4: non superviseur
  switch (etat) {
    case "1":case "2":{
      insertCmd(obj);
    }
      break;
    case "3":{
        commande.update(
          { etat: etat,note: note },
          { where: { id_pharmacie: id_pharmacie, id_action: id_action } }
        );
      }
      break;
    default:{
        commande.destroy(
          { where: { id_pharmacie: id_pharmacie, id_action: id_action } }
        );
      }
      break;
  }
  return res.status(200).send(true);
});
router.get("/getCommande/:idAction", auth, (req, res) => {
  var idAction = req.params.idAction;
  var token =(req.headers["x-access-token"])
  const decoded = jwt.verify(token, privateKey);
  var idUser = decoded.userauth.id;
  var idRole = decoded.userauth.idrole;
  var where = {id_action: idAction,etat:[2,3]}
  if(idRole==2)
    where = {id_action: idAction,etat:[2,3] ,id_user:idUser}
  commande
    .findAll({
      where: where,
      include: ["pharmacies", "segments","users"],
      order: [["id", "desc"]],
    })
    .then(function (r) {
      return res.status(200).send(r);
    });
});
router.get("/getCommandeByEtat/:idAction", auth, (req, res) => {
  var idAction = req.params.idAction;
  commande
    .findAll({
      where: { id_action: idAction,etat:[1] },
      include: ["pharmacies", "segments","users"],
      order: [["id", "desc"]],
    })
    .then(async function (rows) {
      var objClient = new Object();
      var list = [];
      if(rows.length !=0){
        var idClient="(";
        rows.forEach(e=>{
          list.push({
            delegue: e.users.nomU +" "+e.users.prenomU,
            Pharmacie: e.pharmacies.nom,
            Segment: e.segments.id,
            id: e.id,
            id_pharmacie: e.id_pharmacie,
            nomSeg: e.segments.nom
          })
          idClient +=e.id_pharmacie+",";
          objClient[e.id_pharmacie]=0;
        })
        idClient = idClient.slice(0, -1)
        idClient+=")";
        var sql1 = `SELECT  b.id, b.client as ph,sum(li.montant) as mnt
        from bls b
        left join lignebls li on b.id=li.idbielle
        where b.client in ${idClient}
        group by b.client 
        order by b.id desc`;
        var reqClient = await sequelize.query(sql1, { type: sequelize.QueryTypes.SELECT });
        reqClient.forEach(e=>{
          objClient[e.ph]=Math.round(e.mnt);
        })
      }
      return res.status(200).send({
        rows:list,
        objClient:objClient
      });
    });
});
module.exports = router;
