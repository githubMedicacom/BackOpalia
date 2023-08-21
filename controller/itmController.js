const express = require("express");
const router = express.Router();
var produit = require("../models/produit");
var user = require("../models/user");
var itm = require("../models/itm");
const auth = require("../middlewares/passport");
const jwt = require("jsonwebtoken");
const privateKey = "mySecretKeyabs";
const multer = require("multer");
var fs = require("fs");
var configuration = require("../config");
var Sequelize = require("sequelize");
var files = require("../config-file");
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

// all itm grossiste
router.post("/allItm", auth, (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var idrole = decoded.userauth.idrole;
  var id = req.body.id;
  var annee = req.body.annee;
  var whereL = { annee: annee };
  itm
    .findAll({
      where: whereL ,      
      order: [["id", "DESC"]],
    })
    .then(function (r) {
      return res.status(200).send(r);
    });
});

router.delete("/delete/:id", auth, async (req, res) => {
  var id = req.params.id;
  var itmFind = await itm.findOne({ where: { id: req.params.id } });
  console.log('helloo',itmFind)
  if (itmFind != null) {
    var file = itmFind.dataValues.file;
    if (file != "")  if (fs.existsSync(`${files.files.itm}/${file}`)) fs.unlinkSync(`${files.files.itm}/${file}`);  
        itm.destroy({ where: { id: id } }).then((r2) => {
          return res.status(200).send(true);
        })
      .catch((error) => {
        return res.status(403).send(false);
      });
  }
});


//file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, files.files.itm);
  },
  filename: function (req, file, cb) {
    var splitF = file.originalname.split(".");
    var extensionFile = splitF[splitF.length - 1];
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + extensionFile);
  },
});
const upload = multer({ storage: storage });
router.post("/saveFile", auth, upload.single("file"), (req, res) => {
  res.send({ filename: req.file.filename });
});


router.post("/itmAdded", auth, async (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var id_delegue = decoded.userauth.id;
  itm
    .create({
      titre: req.body.titre,
      file: req.body.file,
      annee: req.body.annee,
      mois: req.body.mois,
      type: req.body.type,
    })
    .then((r) => {
      return res.status(200).send(true);
    })
    .catch((error) => {
      console.log(error);
      return res.status(403).send(error);
    });
});
router.get("/getFileItm/:id", async (req, res) => {
  var id = req.params.id;
  var itmFind = await itm.findOne({ where: { id: id } });
  if (itmFind != null) {
    var file = itmFind.dataValues.file;
    if (file) {
      if (fs.existsSync(`${files.files.itm}/${file}`)) {
        /* var file = fs.createReadStream("./itm/" + file); */
        var file = fs.createReadStream(`${files.files.itm}/${file}`);
        file.pipe(res);
      } else return res.status(403).json({ message: false });
    } else {
      return res.status(403).json({ message: false });
    }
  }
});


module.exports = router;
