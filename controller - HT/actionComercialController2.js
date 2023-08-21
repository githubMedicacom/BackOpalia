const express = require("express");
const router = express.Router();
var actionComercials = require("../models/actionComercial");
var actionPacks = require("../models/actionPacks");
const auth = require("../middlewares/passport");
var configuration = require("../config");
var Sequelize = require("sequelize");
var notification = require("../models/notification");
var user = require("../models/user");
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

// Desplay all lignes of client ...
router.post("/addAction", auth, async(req, res) => {
  var id = req.body.id;
  const nom = req.body.nom;
  const id_line = req.body.valLine;
  const pack = req.body.pack;
  const date_debut = req.body.dateDebut;
  const date_fin = req.body.dateFin;
  const bonification = req.body.bonification;
  const objectif = req.body.objectif;
  var getUserByLine = await user.findAll({ where: { line: id_line } });
  var entities = Object.values(JSON.parse(JSON.stringify(getUserByLine)));
  if (id == 0) {
    actionComercials
      .create({
        nom: nom,
        id_line: id_line,
        date_debut: date_debut,
        date_fin: date_fin,
        bonification: bonification,
        objectif: objectif,
        etat: 0,
      })
      .then((r) => {
        /* actionPacks.create({
          id_pack: pack.value,
          id_action: r.dataValues.id,
        })
        entities.forEach(e=>{
          notification.create({
            id_user:e.id,
            etat:5,
            text:"Nouveau objectif: "+nom
          })
        }) */
        pack.forEach((element) => {
          actionPacks.create({
            id_pack: element.value,
            id_action: r.dataValues.id,
          })
        });
        return res.status(200).send(true);
      })
      .catch((error) => {
        return res.status(403).send(error);
      });
  }
});
router.post("/allAction", auth, (req, res) => {
  var idLine = req.body.idLine; 
  var idRole = req.body.idRole; 
  var annee = req.body.annee;
  var where =" ";
  if(idRole !=0 && idRole !=5)
    where = " and id_line = " + idLine;
  var sql = `SELECT a.*, GROUP_CONCAT(p.nom) as libPack,l.nom as nomLigne
  from actioncomercials a
  left JOIN ligneims l on l.id = a.id_line
  left JOIN actionpacks ap on a.id = ap.id_action
  left JOIN packs p on p.id = ap.id_pack 
  where a.etat=0 and (year(date_fin)=${annee} or year(date_debut)=${annee})
  ${where} 
  group by a.id 
  order by a.id desc`;
  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        return res.status(200).json(r1);
      }
    });
});
router.post("/allActionCloturer", auth, (req, res) => {
  var idLine = req.body.idLine; 
  var idRole = req.body.idRole; 
  var annee = req.body.annee;
  var where =" ";
  if(idRole !=0 && idRole !=5)
    where = " and id_line = " + idLine;
  var sql = `SELECT a.*, GROUP_CONCAT(p.nom) as libPack,l.nom as nomLigne
  from actioncomercials a
  left JOIN ligneims l on l.id = a.id_line
  left JOIN actionpacks ap on a.id = ap.id_action
  left JOIN packs p on p.id = ap.id_pack 
  where a.etat=1 and (year(date_fin)=${annee} or year(date_debut)=${annee})
  ${where} 
  group by a.id
  order by a.id desc`;
  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        return res.status(200).json(r1);
      }
    });
});
router.put("/changeEtat/:id",auth, async(req, res) => {
  var id = req.params.id;
  var token =(req.headers["x-access-token"])
  const decoded = jwt.verify(token, privateKey);
  var line = decoded.userauth.line;
  var getUserByLine = await user.findAll({
    where: {
      line: line,
    },
  });
  var entities = Object.values(JSON.parse(JSON.stringify(getUserByLine)));
  var getAllAdmin = await user.findAll({
    where: {
      idrole: 0,
    },
  });
  var entities1 = Object.values(JSON.parse(JSON.stringify(getAllAdmin)));
  actionComercials.findOne({ where: { id: id } }).then(function (r1) {
    var etat = 1;
    if (!r1) {
      return res.status(403).send(false);
    } else {
      actionComercials.update({
          etat: etat
        },{ where: { id: id } })
        .then((r2) => {
          //notification to all admin
          entities1.forEach(el=>{
            notification.create({
              id_user:el.id,
              etat:12,
              text:"Action clôturée: "+r1.dataValues.nom
            })
          })

          //notification to all user by line
          entities.forEach(el=>{
            notification.create({
              id_user:el.id,
              etat:12,
              text:"Action clôturée: "+r1.dataValues.nom
            })
          })
          return res.status(200).send(true);
        })
        .catch((error) => {
          return res.status(403).send(false);
        });
    }
  });
});

