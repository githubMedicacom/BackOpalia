const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const privateKey = "mySecretKeyabs";
var todolist = require("../models/todolist");
var ligneTodo = require("../models/ligneTodo");
var user = require("../models/user");
var notification = require("../models/notification");
const auth = require("../middlewares/passport");
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
function deleteTodo(idAction){
  return new Promise((resolve, reject)=>{
    var todoSelect = `select * FROM todolists WHERE id_action= '${idAction}'`;
    var todoDelete = `DELETE FROM todolists WHERE id_action= '${idAction}'`;
    sequelize.query(todoSelect, { type: sequelize.QueryTypes.SELECT })
      .then(function (results) { 
        results.forEach(e=>{
          var ligneDelete = `DELETE FROM ligne_todos WHERE id_todo= '${e.id}'`;
          sequelize.query(ligneDelete, { type: sequelize.QueryTypes.DELETE }).then(function () {})
        })
        sequelize.query(todoDelete, { type: sequelize.QueryTypes.DELETE }).then(function (rows) {
            return resolve(rows); 
        })
      });
  });
}
router.post("/saveTodo", auth, async (req, res) => { 
  try {
    const idAction = req.body.idAction;
    const array = req.body.array;
    var todo = await deleteTodo(idAction);
     
    for (const key in array) {
        if(array[key].length !=0){
            var idDelegue = await array[key][0].idDelegue;
            var todoInsert = `INSERT INTO todolists (id_action, id_user) VALUES (${idAction},${idDelegue})`;
            notification.create({
              id_user:idDelegue,
              etat:6,
              text:"Nouvelle tâche "
            })
            sequelize.query(todoInsert, { type: sequelize.QueryTypes.INSERT }).then(function (rows) {
                for (const iterator in array[key]) {
                  var task = array[key][iterator].task;
                  var completed = array[key][iterator].completed;
                  var dateDebut = array[key][iterator].date_debut;
                  var dateFin = array[key][iterator].date_fin;
                  var idTodo = rows[0];
                  var todoInsert = `INSERT INTO ligne_todos (id_todo, task, completed, date_debut, date_fin) 
                  VALUES (${idTodo},'${task}',${completed},'${dateDebut}','${dateFin}')`;
                  sequelize.query(todoInsert, { type: sequelize.QueryTypes.INSERT }).then(function () {})
                }

            })
        }
    }
    return res.status(200).json({ message: "Success" });
    
  } catch (error) {
      console.log(error)
    return res
      .status(500)
      .json({ errors: error, message: "Probleme de connextion" });
  }
});
router.put("/update", auth, async (req, res) => {
  const completed = req.body.completed;
  const id = req.body.id;
  var token =(req.headers["x-access-token"])
  const decoded = jwt.verify(token, privateKey);
  var line = decoded.userauth.line;
  var getUserByLine = await user.findAll({
    where:{
      line:line,
      idrole:1
    }
  });
  var todo = await ligneTodo.findOne({where:{id:id}});
  var entities = Object.values(JSON.parse(JSON.stringify(getUserByLine)));
  
  var todoInsert = `UPDATE ligne_todos SET completed = ${completed}  WHERE id = ${id}`;
  sequelize.query(todoInsert, { type: sequelize.QueryTypes.UPDATE }).then(function (rows) {
    entities.forEach(e=>{
      notification.create({
        id_user:e.id,
        etat:7,
        text:"Tâche terminée: "+todo.task
      })
    })
    return res.status(200).json({ datas: rows, message: "Success Update" });
  })
 });
/*** start getTodoByAction ***/
function getTodo(idAction,idUser,idRole){
  return new Promise((resolve, reject)=>{
    var where =`where t.id_action = ${idAction}`
    if(parseInt(idRole) == 2)
      where +=` and t.id_user = ${idUser}`
    var sql = `SELECT t.* ,u.nomU,u.prenomU
    FROM todolists t
    left JOIN users u on u.id = t.id_user
    ${where}`;
    sequelize.query(sql, { type: sequelize.QueryTypes.SELECT })
      .then(function (results) {
        if (!results) {
          return reject(error);
        } else {
          return resolve(results);
        }
      });
  });
}
function getLigne(id){
  return new Promise((resolve, reject)=>{
    var sql = `SELECT l.*
    FROM ligne_todos l
    where l.id_todo = ${id}`;
    sequelize.query(sql, { type: sequelize.QueryTypes.SELECT })
      .then(function (results) {
        if (!results) {
          return reject(error);
        } else {
          return resolve(results);
        }
      });
  });
}

router.post("/getTodoByAction", auth, async(req, res) => { 
  var idAction = req.body.idAction; 
  var idUser = req.body.idUser;
  var idRole = req.body.idRole; 
  var array=[];
  var result = await getTodo(idAction,idUser,idRole);
  
  
  if(result.length!=0){
    for (const key in result) {
      var result1 = await getLigne(result[key].id);
      var resFinal = (Object.values(JSON.parse(JSON.stringify(result1))))
      for (const key1 in resFinal){
        resFinal[key1].idDelegue =  result[key].id_user;
        resFinal[key1].nomDelegue =  result[key].nomU+" "+result[key].prenomU;
        resFinal[key1].key = resFinal[key1].id;
      }
      array.push(resFinal)
    }
  }
  res.status(200).send({array});
})
/*** end getTodoByAction ***/
module.exports = router;
