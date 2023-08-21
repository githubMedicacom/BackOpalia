const express = require("express");
const router = express.Router();
/** start import model **/
var bl = require("../models/bl");
var ligneBl = require("../models/ligneBl");
/** end import model **/
const auth = require("../middlewares/passport");
var sequelize = require("sequelize");

router.post("/saveExcel", auth, async (req, res) => {
  var insert = req.body.insert;
  var date1 = new Date(); // Or the date you'd like converted.
  var date = new Date(date1.getTime() - date1.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  var arrayExiste = [];
  Object.entries(insert).forEach(async (elem) => {
    const element = elem[1];
    var array = [];
    var verifBl= await bl.findAll({ where: { numeroBL: element.header[0].numeroBL } });
    arrayExiste.push(element.header[0].numeroBL)
    if(verifBl == 0){
      bl.create({
        client: element.header[0].client,
        id_gouvernorat: element.header[0].id_gouvernorat,
        numBl: element.header[0].numeroBL,
        numeroBL: element.header[0].numeroBL,
        dateBl: element.header[0].dateBl,
        fournisseur: "Opalia",
        iduser: element.header[0].iduser,
        id_pack: 0,
        file: null,
        etat: 3,
        dateInsertion: date,
      }).then((r) => {
        element.ligne.forEach((e) => {
          array.push({
            idbielle: r.id,
            montant: e.mnt,
            idproduit: e.produit,
            quantite: e.qte,
          });
        });
        ligneBl.bulkCreate(array);
      });
    } else {
      arrayExiste.push(element.header[0].numeroBL)
    }
  });
  return res.status(200).send(true);
});

router.post("/verifNumBl", auth, async (req, res) => {
  var arrayExiste =req.body.arrayExiste;
  bl.findOne({
    attributes: [
      [sequelize.fn('GROUP_CONCAT', sequelize.col('bls.numeroBL')), 'num']
    ], where: { numeroBL: arrayExiste } }).then(verifBl=>{
    return res.status(200).send(verifBl);
  }).catch(erreur=>{
    return res.status(403).send(erreur);
  });
});
module.exports = router;
