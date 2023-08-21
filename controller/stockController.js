const express = require("express");
const router = express.Router();
var stock = require("../models/stock");
var ligne_stock = require("../models/ligne_stock");
const auth = require("../middlewares/passport");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const privateKey = "mySecretKeyabs";

router.post("/addStock", auth, (req, res) => {
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var idUser = decoded.userauth.id;
  var id = req.body.id;
  var titre = req.body.titre;
  var mois = req.body.mois;
  var annee = req.body.annee;
  var id_fournisseur = req.body.id_fournisseur;
  var type = req.body.type;
  var ligneStock = req.body.ligneStock;
  if (id == 0) {
    stock
      .create({
        titre: titre,
        mois: mois,
        annee: annee,
        id_fournisseur: id_fournisseur,
        id_user: idUser,
        type : type , 
        etat: 1,
      })
      .then((p) => {
        var array = [];
        ligneStock.forEach((element) => {
          array.push({
            id_stock: p.dataValues.id,
            id_produit: element.id_produit,
            stock: element.stock,
            vente: element.vente,
          });
        });
        ligne_stock.bulkCreate(array).then(() => {
          return res.status(200).send(true);
        });
      })
      .catch(() => {
        return res.status(403).send(false);
      });
  } else {
    stock.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        stock
          .update(
            {
              titre: titre,
              mois: mois,
              annee: annee,
              id_fournisseur: id_fournisseur,
              id_user: idUser,
              type : type ,
              etat: 1,
            },
            { where: { id: id } }
          )
          .then(() => {
            ligne_stock
              .destroy({ where: { id_stock: id } })
              .then(() => {
                var array = [];
                ligneStock.forEach((element) => {
                  array.push({
                    id_stock: id,
                    id_produit: element.id_produit,
                    stock: element.stock,
                    vente: element.vente,
                  });
                });
                ligne_stock.bulkCreate(array).then(() => {
                  return res.status(200).send(true);
                });
              })
              .catch((error) => {
                console.log(error);
                return res.status(403).send(error);
              });
          })
          .catch((error) => {
            console.log(error);
            return res.status(403).send(error);
          });
      }
    });
  }
});

router.post("/allStock", auth, (req, res) => {
  var annee = req.body.annee;
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var idRole = decoded.userauth.idrole;
  var idUser = decoded.userauth.id;
  var where = { id_user: idUser, annee: annee };
  if (idRole == 0) {
    var id_user = req.body.id_user;
    where =
      parseInt(id_user) != 0
        ? { id_user: id_user, annee: annee }
        : { annee: annee };
  }
  stock
    .findAll({
      where: where,
      order: [["id", "desc"]],
      include: ["fournisseurs", "users"],
    })
    .then(function (r) {
      return res.status(200).send(r);
    });
});
router.post("/getActive", auth, (req, res) => {
  stock.findAll({ where: { etat: 1 } }).then(function (r) {
    return res.status(200).send(r);
  });
});

router.put("/changeEtat/:id", auth, (req, res) => {
  var id = req.params.id;
  stock.findOne({ where: { id: id } }).then(function (r1) {
    var etat = 0;
    if (r1.dataValues.etat == 0) etat = 1;
    if (!r1) {
      return res.status(403).send(false);
    } else {
      stock
        .update(
          {
            etat: etat,
          },
          { where: { id: id } }
        )
        .then(() => {
          return res.status(200).send(true);
        })
        .catch(() => {
          return res.status(403).send(false);
        });
    }
  });
});

router.post("/getStock", auth, async (req, res) => {
  var id = req.headers["id"];
  var header = await stock.findOne({
    where: { id: id },
    include: ["fournisseurs"],
  });
  var table = await ligne_stock.findAll({
    where: { id_stock: id },
    include: ["stocks", "produits"],
  });
  return res.status(200).json({ header, table });
});