router.get("/getActionById/:id", auth, (req, res) => {
  var where = "";
  var id = req.params.id;
  var sql = `SELECT a.*, GROUP_CONCAT(p.nom) as libPack, GROUP_CONCAT(p.id) as idPacks, 
  GROUP_CONCAT(p.segment) as idSegment
  from actioncomercials a
  left JOIN actionpacks ap on a.id = ap.id_action
  left JOIN packs p on p.id = ap.id_pack where a.id = ${id} group by a.id`;
  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        return res.status(200).json(r1);
      }
    });
}); 

router.post("/getActionByYear", auth, (req, res) => {
  const year = req.body.date;
  const line = req.body.idLine;
  var sql = `SELECT a.* from actioncomercials a where year(a.date_fin)=${year} and id_line =${line} order by a.date_fin desc`;
  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        return res.status(200).json(r1);
      }
    });
});
//Delete action
/* router.delete("/delete/:id", async (req, res) => {
  var id = req.params.id;
  try {
    var result1 = await actionPacks.destroy({ where: { id_action: id } });
    var result2 = await actionComercials.destroy({ where: { id: id } });
    return res.status(200).json({ message: "Success delete" });
  } catch (error) {
    return res
      .status(500)
      .json({ errors: error, message: "Probleme de connextion" });
  }
}); */

