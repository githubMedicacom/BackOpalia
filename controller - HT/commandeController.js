const express = require("express");
const router = express.Router();
var user = require("../models/user");
var commande = require("../models/commande");
var bl = require("../models/bl");
var ligneBl = require("../models/ligneBl");
var pharmacie = require("../models/pharmacie");
var actionComercial = require("../models/actionComercial");
var commande_bl = require("../models/commande_bl");
var configuration = require("../config");
var Sequelize = require("sequelize");
var notification = require("../models/notification");
var marcheIms = require("../models/marcheIms");
var produit = require("../models/produit");
var fs = require("fs");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const privateKey = "mySecretKeyabs";
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
const actiondelegues = require("../models/actionDelegue");

//Decharge
const storageDecharge = multer.diskStorage({
  destination: function (req, file, cb) {
    /* cb(null, "/home/ubuntu/medis/decharge"); */
    cb(null, "./decharge");
  },
  filename: function (req, file, cb) {
    var splitF = file.originalname.split(".");
    var extensionFile = splitF[1];
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + extensionFile);
    /* cb(null, file.originalname); */
  },
});
const decharge = multer({ storage: storageDecharge });

// Desplay all lignes of client ...
function insertCmd(obj, idBls) {
  return new Promise((resolve, reject) => {
    var dateCreate = new Date(); // Or the date you'd like converted.
    var date = new Date(
      dateCreate.getTime() - dateCreate.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 10);
    var mm = dateCreate.getMonth() + 1;
    commande
      .create({
        id_action: obj.id_action,
        id_user: obj.id_user,
        id_pharmacie: obj.id_pharmacie,
        id_segment: obj.id_segment,
        etat: obj.etat === 1 ? 1 : 6,
        note: obj.nom_prenom + " : " + obj.note + " " + date,
        date: date,
        total: parseFloat(obj.total),
        mois: mm,
        trimestre: obj.trimestre,
      })
      .then((results) => {
        /* seg_pharma.update(
          { etat: obj.etat },
          { where: { id_pharmacie: obj.id_pharmacie, Segment: obj.id_segment } } 
        ); */
        var splitBl = idBls.split(",");
        var arrayCmd = [];
        splitBl.forEach((val) => {
          arrayCmd.push({
            id_cmd: results.dataValues.id,
            id_bl: val,
          });
        });
        commande_bl.bulkCreate(arrayCmd).then(() => {});
        bl.update(
          { etatCmd: 1, mois: mm },
          {
            where: {
              client: obj.id_pharmacie,
              iduser: obj.id_user,
              id: splitBl,
            },
          }
        );
        return resolve(results);
      })
      .catch((error) => {
        console.log(error);
        return reject(error);
      });
  });
}

// Desplay all lignes of client ...
function removeLigne(idCmd) {
  return new Promise(async (resolve, reject) => {
    var findCmd = await commande.findOne({ where: { id: idCmd } });
    var findCmdBl = await commande_bl.findAll({ where: { id_cmd: idCmd } });
    if (findCmd) {
      if (findCmdBl.length > 0) {
        await commande_bl.destroy({ where: { id_cmd: idCmd } });
        var arrayBl = [];
        for (const key in findCmdBl) {
          const element = findCmdBl[key];
          arrayBl.push(element.id_bl);
        }
        bl.update({ etatCmd: 0, mois: null }, { where: { id: arrayBl } });
      }
      await commande.destroy({ where: { id: idCmd } });
      /* bl.update(
        { etatCmd: 0, mois:null }); */
    }
    /* commande
      .create({
        id_action: obj.id_action,
        id_user: obj.id_user,
        id_pharmacie: obj.id_pharmacie,
        id_segment: obj.id_segment,
        etat: obj.etat,
        note: obj.note,
        date:date,
        total:obj.total,
        mois:mm
      })
      .then((results) => {
        seg_pharma.update(
          { etat: obj.etat },
          { where: { id_pharmacie: obj.id_pharmacie, Segment: obj.id_segment } }
        );
        return resolve(results);
      })
      .catch((error) => {
        console.log(error);
        return reject(error);
      }); */
  });
}

