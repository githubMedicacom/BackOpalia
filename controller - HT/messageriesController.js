const express = require("express");
const router = express.Router();
var messageries = require("../models/messageries");
var user = require("../models/user");
var configuration = require("../config");
var Sequelize = require("sequelize");
const auth = require("../middlewares/passport");
const imageThumbnail = require('image-thumbnail');
/* const sendMail = require("./sendMailController"); */
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
router.post("/ajout", auth, async (req, res) => {
  try {
    const text = req.body.text;
    const idUser = req.body.idUser;
    const idAction = req.body.idAction;
    const date = req.body.date;
    const img = req.body.img;
    const line = req.body.line;
    const nomAction = req.body.nomAction;
    let options = { percentage: 30,height: 500, responseType: 'base64' }
    const thumbnail = await imageThumbnail(img, options);
    /* var userMail = await user.findAll({ where: { line: line } }); */
    var insert = `INSERT INTO messageries (text,id_user,date,id_action,img) 
    VALUES ('${text}',${idUser},'${date}',${idAction},"${thumbnail}")`;  
    sequelize.query(insert, { type: sequelize.QueryTypes.INSERT }).then(function (result) {
      /* userMail.forEach(element => {
        sendMail(nomAction,`<tr><td>${text}</td></tr>`,element.email,element.prenomU+" "+element.prenomU);
      }); */
      return res.status(200).send({
          result: result,
          message: "success",
      });
    })
  } catch (error) {
    console.log(error)
    return res
      .status(500)
      .json({ errors: error, message: "Probleme de connextion" });
  }
});

// Desplay all actioncomercial  ...
router.post("/getByAction", auth, (req, res) => {
  const idAction = req.body.idAction;
  var sql = ` SELECT m.*, GROUP_CONCAT(u.nomU," ",u.prenomU) as nomUser,u.idrole
  FROM messageries m
  left join users u on u.id=m.id_user
  where m.id_action= ${idAction} group by m.id`;
  sequelize.query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(function (results) {
      res.status(200).send(results);
    });
});
function action(idLine){
  return new Promise((resolve, reject)=>{
    var date1 = new Date(); // Or the date you'd like converted.
    var date = new Date(date1.getTime() - (date1.getTimezoneOffset() * 60000)).toISOString().slice(0, 10)
    //var sql = `SELECT * FROM actioncomercial where id_user in ${idUser}`;
    var sql = `SELECT a.nom,a.id,count(m.id_action) as nb
    FROM actioncomercials a
    left join messageries m on a.id = m.id_action
    where a.id_line = ${idLine} and a.date_fin >= '${date}' and a.date_debut <= '${date}' group by a.id`;
    sequelize.query(sql, { type: sequelize.QueryTypes.SELECT })
      .then(function (results) {
        if (!results) {
          return reject(false);
        } else {
          return resolve(results);
        }
      });
  });
}
router.post("/getMessageByLine", auth, async (req, res) => {
  var idLine = req.body.line;
  var result = await action(idLine);
  if(result)
    res.status(200).send(result);
  else
    res.status(403).send(false);
});
module.exports = router;