router.get(
  "/verifStock/:id/:id_fournisseur/:mois/:annee/:type",
  auth,
  async (req, res) => {
    var token = req.headers["x-access-token"];
    const decoded = jwt.verify(token, privateKey);
    var idUser = decoded.userauth.id;
    var id_fournisseur = req.params.id_fournisseur;
    var mois = req.params.mois;
    var annee = req.params.annee;
    var type = req.params.type;
    console.log(type,'hello')
    var id = req.params.id;
    var where = {
      mois: mois,
      id_fournisseur: id_fournisseur,
      annee: annee,
      id_user: idUser,
      type : type,
    };
    if (id != 0) {
      where = {
        mois: mois,
        id_fournisseur: id_fournisseur,
        annee: annee,
        id: { [Op.ne]: id },
        id_user: idUser,
        type : type,
      };
    }
    var findStock = await stock.findOne({
      where: where,
    });
    var list = findStock ? findStock : [];
    return res.status(200).json(list);
  }
);
router.delete("/delete/:id", auth, (req, res) => {
  var id = req.params.id;
  stock.findOne({ where: { id: id } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      stock
        .destroy({ where: { id: id } })
        .then((r2) => {
          return res.status(200).send(true);
        })
        .catch((error) => {
          return res.status(403).send(false);
        });
    }
  });
});

//export excel stock vente
router.post("/exportStock", auth, (req, res) => {
  var annee = req.body.annee;
  var token = req.headers["x-access-token"];
  const decoded = jwt.verify(token, privateKey);
  var idUser = decoded.userauth.id;
  var where = { annee: annee };
  ligne_stock
    .findAll({
      order: [["id", "desc"]],
      include: [
        {
          model: stock,
          as: "stocks",
          where: where,
          include: ["fournisseurs", "users"],
        },
        "produits",
      ],
    })
    .then(function (r) {
      var array = [];
      r.forEach((val) => {
        array.push({
          titre: val.stocks.titre,
          delegue: val.stocks.users.nomU + " " + val.stocks.users.prenomU,
          code_adonix: val.stocks.fournisseurs.code,
          fournisseur: val.stocks.fournisseurs.nom,
          opalia:
            val.produits.code_lbr !== null && val.produits.code_lbr !== ""
              ? "LBR"
              : "OPALIA",
          code: val.produits.code,
          code_pf: val.produits.code_pf,
          code_lbr: val.produits.code_lbr,
          produit: val.produits.designation,
          volume: val.stock,
          valeur: val.stock * val.produits.prix,
          date: "01-" + val.stocks.mois + "-" + val.stocks.annee,
          type: "STOCK",
          typeEx:
            val.stocks.type === 1 
              ? "début mois"
             :  val.stocks.type === 2 
              ? "Mi-mois"
              : "",
        });

        array.push({
          titre: val.stocks.titre,
          delegue: val.stocks.users.nomU + " " + val.stocks.users.prenomU,
          code_adonix: val.stocks.fournisseurs.code,
          fournisseur: val.stocks.fournisseurs.nom,
          opalia:
            val.produits.code_lbr !== null && val.produits.code_lbr !== ""
              ? "LBR"
              : "OPALIA",
          code: val.produits.code,
          code_pf: val.produits.code_pf,
          code_lbr: val.produits.code_lbr,
          produit: val.produits.designation,
          volume: val.vente,
          valeur: val.vente * val.produits.prix,
          date: "01-" + val.stocks.mois + "-" + val.stocks.annee,
          type: "VENTE",
          typeEx:
            val.stocks.type === 1 
              ? "début mois"
             :  val.stocks.type === 2 
              ? "Mi-mois"
              : "",
        });
      });
      return res.status(200).send(array);
    });
});
router.post("/getActive", auth, (req, res) => {
  stock.findAll({ where: { etat: 1 } }).then(function (r) {
    return res.status(200).send(r);
  });
});
module.exports = router;