router.post("/addCommande", auth, async (req, res) => {
  // etat 1: oui delegue *** 2:non delegue *** 3:oui superviseur *** 4: non superviseur *** 5: refuse admin *** 6: refuse admin superviseur *** 7: recommande
  //etat 8: Valide chef *** 9:Invalide chef
  var id_action = req.body.id_action;
  var id_user = req.body.id_user;
  var id_pharmacie = req.body.id_pharmacie;
  var id_segment = req.body.id_segment;
  var etat = req.body.etat;
  var note = req.body.note;
  var total = req.body.total;
  var idBls = req.body.idBls;
  var id_cmd = req.body.id_cmd;
  var nom_prenom = req.body.nom_prenom;
  var trimestre = req.body.trimestre;
  var obj = {
    id_action: id_action,
    id_user: id_user,
    id_pharmacie: id_pharmacie,
    id_segment: id_segment,
    etat: etat,
    note: note,
    total: total,
    trimestre: trimestre,
    nom_prenom: nom_prenom,
  };
  var pharmaFind = await pharmacie.findOne({ where: { id: id_pharmacie } });
  var text = `Commande pharmacie :${pharmaFind.dataValues.nom}`;
  switch (etat) {
    case 1:
    case 3:
      text += ` clôturer`;
      break;
    default:
      text += ` refusée`;
      break;
  }
  var cmd = null;
  if (etat == 1 || etat == 2) {
    var etatNotif = etat == 1 ? 8 : 9;
    var userFind = await user.findOne({ where: { id: id_user } });
    var userFindByline = await user.findAll({
      where: { line: userFind.dataValues.line, idrole: 1 },
    });
    userFindByline.forEach((e) => {
      notification.create({
        id_user: e.dataValues.id,
        etat: etatNotif,
        text: text,
      });
    });
  } else {
    var cmd = await commande.findOne({
      where: { id: id_cmd },
    });
    var etatNotif = etat == 3 ? 10 : 11;
    notification.create({
      id_user: cmd.dataValues.id_user,
      etat: etatNotif,
      text: text,
    });
  }
  var mois = new Date().getMonth() + 1;
  /* var userFind=await user.findOne({ where: { id: id_user } });
  var userFindByline=await findAll(userFind.dataValues.line); */
  // etat 1: oui delegue *** 2:non delegue *** 3:oui superviseur *** 4: non superviseur *** 5: refuse admin *** 6: refuse admin superviseur *** 7: recommande

  var dateCreate = new Date(); // Or the date you'd like converted.
  var date = new Date(
    dateCreate.getTime() - dateCreate.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);
  switch (etat) {
    case 1:
    case 2:
      {
        insertCmd(obj, idBls);
      }
      break;
    case 4:
    case 5:
    case 6:
    case 8:
      {
        commande.update(
          {
            etat: etat,
            note:
              cmd.dataValues.note + "," + nom_prenom + ":" + note + " " + date,
          },
          { where: { id: id_cmd } }
        );
      }
      break;
    case 3:
      {
        commande.update(
          {
            etat: etat,
            note:
              cmd.dataValues.note + "," + nom_prenom + ":" + note + " " + date,
            mois: mois,
          },
          { where: { id: id_cmd } }
        );
      }
      break;
    case 9:
      {
        commande.update(
          {
            etat: 2,
            note:
              cmd.dataValues.note + "," + nom_prenom + ":" + note + " " + date,
          },
          { where: { id: id_cmd } }
        );
      }
      break;
    default:
      {
        removeLigne(id_cmd);
      }
      break;
  }
  return res.status(200).send(true);
});
router.get("/getCommande/:idAction/:trimestre", auth, async (req, res) => {
  var idAction = req.params.idAction;
  var trimestre = parseInt(req.params.trimestre);
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var idUser = decoded.userauth.id;
  var idRole = decoded.userauth.idrole;
  var line = decoded.userauth.line;

  var where = { id_action: idAction, etat: [3], trimestre: trimestre };
  if (idRole == 2)
    where = {
      id_action: idAction,
      etat: [3],
      id_user: idUser,
      trimestre: trimestre,
    };

  var whereR = { id_action: idAction, etat: [5], trimestre: trimestre };
  if (idRole == 2)
    whereR = {
      id_action: idAction,
      etat: [4, 6],
      id_user: idUser,
      trimestre: trimestre,
    };
  var whereU = idRole === 1 ? { line: line } : {};
  console.log("getCommande", where, whereR);
  try {
    var findCmd = await commande.findAll({
      where: where,
      include: [
        "pharmacies",
        "segments",
        { model: user, as: "users", where: whereU },
      ],
      order: [["id", "desc"]],
    });
    var findCmdR = await commande.findAll({
      where: whereR,
      include: [
        "pharmacies",
        "segments",
        { model: user, as: "users", where: whereU },
      ],
      order: [["id", "desc"]],
    });
    return res.status(200).send({ findCmd, findCmdR });
  } catch (error) {
    return res.status(403).send(error);
  }
});

