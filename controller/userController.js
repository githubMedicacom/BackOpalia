const express = require("express");
const router = express.Router();
var user = require("../models/user");
var roles = require("../models/role");
const jwt = require("jsonwebtoken");
const privateKey = "mySecretKeyabs";
var bcrypt = require('bcrypt');
const auth = require("../middlewares/passport");

// Desplay all lignes of client ...
router.post("/addUser",auth, (req, res) => {
  var id = req.body.id;
  if (id == 0) {
    user
      .create({
        nomU: req.body.nomU,
        prenomU: req.body.prenomU,
        login: req.body.login,
        email: req.body.email,
        tel: req.body.tel,
        idrole: req.body.role,
        line: req.body.ligne,
        password: req.body.password,
        etat: 1,
        crm: req.body.crm,
        idsect: req.body.secteur,
        type: req.body.type,
      })
      .then((u) => {
        return res.status(200).send(true);
      })
      .catch((error) => {
        return res.status(403).send(false);
      });
  } else {
    user.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        var password="";
        if(req.body.password==""){password=r1.password;}
        else{	const salt = bcrypt.genSaltSync();
          password = bcrypt.hashSync(req.body.password, salt);}
        user
          .update(
            {
              nomU: req.body.nomU,
              prenomU: req.body.prenomU,
              login: req.body.login,
              email: req.body.email,
              tel: req.body.tel,
              idrole: req.body.role,
              line: req.body.ligne,
              password: password,
              etat: 1,
              crm: req.body.crm,
              idsect: req.body.secteur,
              type: req.body.type,
            },
            { where: { id: id } }
          )
          .then((u2) => {
            return res.status(200).send(true);
          })
          .catch((error) => {
            return res.status(403).send(false);
          });
      }
    });
  }
});
router.put("/changeEtat/:id",auth, (req, res) => {
  var id = req.params.id;
  //var etat = req.body.etat;
  user.findOne({ where: { id: id } }).then(function (r1) {
    var etat = 0;
    if(r1.dataValues.etat == 0)
      etat = 1;
    if (!r1) {
      return res.status(403).send(false);
    } else {
      user.update({
          etat: etat
        },{ where: { id: id } })
        .then((r2) => {
          return res.status(200).send(true);
        })
        .catch((error) => {
          return res.status(403).send(false);
        });
    }
  });
});
router.post("/allUser",auth, (req, res) => {
  var id = req.body.id;
  var idrole = req.body.idrole;
  var line = req.body.line;
  var where = {};
  if (idrole == 1) where = { line: line,idrole:2 };
  user
    .findAll({
      where:where,
      include: ["roles"],
      order:[["id","desc"]]
    })
    .then(function (r) {
      return res.status(200).send(r);
    });
});

router.post("/getActive", auth, (req, res) => {
  user
    .findAll({
      where:{etat:1},
      include: ["roles"],
    })
    .then(function (r) {
      return res.status(200).send(r);
    });
});

router.post("/getActiveDelegue", auth, (req, res) => {
  user.findAll({
      where:{etat:1,idrole:2},
      include: ["roles"],
    })
    .then(function (r) {
      return res.status(200).send(r);
    });
});
//getDelegueByLine
router.post("/getDelegueByLine/:line", auth, (req, res) => {
  var token =(req.headers["x-access-token"])
  const decoded = jwt.verify(token, privateKey);
  var idRole = decoded.userauth.idrole;
  var where = {etat:1,idrole:2,line:req.params.line};
  if(idRole == 0)
    where = {etat:1,idrole:2};
  user.findAll({
      where:where,
      include: ["roles"],
    })
    .then(function (r) {
      return res.status(200).send(r);
    });
});
//getSuperviseur
router.post("/getSuperviseur", auth, (req, res) => {
  var where = {etat:1,idrole:1};
  user.findAll({
      where:where,
      include: ["roles"],
    })
    .then(function (r) {
      return res.status(200).send(r);
    });
});

//Delete client
router.delete("/deleteUser/:id",auth, (req, res) => {
  var id = req.params.id;
  user.findOne({ where: { id: id } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      user
        .destroy({ where: { id: id } })
        .then((u2) => {
          return res.status(200).send(true);
        })
        .catch((error) => {
          return res.status(403).send(false);
        });
    }
  });
});
router.post("/getUser",auth, (req, res) => {
  var id = req.headers["id"];
  user.findOne({ where: { id: id } }).then(function (u1) {
    if (!u1) {
      return res.status(403).send(false);
    } else {
      return res.status(200).json(u1.dataValues);
    }
  });
});
router.post("/login", (req, res) => {
  var login = req.body.login;
  var password = req.body.password;
  user
    .findOne({ 
      include: ["roles"],where: { login: login,etat:1 } })
    .then(function (u1) {
      if (!u1) {
        /* return res.status(403).send(false); */
        res.status(401).send({ message: "L'utilisateur n'existe pas" });
      } else if (!u1.validPassword(password)) {
        res.status(401).send({ message: "Verfier votre Login / Mot de passe!" });
        /* return res.status(403).send(false); */
      } else {
        const payload = {
          //login: newdata.login,
          userauth: u1.dataValues,
        };
        const token = jwt.sign(payload, privateKey, {
          //   expiresIn: "2h",
        });
        return res.status(200).send({ data: u1.dataValues, token: token,message:true });
      }
    })
    .catch((error) => {
      return res.status(500).send(false);
    });
});
router.post("/updateProfile", auth, (req, res) => {
  var id = req.body.id;
    user.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        var password="";
        if(req.body.password==""){password=r1.password;}
        else{	const salt = bcrypt.genSaltSync();
          password = bcrypt.hashSync(req.body.password, salt);}
        user.update(
            {
              nom: req.body.nom,
              login: req.body.login,
              tel: req.body.tel,
              password: password,
              etat: 1,
            },
            { where: { id: id } }
          )
          .then((u2) => {
            return res.status(200).send(true);
          })
          .catch((error) => {
            return res.status(403).send(false);
          });
       }
    });
 
});
router.post("/getDelegueByLineAction/:line", auth, (req, res) => {
  var where = { etat: 1, idrole: 2, line: req.params.line };
  user
    .findAll({
      where: where,
      include: ["roles"],
    })
    .then(function (r) {
      return res.status(200).send(r);
    });
});

module.exports = router; 