/*** start notification ***/
router.get("/getActionByLine/:idLine", auth, async (req, res) => {
  var idLine = req.params.idLine;
  var date1 = new Date(); // Or the date you'd like converted.
  var date = new Date(date1.getTime() - date1.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  //var sql = `SELECT * from actioncomercials where id_user in ${idUser}`;
  var sql = `SELECT GROUP_CONCAT(p.nom) as libPack,a.*,GROUP_CONCAT(p.id) as idPack 
  from actioncomercials a 
  left JOIN actionpacks ap on a.id = ap.id_action
  left JOIN packs p on p.id = ap.id_pack 
  where a.id_line = ${idLine} and a.date_fin >= '${date}' and a.date_debut <= '${date}' group by a.id
  order by a.id desc`;
  var result = await sequelize.query(sql, {
    type: sequelize.QueryTypes.SELECT,
  });
  res.status(200).send(result);
});
/*** end notification ***/

/*** start tableau de board ***/
function getObjectif(id,line) {
  return new Promise((resolve, reject) => {
    var sql = `SELECT a.* ,p.id as idPack from actioncomercials a 
    left JOIN actionpacks ap on a.id = ap.id_action
    left JOIN packs p on p.id = ap.id_pack 
    where a.id = ${id} and a.id_line = ${line}`;
    sequelize
      .query(sql, { type: sequelize.QueryTypes.SELECT })
      .then(function (results) {
        if (!results) {
          return reject(error);
        } else {
          return resolve(results);
        }
      });
  });
}
function packFromBl(action) {
  return new Promise((resolve, reject) => {
    var dateD = new Date(action.date_debut); // Or the date you'd like converted.
    var date_debut = new Date(
      dateD.getTime() - dateD.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 10);
    var dateF = new Date(action.date_fin); // Or the date you'd like converted.
    var date_fin = new Date(dateF.getTime() - dateF.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    var idPacks = "(" + action.idPack + ")";
    var sql = `SELECT count(b.id_pack) as som FROM bls b 
    left join lignebls li on li.idbielle = b.id
    where b.id_pack in ${idPacks} and b.dateBl >= '${date_debut}' and b.dateBl <= '${date_fin}' and b.etat = 1`;
    sequelize
      .query(sql, { type: sequelize.QueryTypes.SELECT })
      .then(function (results) {
        if (!results) {
          return reject(error);
        } else {
          return resolve(results);
        }
      });
  });
}

router.get("/getObjectifById/:id/:line", auth, async (req, res) => {
  var id = req.params.id;
  var line = req.params.line;
  var result = await getObjectif(id,line);
  var result1 = 0;
  var pourcentageBl = 0;
  var pourcentageRest = 0;
  if (result.length != 0) {
    var result1 = await packFromBl(result[0]);
    pourcentageBl = Math.round((result1[0].som * 100) / result[0].objectif);
    /* pourcentageBl = Math.round((result[0].objectif * 100) / result1[0].som); */
    var rest = result[0].objectif - result1[0].som;
    pourcentageRest = Math.round((rest * 100) / result[0].objectif);
  }
  res.status(200).send({ pourcentageBl, pourcentageRest });
});
function packFromBlBydelegue(action) {
  return new Promise((resolve, reject) => {
    var dateD = new Date(action.date_debut); // Or the date you'd like converted.
    var date_debut = new Date(
      dateD.getTime() - dateD.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 10);
    var dateF = new Date(action.date_fin); // Or the date you'd like converted.
    var date_fin = new Date(dateF.getTime() - dateF.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    var idPacks = "(" + action.idPack + ")";
    var sql = `SELECT count(b.id_pack) as som,u.nomU,u.prenomU FROM bls b 
    left join lignebls li on li.idbielle = b.id
    left join users u on u.id = b.iduser
    where b.id_pack in ${idPacks} and b.dateBl >= '${date_debut}' and b.dateBl <= '${date_fin}' group by b.iduser`;
    sequelize
      .query(sql, { type: sequelize.QueryTypes.SELECT })
      .then(function (results) {
        if (!results) {
          return reject(error); 
        } else {
          return resolve(results);
        }
      }); 
  });
}

router.get("/getObjectifDelegueById/:id/:line", auth, async (req, res) => {
  var id = req.params.id;
  var line = req.params.line;
  var result = await getObjectif(id,line);
  var result1 = null;

  /* start pie chart */
  var pourcentageBl = [];
  var label = [];
  /* end pie chart */

  /* start bar chart */
  var dataBar = [];
  var labelBar = [];
  /* end bar chart */

  if (result.length != 0) {
    var result1 = await packFromBlBydelegue(result[0]);
    var rest = result[0].objectif;
    var somObjectif = 0;
    result1.forEach((element) => {
      /* start calcul pie chart */
      somObjectif = Math.round((element.som * 100) / result[0].objectif);
      pourcentageBl.push(somObjectif);
      label.push(element.nomU + " " + element.prenomU + "(" + somObjectif + "%)");
      /* end calcul pie chart */

      /* start calcul pie chart */
      dataBar.push(element.som);
      labelBar.push(element.nomU + " " + element.prenomU);
      /* end calcul pie chart */
      rest -= element.som;
    });
    somObjectif = Math.round((rest * 100) / result[0].objectif);
    label.push("Rest (" + somObjectif + "%)");
    pourcentageBl.push(somObjectif);
    dataBar.unshift(rest);
    labelBar.unshift("Rest");
  }
  res.status(200).send({ pourcentageBl, label, dataBar, labelBar });
});
/*** end tableau de board ***/
module.exports = router;
