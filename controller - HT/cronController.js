const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
var FormData = require("form-data");
const excelJS = require("exceljs");
var support_lifts = require("../models/support_lifts");
var seg_pharma = require("../models/seg_pharma");
var ligne_support = require("../models/ligne_support");
var fs = require("fs");

var app = express();
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
app.use(express.json());

const auth = require("../middlewares/passport");

router.post("/envoyerExcel", async (req, res) => {
  console.log("envoyerExcel")
  // saveSupport(objectif);
  // res.send({ data: objectif });
  var buffer = fs.readFile("./excel/clustering.xlsx", async (err, d) => {
    var form = new FormData();
    form.append("file", d, {
      filepath: "./excel/clustering.xlsx",
      contentType: "*/*",
    });
    try {
      const response = await fetch(
        "http://37.187.225.45/rfm_opalia_api/Clustering",
        {
          method: "POST",
          headers: form.getHeaders(),
          body: form,
        }
      ).then();
      const data = await response.json();
      saveSupport(data);
      res.send({ data: data });
      
    } catch (error) {
      console.log("envoyerExcel",error)
      res.send(error);
      
    }
  });
});

router.post("/generateExcel", async (req, res) => {
  var sql = `SELECT cl.nom as nomClt, li.id as idLigne, b.fournisseur, p.designation as designation ,
  li.montant as mnt,li.quantite as qte ,
  DATE_FORMAT(b.dateBl,'%Y') as annee , 
  DATE_FORMAT(b.dateBl,'%b') as mounth ,
  DATE_FORMAT(b.dateBl,'%e') as day,u.nomU as nomDelegue
  FROM bls b 
  left join lignebls li on b.id =li.idbielle
  left join pharmacies cl on cl.id =b.client
  left join users u on u.id =b.iduser
  left join produits p on p.id =li.idproduit
  where b.etat =1
  group by b.client,p.designation,b.dateBl
  ORDER BY nomClt ASC`;

  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(async function (rows) {
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet("Produits");
      const path = "./excel";

      worksheet.columns = [
        { header: "Numero BL", key: "idLigne", width: 15 },
        { header: "Pharmacie", key: "nomClt", width: 15 },
        { header: "Fournisseur", key: "fournisseur", width: 15 },
        { header: "Desigantion", key: "designation", width: 15 },
        { header: "Quantite", key: "qte", width: 15 },
        { header: "Jour", key: "day", width: 15 },
        { header: "Mois", key: "mounth", width: 15 },
        { header: "Annee", key: "annee", width: 15 },
        { header: "Total HT", key: "mnt", width: 15 },
        { header: "delegue", key: "nomDelegue", width: 15 },
      ];

      let counter = 1;
      rows.forEach((user) => {
        user.s_no = counter;
        worksheet.addRow(user);
        counter++;
      });

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      try {
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=clustering.xlsx`
        );

        await workbook.xlsx.writeFile(`${path}/clustering.xlsx`).then(() => {
          res.send({
            status: "success",
            message: "file successfully downloaded",
            path: `${path}/clustering.xlsx`,
          });
        });
      } catch (err) {
        res.send({
          status: "error",
          message: err,
        });
      }
    });
});
/*** walid api **/
function cheeckProduit(nom) {
  return new Promise((resolve, reject) => {
    if(nom.trim() !="" && nom != undefined && nom != null) {
      var nomFinal = nom.indexOf(".")>-1? nom.replaceAll(".", ","):nom;
      var sql = `SELECT * from produits where designation = '${nomFinal}'`;
      sequelize
        .query(sql, { type: sequelize.QueryTypes.SELECT })
        .then(function (results) {
          if (!results) {
            return reject(error);
          } else {
            return resolve(results);
          }
        });

    }
  });
}
function cheeckProduitObj() {
  return new Promise((resolve, reject) => {
      var sql = `SELECT * from produits`;
      sequelize
        .query(sql, { type: sequelize.QueryTypes.SELECT })
        .then(function (results) {
          if (!results) {
            return reject(error);
          } else {
            var obj = new Object();
            results.forEach(val=>{
              obj[val.designation] = val.id;
            })
            return resolve(obj);
          }
        });
  });
}
function getPharmacie(nom) {
  return new Promise((resolve, reject) => {
    var sql = `SELECT * from pharmacies`;
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
function getSegment() {
  return new Promise((resolve, reject) => {
    var sql = `SELECT * from segments`;
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
/* router.post("/envoyerExcelTest", async (req, res) => { */
async function saveSupport(objectif){
  seg_pharma.destroy({ truncate: true });
  support_lifts.destroy({ truncate: true });
  ligne_support.destroy({ truncate: true });
  var support = objectif.support;
  var segmnet = objectif.segmnet;
  var pharmacie = await getPharmacie();
  var arrayInsertSeg = [];
  var arraySeg = await getSegment();
  var indexSegment = 0;
  for (const key in segmnet) {
    var obj = segmnet[key];
    arraySeg.filter((element, index, array) => {
      if (element.nom == obj.Segment) {
        indexSegment = element.id;
      }
    });

    var indexPharmacie = 0;
    pharmacie.filter((element, index, array) => {
      if (element.nom == obj.Pharmacie) {
        indexPharmacie = element.id;
      }
    });

    obj.Segment = indexSegment;
    obj.id_pharmacie = indexPharmacie;
    arrayInsertSeg.push(obj);
  }
  seg_pharma.bulkCreate(arrayInsertSeg).then(() => {});

  var arrayInsertSup = [];
  var allProd = await cheeckProduitObj();
  for (const key in support) {
    var obj = support[key];
    var principale = allProd[obj.rhs];
    arraySeg.filter((element, index, array) => {
      if (element.nom == obj.Segment) {
        indexSegment = element.id;
      }
    });
    obj.Segment = indexSegment;
    if (principale) {
      obj.id_principal = principale;
      arrayInsertSup.push(obj);
    }
  }
  var arraySup = await support_lifts.bulkCreate(arrayInsertSup);
  var resultArray = Object.values(JSON.parse(JSON.stringify(arraySup)));
  var arrayLigne = [];
  for (const key in resultArray) {
    var obj = resultArray[key];
    var lhs_1 = obj.lhs_1 ? obj.lhs_1 : "";
    var lhs_2 = obj.lhs_2 ? obj.lhs_2 : "";
    var lhs_3 = obj.lhs_3 ? obj.lhs_3 : "";
    var lhs_4 = obj.lhs_4 ? obj.lhs_4 : "";
    var lhs_5 = obj.lhs_5 ? obj.lhs_5 : "";
    if (lhs_1 != "") {
      if (allProd[lhs_1]) {
        arrayLigne.push({
          id_prod: allProd[lhs_1],
          id_lift: obj.id,
        });
      }
    }
    if (lhs_2 != "") {
      if (allProd[lhs_2]) {
        arrayLigne.push({
          id_prod: allProd[lhs_2],
          id_lift: obj.id,
        });
      }
    }
    if (lhs_3 != "") {
      if (allProd[lhs_3]) {
        arrayLigne.push({
          id_prod: allProd[lhs_3],
          id_lift: obj.id,
        });
      }
    }
    if (lhs_4 != "") {
      if (allProd[lhs_4]) {
        arrayLigne.push({
          id_prod: allProd[lhs_4],
          id_lift: obj.id,
        });
      }
    }
    if (lhs_5 != "") {
      if (allProd[lhs_5]) {
        arrayLigne.push({
          id_prod: allProd[lhs_5],
          id_lift: obj.id,
        });
      }
    }
  }
  var arraySup = await ligne_support.bulkCreate(arrayLigne);
  /* return res.status(200).send({ arrayInsertSeg: arrayInsertSup });
}); */
}
module.exports = router;