router.get("/getCommandeByEtat/:idAction/:trimestre", auth, (req, res) => {
  var idAction = req.params.idAction;
  var trimestre = req.params.trimestre;
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var idUser = decoded.userauth.id;
  var idRole = decoded.userauth.idrole;
  var line = decoded.userauth.line;
  var where =
    idRole === 2
      ? {
          id_action: idAction,
          etat: [1, 2],
          id_user: idUser,
          trimestre: trimestre,
        }
      : idRole === 1
      ? { id_action: idAction, etat: [1, 2], trimestre: trimestre }
      : { id_action: idAction, etat: [1, 2], trimestre: trimestre };
  var whereU = idRole === 1 ? { line: line } : {};
  commande
    .findAll({
      where: where,
      include: [
        "pharmacies",
        "segments",
        { model: user, as: "users", where: whereU },
      ],
      order: [["id", "desc"]],
    })
    .then(async function (rows) {
      var list = [];
      if (rows.length != 0) {
        rows.forEach((e) => {
          list.push({
            delegue: e.users.nomU + " " + e.users.prenomU,
            Pharmacie: e.pharmacies.nom,
            Segment: e.segments.id,
            id: e.id,
            id_pharmacie: e.id_pharmacie,
            nomSeg: e.segments.nom,
            note: e.note,
            etat: e.etat,
            total: e.total.toFixed(3),
          });
        });
      }
      return res.status(200).send({
        rows: list,
      });
    });
});
router.post(
  "/saveDecharge/:id",
  auth,
  decharge.single("file"),
  async (req, res) => {
    var id = req.params.id;
    var date = new Date(); // Or the date you'd like converted.
    var datePayement = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 10);
    var blFind = await commande.findOne({ where: { id: id } });
    if (blFind != null) {
      commande
        .update(
          {
            datePayement: datePayement,
            payer: 1,
            decharge: req.file.filename,
          },
          { where: { id: id } }
        )
        .then(() => {
          return res.status(200).send(true);
        })
        .catch((error) => {
          return res.status(403).send(false);
        });
    }
  }
);
router.get("/getDecharge/:id", async (req, res) => {
  var id = req.params.id;
  var blFind = await commande.findOne({ where: { id: id } });
  if (blFind != null) {
    var file = blFind.dataValues.decharge;
    if (file) {
      if (fs.existsSync("./decharge/" + file)) {
        var file = fs.createReadStream("./decharge/" + file);
        file.pipe(res);
      } else return res.status(403).json({ message: false });
    } else {
      return res.status(403).json({ message: false });
    }
  }
});
router.get("/getAllParmacieCmd", auth, (req, res) => {
  commande
    .findAll({
      include: [
        {
          attributes: ["id", "nom"],
          model: pharmacie,
          as: "pharmacies",
        },
      ],
      group: ["id_pharmacie"],
    })
    .then(function (client) {
      var arrayOption = [];
      arrayOption.push({
        value: 0,
        label: "Tous",
      });
      client.forEach((elem) => {
        arrayOption.push({
          value: elem.pharmacies.id,
          label: elem.pharmacies.nom,
        });
      });
      return res.status(200).send(arrayOption);
    })
    .catch((error) => {
      console.log(error);
      return res.status(403).send(error);
    });
});
router.get("/totalCaByAction/:idAction", auth, async (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var idUser = decoded.userauth.id;
  var idRole = decoded.userauth.idrole;
  var line = decoded.userauth.line;
  var where = idRole == 2 ? { id: idUser } : idRole == 1 ? { line: line } : {};
  const idAction = req.params.idAction;
  var findBl = await commande_bl.findOne({
    attributes: [
      [
        sequelize.fn("GROUP_CONCAT", sequelize.col("commande_bls.id_bl")),
        "id_bls",
      ],
    ],
    include: [
      {
        model: commande,
        as: "commandes",
        include: {
          model: user,
          as: "users",
          where: where,
        },
        where: {
          [Op.and]: [{ id_action: idAction }, { etat: 3 }],
        },
      },
    ],
  });
  var final = 0;
  if (findBl.dataValues.id_bls) {
    var id_bls = await findBl.dataValues.id_bls.split(",");
    var mntTotal = await ligneBl.sum("montant", {
      where: {
        [Op.and]: [{ idbielle: id_bls, id_pack: { [Op.ne]: 0 } }],
      },
    });
    final = mntTotal ? mntTotal.toFixed(3) : 0;
  }
  return res.status(200).send({ mntTotal: final });
});

