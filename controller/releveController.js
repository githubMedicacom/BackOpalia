const express = require("express");
const router = express.Router();
var releve = require("../models/releve");
var ligneReleve = require("../models/ligne_releve");
var produit = require("../models/produit");
var user = require("../models/user");
var fournisseur = require("../models/fournisseur");
var notification = require("../models/notification");
var produitfour = require("../models/produitfour");
const auth = require("../middlewares/passport");
const jwt = require("jsonwebtoken");
const privateKey = "mySecretKeyabs";
const multer = require("multer");
var fs = require("fs");
const fuzz = require("fuzzball");
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

// all releve grossiste
router.post("/allReleve", auth, (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var idrole = decoded.userauth.idrole;
  var id = req.body.id;
  var annee = req.body.annee;
  var where = { type: 1 };
  var whereL = { annee: annee };
  if (idrole == 2) where = { id_delegue: id, type: 1 };
  ligneReleve
    .findAll({
      where: whereL,
      include: [
        {
          model: releve,
          as: "releves",
          where: where,
          include: ["users", "fournisseurs"],
        },
        {
          model: produit,
          as: "produits",
          where: { bi: 1 },
        },
      ],
    })
    .then(function (r) {
      return res.status(200).send(r);
    });
});

router.get("/getDetailReleve/:id", auth, async (req, res) => {
  var l = await ligneReleve.findAll({
    where: { id_releve: req.params.id },
    include: [
      /* {
        model:bl,
        as:"bls",
        include:{
          model:user,
          as:"users"
        }
      }, */
      "produits",
      "releves",
    ],
  });
  return res.status(200).send(l);
});

/// Update Releve
router.put("/updateReleve/:id", auth, async (req, res) => {
  var id = req.params.id;
  var date =  req.body.date ;
  releve
  .update(
    {
      createdAt: date,
    },
    { where: { id: id } }
  )
  ligneReleve.destroy({ where: { id_releve: id } }).then(async () => {
    var arrayLigne = [];
    req.body.ligne.forEach(async (e) => {
      arrayLigne.push({
        id_releve: id,
        mesure: e.Mesure,
        annee: e.annee,
        mois: parseInt(e.Mois),
        id_produit: e.idProduit,
        type: e.Type,
      });
    });
    await ligneReleve.bulkCreate(arrayLigne).then(() => {});
    return res.status(200).send(true);
  });
});



router.delete("/delete/:id", auth, async (req, res) => {
  var id = req.params.id;
  var blFind = await releve.findOne({ where: { id: req.params.id } });
  if (blFind != null) {
    var file = blFind.dataValues.file;
    if (file != "")
      if (fs.existsSync(`${files.files.releve}/${file}`))
        fs.unlinkSync(`${files.files.releve}/${file}`);
    ligneReleve
      .destroy({ where: { id_releve: id } })
      .then((r2) => {
        releve.destroy({ where: { id: id } }).then((r2) => {
          return res.status(200).send(true);
        });
      })
      .catch((error) => {
        return res.status(403).send(false);
      });
  }
});


router.post("/allReleveList", auth, (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var idrole = decoded.userauth.idrole;
  var grossiste = req.body.grossiste;
  var id = req.body.idDelegue;
  var annee = req.body.annee;
  where = { annee: annee };

  if (idrole == 2) {
    if (grossiste != 0) {
      where = { id_delegue: id, annee: annee, id_fournisseur: grossiste };
    } else {
      where = { id_delegue: id, annee: annee };
    }
  } else {
    if (grossiste != 0) where = { annee: annee, id_fournisseur: grossiste };
    if (id != 0) {
      Object.assign(where, { id_delegue: id });
    }
  }
  releve
    .findAll({
      where: where,
      include: ["users", "fournisseurs"],  order: [["id", "DESC"]],
    })
    .then(function (r) {
      return res.status(200).send(r);
    });
});
router.post("/verifReleve", auth, (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var id = decoded.userauth.id;
  var annee = req.body.annee;
  var mois = req.body.mois;
  var namefile = req.body.namefile;
  var fournisseur = req.body.fournisseur;
  where = {
    annee: annee,
    id_delegue: id,
    mois: parseInt(mois),
    id_fournisseur: fournisseur,
    namefile: namefile,
  };
  ligneReleve
    .findAll({
      include: [
        {
          model: releve,
          as: "releves",
          where: where,
          include: ["users", "fournisseurs"],
        },
        "produits",
      ],
    })
    .then(function (r) {
      if (r.length > 0) return res.status(200).send(true);
      else return res.status(200).send(false);
    })
    .catch((error) => {
      return res.status(403).send(error);
    });
});

