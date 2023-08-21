const express = require("express");
const router = express.Router();
var ReleveVente = require("../models/releveVente");
var LigneReleveVente = require("../models/ligne_releve_vente");
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

router.post("/allReleveVente", auth, (req, res) => {
  // console.log(ligneReleveMedical)
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var idrole = decoded.userauth.idrole;
  var id = req.body.id;
  var annee = req.body.annee;
  var where = { type: 2 };
  var whereL = { annee: annee };
  where = { id_userBi: id, type: 2 };
  LigneReleveVente
    .findAll({
      where: whereL,
      include: [
        {
          model: ReleveVente,
          as: "releves_ventes",
          where: where,
          include: ["users"],
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



router.get("/getDetailReleveVente/:id", auth, async (req, res) => {
  var l = await LigneReleveVente.findAll({
    where: { id_releve_vente: req.params.id },
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
      "fournisseurs",
    ],
  });
  return res.status(200).send(l);
});


router.delete("/deletereleve/:id", auth, async (req, res) => {
  var id = req.params.id;
  var blFind = await ReleveVente.findOne({ where: { id: req.params.id } });
  if (blFind != null) {
    var file = blFind.dataValues.file;
    if (file != "")
      if (fs.existsSync(`${files.files.releve}/${file}`))
        fs.unlinkSync(`${files.files.releve}/${file}`);
    LigneReleveVente
      .destroy({ where: { id_releve_vente: id } })
      .then((r2) => {
        ReleveVente.destroy({ where: { id: id } }).then((r2) => {
          return res.status(200).send(true);
        });
      })
      .catch((error) => {
        return res.status(403).send(false);
      });
  }
});


router.post("/allReleveList", auth, (req, res) => {
  var id = req.body.idUserBi;
  var annee = req.body.annee;
  var where = { id_userBi: id, annee: annee,  };
  ReleveVente.findAll({
    where: where,
    include: ["users"],
  }).then(function (r) {
    return res.status(200).send(r);
  });
});


router.post("/verifReleve", auth, (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var id = decoded.userauth.id;
  var annee = req.body.annee;
  var namefile = req.body.namefile;
  where = {
    annee: annee,
    id_userBi: id,
    namefile: namefile,
  };
  LigneReleveVente.findAll({
    include: [
      {
        model: ReleveVente,
        as: "releves_ventes",
        where: where,
        include: ["users"],
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

router.post("/releveVenteAddedExcel", auth, async (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var id = decoded.userauth.id;
  var annee = req.body.annee;
  var namefile = req.body.namefile;
  var typeGro = req.body.typeGro;
  var file = req.body.file;

  ReleveVente.create({
    file: file,
    namefile: namefile,
    annee: annee,
    type: typeGro,
    id_userBi: id,
  })
    .then((r) => {
      var array = [];
      req.body.ligneReleve.forEach((e) => {
        console.log(e)
        if(e.idFrs == null){
          idf = null
        }
        else {
          idf = e.idFrs 
        }
        console.log(idf)
        array.push({
          id_releve_vente: r.id,
          id_produit: e.idProduit,
          type: 2,
          mesure: e.vente,
          annee: annee,
          mois: e.mois,
          id_fournisseur: idf,
        });
      });

      req.body.ligne.forEach((e, index) => {
        if (array[index]) {
          array[index].id_fournisseur = e.idFrs;
        }
      });

      LigneReleveVente.bulkCreate(array).then(() => {});

      return res.status(200).send(true);
    })
    .catch((error) => {
      console.log(error);
      return res.status(403).send(error);
    });
});

// router.post("/releveAdded", auth, async (req, res) => {
//   console.log(req.body, "hello");
//   var token = req.headers["x-access-token"];
//   const decoded = jwt.verify(token, privateKey);
//   var id_delegue = decoded.userauth.id;
//   ReleveMedical.create({
//     id_fournisseur: req.body.four,
//     file: req.body.file,
//     namefile: req.body.namefile,
//     id_delegue: id_delegue,
//     annee: req.body.annee,
//     mois: req.body.mois,
//     type: req.body.typeGro,
//   })
//     .then((r) => {
//       var mois = req.body.mois;
//       var annee = req.body.annee;
//       if (req.body.type == 0) {
//         if (mois == 12) {
//           mois = 1;
//           annee = parseInt(annee) + 1;
//         } else {
//           mois = parseInt(mois) + 1;
//         }
//       }

//       var array = [];
//       req.body.ligneReleve.forEach((e) => {
//         if (req.body.type == 0 || req.body.type == 1) {
//           array.push({
//             id_releve_medical: r.id,
//             id_produit: e.idProduit,
//             type: 1,
//             mesure: e.stock,
//             annee: annee,
//             mois: mois,
//           });
//         }

//         if (req.body.type == 0 || req.body.type == 2) {
//           array.push({
//             id_releve_medical: r.id,
//             id_produit: e.idProduit,
//             type: 2,
//             mesure: e.stock,
//             annee: annee,
//             mois: mois,
//           });
//         }
//       });

//       ligneReleveMedical.bulkCreate(array).then(() => {});

//       return res.status(200).send(true);
//     })
//     .catch((error) => {
//       console.log(error);
//       return res.status(403).send(error);
//     });
// });


router.get("/getFileReleveVente/:id", async (req, res) => {
  var id = req.params.id;
  var blFind = await ReleveVente.findOne({ where: { id: id } });
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
            arrayCode.indexOf(jsondata[i].code.toString()) >= 0
          ) {
            var index = arrayCode.indexOf(jsondata[i].code.toString());
            var idParent = arrayId[index];
            if (arrayCode.indexOf(jsondata[i].code.toString()) >= 0)
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
              arrayDes.indexOf(jsondata[i].designation.toLowerCase()) >= 0
            ) {
              var index = arrayDes.indexOf(
                jsondata[i].designation.toLowerCase()
              );
              var idParent = arrayId[index];
              /* arrayDesFinal.push([jsondata[i].Designation.toUpperCase(),100,index]); */
              arrayDesFinal.push([
                jsondata[i].designation.toUpperCase(),
                100,
                idParent,
              ]);
            } else {
              if (jsondata[i].code != null || jsondata[i].designation != null) {
                options = {
                  scorer: fuzz.ratio, // Any function that takes two values and returns a score, default: ratio
                  limit: 2, // Max number of top results to return, default: no limit / 0.
                  cutoff: 89, // Lowest score to return, default: 0
                  nsorted: false, // Results won't be sorted if true, default: false. If true limit will be ignored.
                };
                if (jsondata[i].designation) {
                  var arrayScore = fuzz.extract(
                    jsondata[i].designation.toLowerCase().trim(),
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

router.post("/cheeckFournisseur", auth, (req, res) => {
  var tableau = req.body;
  fournisseur.findAll({ where: { etat: 1 } }).then(function (rowsdes) {
    if (rowsdes) {
      var arrayDes = [];
      var arrayCode = [];
      var arrayDesFinal = [];
      for (i = 0; i < rowsdes.length; i++) {
        arrayDes[rowsdes[i].id] = rowsdes[i].nom;
      }

      for (i = 0; i < tableau.length; i++) {
        if (arrayDes.indexOf(tableau[i].codeFr) >= 0) {
          var index = arrayDes.indexOf(tableau[i].codeFr);
          arrayDesFinal.push([tableau[i].codeFr, 100, index]);
        } else {
          options = {
            scorer: fuzz.ratio, // Any function that takes two values and returns a score, default: ratio
            limit: 2, // Max number of top results to return, default: no limit / 0.
            cutoff: 80, // Lowest score to return, default: 0
            nsorted: false, // Results won't be sorted if true, default: false. If true limit will be ignored.
          };

          arrayDesFinal.push(
            fuzz.extract(tableau[i].codeFr, arrayDes, options)[0]
          );
          /* } */
        }
      }

      return res.send(arrayDesFinal);
    }
  });
});

router.post("/allReleveVenteBi", auth, (req, res) => {
  var id = req.body.id;
  var annee = req.body.annee;
  var whereL = { annee: annee , id_userBi: id };

  LigneReleveVente
    .findAll({
      include: [
        {
          model: ReleveVente,
          as: "releves_ventes",
          where: whereL,
          include: ["users"],
        },
        {
          model: produit,
          as: "produits",
         
        },
        {
          model: fournisseur,
          as: "fournisseurs",
        },
      ],
    })
    .then(function (r) {
      return res.status(200).send(r);
    });
});

module.exports = router;