router.get("/getCommandeById/:idCmd", auth, async (req, res) => {
  try {
    var id = req.params.idCmd;
    var cmdFind = await commande.findOne({
      where: { id: id },
      include: ["actions"],
    });
    return res.status(200).send(cmdFind);
  } catch (error) {
    console.log(error);
    return res.status(403).send(error);
  }
});

router.get("/getBlByClientRest/:idAction/:etat", auth, async (req, res) => {
  try {
    return res.status(200).send(true);
  } catch (error) {
    console.log(error);
    return res.status(403).send(error);
  }
});

router.post("/getCommandeByAction", auth, async (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var idUser = decoded.userauth.id;
  var idLine = decoded.userauth.line;
  var idRole = decoded.userauth.idrole;
  var idAction = req.body.id;
  var annee = req.body.date;
  var limit = req.body.limit;
  var array = req.body.array;
  var objectif = req.body.objectif;
  var where = array.length != 0 ? { id_user: array } : {};
  var whereL = idRole == 1 ? { id_parent: idUser } : { line: idLine };
  var arrayObj = [];
  var obj = new Object();
  if (idRole == 2) {
    var findDelegue = await actiondelegues.findAll({
      raw: true,
      nest: true,
      attributes: ["objectif", "id_user"],
      limit: limit,
      include: [
        {
          model: user,
          as: "users",
          where: { line: idLine },
        },
        {
          model: actionComercial,
          as: "actions",
          where: {
            [Op.and]: [{ id: idAction }],
          },
        },
      ],
      group: ["id_user"],
    });
    for (const key in findDelegue) {
      const element = findDelegue[key];
      obj[element.id_user] = element.objectif;
    }
  }
  try {
    var findCmd = await commande.findAll({
      limit: limit,
      attributes: [[sequelize.fn("sum", sequelize.col("total")), "mnt"]],
      include: [
        {
          model: user,
          as: "users",
          where: whereL,
        },
        "actions",
      ],
      group: ["id_user"],
      where: {
        [Op.and]: [
          sequelize.where(sequelize.fn("year", sequelize.col("date")), annee),
          { etat: 8 },
          { id_action: idAction },
          where,
        ],
      },
    });
    var dataCmd = [];
    var labelCmd = [];
    var arrayOption = [];
    findCmd.forEach((val) => {
      dataCmd.push(val.dataValues.mnt.toFixed(3));
      if (idRole != 2) arrayObj.push(objectif);
      else {
        //get value from object client
        if (obj[val.users.id]) arrayObj.push(obj[val.users.id]);
        else arrayObj.push(objectif);
      }
      labelCmd.push(val.users.nomU + " " + val.users.prenomU);
      arrayOption.push({
        value: val.users.id,
        label: val.users.nomU + " " + val.users.prenomU,
        objectif: val.dataValues.actions.objectif,
      });
    });
    return res.status(200).send({ dataCmd, labelCmd, arrayOption, arrayObj });
  } catch (error) {
    console.log(error);
  }
});

router.get("/getAllDelegue/:year", auth, (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var idUser = decoded.userauth.id;
  var whereL = {};
  var year = req.params.year;
  if (decoded.userauth.idrole == 1) {
    whereL = { id_parent: idUser };
  }

  commande
    .findAll({
      attributes: ["id_user", "date", "etat"],
      where: {
        [Op.and]: [
          sequelize.where(sequelize.fn("year", sequelize.col("date")), year),
        ],
      },
      include: [
        {
          attributes: ["id", "nomU", "prenomU"],
          model: user,
          as: "users",
          where: whereL,
        },
        "actions",
      ],
      order: [["id", "DESC"]],
      group: ["commandes.id_user"],
    })
    .then(function (data) {
      var arrayOption = [];
      data.forEach((val) => {
        arrayOption.push({
          value: val.users.id,
          label: val.users.nomU + " " + val.users.prenomU,
          objectif: val.dataValues.actions.objectif,
        });
      });
      return res.status(200).send(arrayOption);
    })
    .catch((error) => {
      console.log(error);
      return res.status(403).send(error);
    });
});