//file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, files.files.releve);
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

router.post("/releveAddedExcel", auth, async (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var idrole = decoded.userauth.idrole;
  var id_delegue = decoded.userauth.id;

  if (idrole === 3) {
    var id_delegue = req.body.id_delegue;

  } else {
    var id_delegue = decoded.userauth.id;
  }
  releve
    .create({
      id_fournisseur: req.body.four,
      file: req.body.file,
      namefile: req.body.namefile,
      id_delegue: id_delegue,
      annee: req.body.annee,
      mois: req.body.mois,
      type: req.body.typeGro,
    })
    .then((r) => {
      var mois = req.body.mois;
      var annee = req.body.annee;
      if (mois == 12) {
        mois = 1;
        annee = parseInt(annee) + 1;
      } else {
        mois = parseInt(mois) + 1;
      }
      req.body.ligneReleve.forEach((e) => {
        if (parseInt(req.body.type) == 0) {
          ligneReleve.create({
            id_releve: r.id,
            id_produit: e.idProduit,
            type: 1,
            mesure: e.stock,
            annee: annee,
            mois: mois,
            date: e.date,
          });

          ligneReleve.create({
            id_releve: r.id,
            id_produit: e.idProduit,
            type: 2,
            mesure: e.vente,
            annee: req.body.annee,
            mois: req.body.mois,
            date: e.date,
          });
        } else if (parseInt(req.body.type) == 1) {
          ligneReleve.create({
            id_releve: r.id,
            id_produit: e.idProduit,
            type: 1,
            mesure: e.stock,
            annee: annee,
            mois: mois,
            date: e.date,
          });
        } else {
          ligneReleve.create({
            id_releve: r.id,
            id_produit: e.idProduit,
            type: 2,
            mesure: e.vente,
            annee: req.body.annee,
            mois: req.body.mois,
            date: e.date,
          });
        }
      });

      return res.status(200).send(true);
    })
    .catch((error) => {
      console.log(error);
      return res.status(403).send(error);
    });
});

router.post("/releveAdded", auth, async (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var idrole = decoded.userauth.idrole;
  
  if (idrole === 3) {
    var id_delegue = req.body.id_delegue;

  } else {
    var id_delegue = decoded.userauth.id;
  }
  releve
    .create({
      id_fournisseur: req.body.four,
      file: req.body.file,
      namefile: req.body.namefile,
      id_delegue: id_delegue,
      annee: req.body.annee,
      mois: req.body.mois,
      type: req.body.typeGro,
    })
    .then((r) => {
      var mois = req.body.mois;
      var annee = req.body.annee;
      if (req.body.type == 0 || req.body.type == 1) {
        if (mois == 12) {
          mois = 1;
          annee = parseInt(annee) + 1;
        } else {
          mois = parseInt(mois) + 1;
        }
      }
      req.body.ligneReleve.forEach((e) => {
        if (req.body.type == 0 || req.body.type == 1)
          ligneReleve.create({
            id_releve: r.id,
            id_produit: e.idProduit,
            type: 1,
            mesure: e.stock,
            annee: annee,
            mois: mois,
          });
        if (req.body.type == 0 || req.body.type == 2)
          ligneReleve.create({
            id_releve: r.id,
            id_produit: e.idProduit,
            type: 2,
            mesure: e.vente,
            annee: req.body.annee,
            mois: req.body.mois,
          });
      });

      return res.status(200).send(true);
    })
    .catch((error) => {
      console.log(error);
      return res.status(403).send(error);
    });
});
router.get("/getFileReleve/:id", async (req, res) => {
  var id = req.params.id;
  var blFind = await releve.findOne({ where: { id: id } });
  if (blFind != null) {
    var file = blFind.dataValues.file;
    if (file) {
      if (fs.existsSync(`${files.files.releve}/${file}`)) {
        /* var file = fs.createReadStream("./releve/" + file); */
        var file = fs.createReadStream(`${files.files.releve}/${file}`);
        file.pipe(res);
      } else return res.status(403).json({ message: false });
    } else {
      return res.status(403).json({ message: false });
    }
  }
});
router.post("/cheeckProduit", auth, async (req, res) => {
  var jsondata = req.body;
  produit
    .findAll({ where: { etat: 1 } })
    .then(async function (rowsdes) {
      if (!rowsdes) {
        return res.status(403).send(false);
      } else {
        var arrayDes = [];
        var arrayId = [];
        var arrayCode = [];
        var arrayDesFinal = [];
        var notif = 0;
        for (i = 0; i < rowsdes.length; i++) {
          arrayDes[rowsdes[i].id] = rowsdes[i].dataValues.designation
            .trim()
            .toLowerCase();
          arrayCode[rowsdes[i].id] = rowsdes[i].dataValues.code;
          arrayId[rowsdes[i].id] = rowsdes[i].dataValues.parent;
        }
        /* for (i = 0; i < jsondata.length; i++) { */
        for (const i in jsondata) {
          if (
            jsondata[i].code != "" &&
            jsondata[i].code != null &&
            arrayCode.indexOf(jsondata[i].code.toString().trim()) >= 0
          ) {
            var index = arrayCode.indexOf(jsondata[i].code.toString().trim());
            var idParent = arrayId[index];
            if (arrayCode.indexOf(jsondata[i].code.toString().trim()) >= 0)
              arrayDesFinal.push([
                arrayDes[index].toUpperCase(),
                100,
                idParent,
              ]);
            /* arrayDesFinal.push([arrayDes[index].toUpperCase(),100,index]); */
          } else {
            if (
              jsondata[i].designation != undefined &&
              jsondata[i].designation != "" &&
              jsondata[i].designation != null &&
              arrayDes.indexOf(
                jsondata[i].designation.toString().toLowerCase()
              ) >= 0
            ) {
              var index = arrayDes.indexOf(
                jsondata[i].designation.toString().toLowerCase()
              );
              var idParent = arrayId[index];
              /* arrayDesFinal.push([jsondata[i].Designation.toUpperCase(),100,index]); */
              arrayDesFinal.push([
                jsondata[i].designation.toString().toUpperCase(),
                100,
                idParent,
              ]);
            } else {
              if (
                jsondata[i].code != null ||
                jsondata[i].toString().designation != null
              ) {
                options = {
                  scorer: fuzz.ratio, // Any function that takes two values and returns a score, default: ratio
                  limit: 2, // Max number of top results to return, default: no limit / 0.
                  cutoff: 95, // Lowest score to return, default: 0
                  nsorted: false, // Results won't be sorted if true, default: false. If true limit will be ignored.
                };
                if (jsondata[i].designation) {
                  var arrayScore = fuzz.extract(
                    jsondata[i].designation.toString().toLowerCase().trim(),
                    arrayDes,
                    options
                  )[0];
                  if (arrayScore) {
                    arrayScore[2] = arrayId[arrayScore[2]];
                  }
                  arrayDesFinal.push(arrayScore);
                  if (arrayScore == undefined) {
                    var des = jsondata[i].designation;
                    var admin = await user.findOne({ where: { idrole: 0 } });
                    if (notif == 0) {
                      notification.create({
                        id_user: admin.dataValues.id,
                        etat: 4,
                        text: "Nouveau produit ",
                      });
                    }
                    notif++;
                    var findDes = await produitfour.findOne({
                      where: { designation: jsondata[i].designation },
                    });
                    if (findDes == null) {
                      produitfour.create({
                        designation: des,
                        fournisseur: null,
                      });
                    }
                  }
                }
              }
            }
          }
        }
        return res.status(200).send(arrayDesFinal);
      }
    })
    .catch((error) => {
      console.log(error);
      return res.status(403).send(error);
    });
});
router.post("/allReleveBi", auth, (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var idrole = decoded.userauth.idrole;
  var id = req.body.id;
  var annee = req.body.annee;
  var mois = req.body.mois;
  var where = {};
  var whereL = { annee: annee };
  if (mois != 0) {
    var whereL = { annee: annee, mois: mois };
  }
  if (idrole == 2) where = { id_delegue: id };
  ligneReleve
    .findAll({
      where: whereL,
      include: [
        {
          model: releve,
          as: "releves",
          where: where,
          include: ["users", "fournisseurs"],
        },
        {
          model: produit,
          as: "produits",
          where: { bi: 1 },
        },
      ],
    })
    .then(function (r) {
      return res.status(200).send(r);
    });
});

module.exports = router;