router.get("/getAllActions/:year", auth, (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var idUser = decoded.userauth.id;
  var idLine = decoded.userauth.line;
  var whereL = {};
  var year = req.params.year;
  if (decoded.userauth.idrole == 1 || decoded.userauth.idrole == 2) {
    whereL = { line: idLine };
  }
  commande
    .findAll({
      attributes: ["id_action", "date", "etat"],
      where: {
        [Op.and]: [
          sequelize.where(sequelize.fn("year", sequelize.col("date")), year),
        ],
      },
      include: [
        {
          attributes: ["id", "nomU", "prenomU"],
          model: user,
          as: "users",
          where: whereL,
        },
        "actions",
      ],
      order: [["id", "DESC"]],
      group: ["commandes.id_action"],
    })
    .then(function (data) {
      var arrayOption = [];
      data.forEach((val) => {
        arrayOption.push({
          value: val.dataValues.actions.id,
          label: val.dataValues.actions.nom,
          objectif: val.dataValues.actions.objectif,
        });
      });
      return res.status(200).send(arrayOption);
    })
    .catch((error) => {
      console.log(error);
      return res.status(403).send(error);
    });
});
router.get(
  "/getColorClientCmd/:idAction/:idClient/:idCmd",
  auth,
  async (req, res) => {
    try {
      var idAction = parseInt(req.params.idAction);
      var idClient = req.params.idClient;
      var idCmd = req.params.idCmd;
      var where = idClient != 0 ? { client: idClient } : {};
      var test = true;
      var findCmd = await commande_bl.findOne({
        attributes: [
          [sequelize.fn("GROUP_CONCAT", sequelize.col("id_bl")), "id_bls"],
        ],
        where: { id_cmd: idCmd },
      });
      var whereBL = findCmd ? { id: findCmd.dataValues.id_bls.split(",") } : {};
      var findGroup = await ligneBl.findAll({
        include: [
          {
            model: bl,
            as: "bls",
            where: {
              [Op.and]: [
                where,
                whereBL,
                { etatCmd: 1 },
                { id_action: idAction },
                { client: idClient },
              ],
            },
          },
          "packs",
        ],
        group: ["id_pack"],
      });
      if (findGroup.length > 0) {
        if (findGroup.length == 1 && findGroup[0].dataValues.id_pack == 0) {
          test = false;
        } else {
          var mnt_produit = await ligneBl.findAll({
            attributes: [
              "montant_rest_p",
              "quantite_rest_p",
              [sequelize.fn("sum", sequelize.col("quantite")), "quantite"],
              [sequelize.fn("sum", sequelize.col("montant")), "montant"],
            ],
            include: [
              {
                model: bl,
                as: "bls",
                where: {
                  [Op.and]: [
                    where,
                    whereBL,
                    { etatCmd: 1 },
                    { id_action: idAction },
                    { client: idClient },
                  ],
                },
              },
              {
                model: produit,
                as: "produits",
              },
              "packs",
            ],
            group: ["lignebls.id_pack", "lignebls.idproduit"],
            order: [[sequelize.col("lignebls.id_pack"), "desc"]],
          });

          if (test) {
            for (const key in mnt_produit) {
              const element = mnt_produit[key];
              if (element.montant < element.montant_rest_p) test = false;
            }
            console.log(test);
          }
        }
      }
      return res.status(200).send({
        listAC: test,
      });
    } catch (error) {
      console.log(error);
      return res.status(403).send(error);
    }
  }
);
/* router.get("/getColorClient/:idAction/:idClient", auth, async (req, res) => {
  try {
    var idAction = parseInt(req.params.idAction);
    var idClient = req.params.idClient;
    var where = idClient != 0 ? { client: idClient, id_action: idAction } : {};
    var test = true;

    var findGroup = await ligneBl.findAll({
      include: [
        {
          model: bl,
          as: "bls",
          where: where,
        },
        "packs",
      ],
      group: ["id_pack"],
    });
    if (findGroup.length > 0) {
      if (findGroup.length == 1 && findGroup[0].dataValues.id_pack == 0) {
        test = false;
      } else {
        var qte_produit = await ligneBl.findAll({
          attributes: [
            "montant_rest_p",
            "quantite_rest_p",
            [sequelize.fn("sum", sequelize.col("quantite")), "quantite"],
            [sequelize.fn("sum", sequelize.col("montant")), "montant"],
          ],
          include: [
            {
              model: bl,
              as: "bls",
              where: where,
            },
            {
              model: produit,
              as: "produits",
            },
            "packs",
          ],
          group: ["lignebls.id_pack", "lignebls.idproduit"],
          order: [[sequelize.col("lignebls.id_pack"), "desc"]],
        });

        //get by marche
        for (const key in qte_produit) {
          const element = qte_produit[key];
          if (
            element.montant < element.montant_rest_p
          )
            test = false;
        }
      }
    }
    return res.status(200).send({
      listAC: test,
    });
  } catch (error) {
    console.log("errorColor",error);
    return res.status(403).send(error);
  }
}); */
router.get("/getColorClient/:idAction/:idClient", auth, async (req, res) => {
  try {
    var idAction = parseInt(req.params.idAction);
    var idClient = req.params.idClient;
    var where = idClient != 0 ? { client: idClient, id_action: idAction } : {};
    var test = true;
    var totalPack = ligneBl.sum("montant", {
      include: {
        model: bl,
        as: "bls",
        where: { client: idClient, id_action: idAction },
      },
    });
    return res.status(200).send({
      totalPack: totalPack,
    });
  } catch (error) {
    console.log("errorColor", error);
    return res.status(403).send(error);
  }
});
router.put("/payerDelegue/:idCmd", auth, async (req, res) => {
  var idCmd = req.params.idCmd;
  var commentaire = req.body.commentaire;
  commande
    .findOne({
      where: { id: idCmd },
    })
    .then((val) => {
      if (val) {
        commande
          .update(
            { payer_delegue: 1, commentaire: commentaire },
            { where: { id: idCmd } }
          )
          .then(() => {
            return res.status(200).send({
              msg: true,
            });
          })
          .catch((error) => {
            return res.status(403).send(error);
          });
      } else {
        return res.status(200).send({
          msg: false,
        });
      }
    })
    .catch((error) => {
      return res.status(403).send(error);
    });
  /* try {
    var idAction = parseInt(req.params.idAction);
    var idClient = req.params.idClient;
    var where = idClient != 0 ? { client: idClient, id_action: idAction } : {};
    var test = true;
    var totalPack = ligneBl.sum("montant", {
      include: {
        model: bl,
        as: "bls",
        where: { client: idClient, id_action: idAction },
      },
    });
    return res.status(200).send({
      totalPack: totalPack,
    });
  } catch (error) {
    console.log("errorColor", error);
    return res.status(403).send(error);
  } */
});
router.put("/payerOpalia/:id", auth, async (req, res) => {
  var id = req.params.id;
  var montantOpaAmm = req.body.montantOpaAmm;
  var montantOpaAmc = req.body.montantOpaAmc;
  var date = new Date(); // Or the date you'd like converted.
  var datePayement = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  var commandeFind = await commande.findOne({ where: { id: id } });
  if (commandeFind != null) {
    commande
      .update(
        {
          montantOpaAmc: montantOpaAmc,
          montantOpaAmm: montantOpaAmm,
          datePayementOpa: datePayement,
          payerOpa: 1,
        },
        { where: { id: id } }
      )
      .then(() => {
        return res.status(200).send(true);
      })
      .catch((error) => {
        return res.status(403).send(false);
      });
  }
});
router.get("/getTypePayments/:idCmd/:mnt", auth, async (req, res) => {
  var idCmd = req.params.idCmd;
  var mnt = req.params.mnt;
  var findCmd = await commande_bl.findOne({
    attributes: [
      [sequelize.fn("GROUP_CONCAT", sequelize.col("id_bl")), "id_bls"],
    ],
    where: { id_cmd: idCmd },
  });
  var where = findCmd ? { id: findCmd.dataValues.id_bls.split(",") } : {};
  var action_amm = 0;
  var action_amc = 0;
  //get ligne bl
  var findLigne = await ligneBl.findAll({
    attributes: ["quantite_rest_p", "montant_rest_p", "montant", "quantite"],
    include: [
      {
        model: bl,
        as: "bls",
        where: where,
      },
      {
        model: produit,
        as: "produits",
        include: [
          {
            model: marcheIms,
            as: "marcheims",
          },
        ],
      },
      "packs",
    ],
    where: { id_pack: { [Op.ne]: 0 } },
  });
  for (const key in findLigne) {
    const element = findLigne[key].dataValues;
    if (
      element.produits.type == 0 &&
      action_amm + action_amc + element.montant <= mnt
    ) {
      action_amm += element.montant;
    } else if (
      element.produits.type == 1 &&
      action_amm + action_amc + element.montant <= mnt
    ) {
      action_amc += element.montant;
    }
  }
  action_amc = action_amc.toFixed(3);
  action_amm = action_amm.toFixed(3);
  return res.status(200).send({action_amm,action_amc});
});
module.exports = router;
