const express = require("express");
const router = express.Router();
var segment = require("../models/segments");
var seg_pharma = require("../models/seg_pharma");
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

// Desplay all lignes of client ...
router.post("/addSegment", auth, (req, res) => {
  var id = req.body.id;
  if (id == 0) {
    segment
      .create({
        nom: req.body.nom,
      })
      .then((r) => {
        return res.status(200).send(true);
      })
      .catch((error) => {
        return res.status(403).send(false);
      });
  } else {
    segment.findOne({ where: { id: id } }).then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        segment
          .update(
            {
              nom: req.body.nom,
            },
            { where: { id: id } }
          )
          .then((r2) => {
            return res.status(200).send(true);
          })
          .catch((error) => {
            return res.status(403).send(false);
          });
      }
    });
  }
});
router.post("/allSegment", auth, (req, res) => {
  segment.findAll({ order: [["id", "desc"]] }).then(function (r) {
    return res.status(200).send(r);
  });
});

//Delete client
router.delete("/deleteSegment/:id", auth, (req, res) => {
  var id = req.params.id;
  segment.findOne({ where: { id: id } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      segment
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
router.post("/getSegment", auth, (req, res) => {
  var id = req.headers["id"];
  segment.findOne({ where: { id: id } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      return res.status(200).json(r1.dataValues);
    }
  });
});

/*** start list pack gegenerer from api walid ***/
router.post("/getSegmentsApi", auth, (req, res) => {
  var idSegment = req.body.idSegment;
  var limit = req.body.limit;
  var pharmacie = req.body.pharmacie;
  var prod = req.body.prod;
  var where = "";
  where =
    pharmacie != ""
      ? "where sp.id_pharmacie=" + pharmacie
      : `where s.Segment=${idSegment}`;
  if (prod != 0) where += " and s.id_principal = " + prod;
  /* if(pharmacie!="")
    where = " and sp.id_pharmacie="+pharmacie;  */
  var sql = `SELECT s.*,se.nom as nomSegment
  from support_lifts s
  left join ligne_supports li on s.id = li.id_lift
  left join segments se on se.id=s.Segment 
  left join seg_pharmas sp on sp.Segment=s.Segment 
  ${where}
  group by s.id
  order by s.id_principal asc
  limit ${limit}`;
  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(function (r1) {
      if (!r1) {
        return res.status(403).send(false);
      } else {
        return res.status(200).json(r1);
      }
    });
});
function countProduit(idProduits) {
  return new Promise((resolve, reject) => {
    var sql = `SELECT COUNT(li.idproduit) as countProd,li.idproduit,p.designation 
    FROM lignebls li 
    left JOIN produits p 
    on p.id = li.idproduit 
    WHERE li.idproduit = ${idProduits} 
    GROUP BY li.idproduit`;
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
router.get("/getLigneSegments/:id/:idPrincipal", auth, (req, res) => {
  var id = req.params.id;
  var idPrincipal = req.params.idPrincipal;
  var sql = `SELECT li.* , p.designation as nomProd, se.nom as nomSegment, s.Segment as idSegment
  FROM ligne_supports li
  left join produits p on p.id=li.id_prod
  left join support_lifts s on s.id=li.id_lift
  left join segments se on se.id=s.Segment
  WHERE li.id_lift = ${id} `;
  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(async function (rows) {
      if (!rows) {
        return res.status(403).send(false);
      } else {
        var rowsConvert = Object.values(JSON.parse(JSON.stringify(rows)));
        /** Produit principale **/
        var countProd = [];
        var principal = await countProduit(idPrincipal);
        var pourcentProd = [];
        var total = 0;
        if (principal.length != 0) {
          countProd.push(principal[0].countProd);
          total = principal[0].countProd;
        } else {
          countProd.push(0);
        }
        /** ligne produit **/
        for (const key in rowsConvert) {
          var resProd = await countProduit(rowsConvert[key].id_prod);
          /* countProd.push(resProd[0].countProd);
          total+=resProd[0].countProd; */
          if (resProd.length != 0) {
            countProd.push(resProd[0].countProd);
            total = resProd[0].countProd;
          } else {
            countProd.push(0);
          }
        }
        countProd.forEach((count) => {
          var pourcent = Math.round((count * 100) / total);
          pourcentProd.push(pourcent / 100);
        });
        return res.status(200).json({
          rows: rows,
          countProd: countProd,
          pourcentProd: pourcentProd,
        });
      }
    });
});
router.delete("/delete/:id", auth, (req, res) => {
  var id = req.params.id;
  var support = "DELETE FROM support_lifts WHERE id = " + id;
  var ligne = "DELETE FROM ligne_supports WHERE id_lift = " + id;
  sequelize
    .query(ligne, { type: sequelize.QueryTypes.DELETE })
    .then(function () {
      sequelize
        .query(support, { type: sequelize.QueryTypes.DELETE })
        .then(function () {
          return res.status(200).json(true);
        });
    });
});
router.get("/getClientSegment", auth, (req, res) => {
  var sql = `SELECT c.*,s.nom as nomSeg FROM seg_pharmas c
  left join segments s on s.id = c.segment where c.id_pharmacie != 0 GROUP BY c.id_pharmacie`;
  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(function (rows) {
      return res.status(200).json(rows);
    });
});
router.get("/getCltSegProd", auth, async (req, res) => {
  var sql1 = `SELECT c.*,s.nom as nomSeg FROM seg_pharmas c
  left join segments s on s.id = c.segment where c.id_pharmacie != 0 GROUP BY c.id_pharmacie`;
  var sql2 = `SELECT DISTINCT(rhs) as label,id_principal value FROM support_lifts`;
  var sql3 = `SELECT DISTINCT(c.Segment) as value,s.nom as label FROM support_lifts c
  left join segments s on s.id = c.segment`;
  var reqPharmacie = await sequelize.query(sql1, {
    type: sequelize.QueryTypes.SELECT,
  });
  var reqProduit = await sequelize.query(sql2, {
    type: sequelize.QueryTypes.SELECT,
  });
  var reqSegment = await sequelize.query(sql3, {
    type: sequelize.QueryTypes.SELECT,
  });
  if (reqSegment && reqProduit && reqPharmacie)
    return res.status(200).json({ reqPharmacie, reqProduit, reqSegment });
  else return res.status(403).json(false);
});
/*** end list pack gegenerer from api walid ***/
/**
 *function hedhi bech najbdo pharmacie illi mazelo ma3adawech commandee
 * **/
router.post("/getAllClientSeg", auth, (req, res) => {
  var idBricks = req.body.idBricks;
  /* var bricks = "(" ; */
  var arrayBrick = [];
  idBricks.forEach((val) => {
    if (val.value != 0) arrayBrick.push(val.value);
  });
  var bricks = arrayBrick.join(",");
  bricks = "(" + bricks + ")";
  /* bricks += ")"; */
  /* var bricks = idBricks.join(","); 
  bricks = "("+bricks+")"; */
  var idRole = req.body.idRole;
  /* var dd = req.body.dd;
  var df = req.body.df; */
  var month_d = req.body.month_d;
  var year_d = req.body.year_d;
  var month_f = req.body.month_f;
  var year_f = req.body.year_f;
  var id = req.body.id;
  var idUser = req.body.idUser;
  /* var etat = idRole == 1?" and c.etat = 1":" and c.etat = 0"; */
  var idIms = idRole == 2 && bricks != "()" ? ` c.idIms in ${bricks}` : "1=1";
  var mois = new Date().getMonth() + 1;
  var sql = `SELECT c.*, GROUP_CONCAT(b.id) as idBl, s.nom as nomSeg, s.id as idSeg
  FROM bls b
  left join pharmacies c on c.id = b.client
  left join segments s on s.id = c.id_segment
  where b.id_action = ${id} and b.iduser = ${idUser} and b.etatCmd = 0 and b.etat in (0,1) and 
  (month(b.dateBl) >= '${month_d}' and year(b.dateBl) >= '${year_d}') and (month(b.dateBl) <= '${month_f}' and year(b.dateBl) <= '${year_f}')
  GROUP BY c.id 
  order by c.id`;
  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(async function (rows) {
      var objClient = new Object();
      var objBl = new Object();
      var objRows = [];
      if (rows.length != 0) {
        var idClient = "(";
        rows.forEach((e) => {
          objRows.push({
            Pharmacie: e.nom,
            id_pharmacie: e.id,
            Segment: e.idSeg,
            nomSeg: e.nomSeg,
          });
          idClient += e.id + ",";
          objClient[e.id] = 0;
          objBl[e.id] = e.idBl;
        });
        idClient = idClient.slice(0, -1);
        idClient += ")";
        var sql1 = `SELECT b.client as ph,sum(li.montant_ttc) as mnt
        from bls b
        left join lignebls li on b.id=li.idbielle
        where b.client in ${idClient} and b.etat in (0,1) and b.id_action = ${id} and b.iduser = ${idUser} and b.etatCmd = 0
        and (month(b.dateBl) >= '${month_d}' and year(b.dateBl) >= '${year_d}') and (month(b.dateBl) <= '${month_f}' and year(b.dateBl) <= '${year_f}')
        and li.id_pack != 0
        group by b.client`;
        var reqClient = await sequelize.query(sql1, {
          type: sequelize.QueryTypes.SELECT,
        });
        reqClient.forEach((e) => {
          objClient[e.ph] = e.mnt.toFixed(3);
        });
      }
      return res
        .status(200)
        .json({ rows: objRows, objClient: objClient, objBl: objBl });
    });
});
router.post("/getClientSegmentById", auth, (req, res) => {
  var idBricks = req.body.idBricks;
  var bricks = idBricks.join(",");
  bricks = "(" + bricks + ")";
  var idSeg = req.body.idSeg;
  var idRole = req.body.idRole;
  var dd = req.body.dd;
  var df = req.body.df;
  var id = req.body.id;
  var etat = "";
  /* var etat = idRole == 1?" and c.etat = 1":" and c.etat = 0"; */
  var idIms =
    idRole == 2 && bricks != "(0)" ? ` and ph.idIms in ${bricks}` : "";
  var sql = `SELECT c.*,s.nom as nomSeg 
  FROM seg_pharmas c
  left join segments s on s.id = c.segment
  left join pharmacies ph on ph.id = c.id_pharmacie 
  where s.id in ${idSeg} ${etat} ${idIms}
  and c.id_pharmacie not in 
  (SELECT c.id_pharmacie FROM commandes c where c.date >= '${dd}' and c.date <= '${df}' and c.id_action = ${id})

  GROUP BY c.id_pharmacie 
  order by c.id_pharmacie`;
  sequelize
    .query(sql, { type: sequelize.QueryTypes.SELECT })
    .then(async function (rows) {
      var objClient = new Object();
      if (rows.length != 0) {
        var idClient = "(";
        rows.forEach((e) => {
          idClient += e.id_pharmacie + ",";
          objClient[e.id_pharmacie] = 0;
        });
        idClient = idClient.slice(0, -1);
        idClient += ")";
        var sql1 = `SELECT b.client as ph,sum(li.montant_ttc) as mnt
        from bls b
        left join lignebls li on b.id=li.idbielle
        where b.client in ${idClient} and b.etat = 1 and b.id_action = ${id}
        group by b.client`;
        var reqClient = await sequelize.query(sql1, {
          type: sequelize.QueryTypes.SELECT,
        });
        reqClient.forEach((e) => {
          objClient[e.ph] = e.mnt.toFixed(3);
        });
      }
      return res.status(200).json({ rows, objClient });
    });
});

router.post("/getPharmacieSegment", auth, async (req, res) => {
  var idSeg = req.body.idSeg;
  var where = {};
  where = idSeg != 0 ? { segment: idSeg } : {};
  var seg = await seg_pharma.findAll({
    include: ["segments"],
    where: where,
  });
  return res.status(200).json(seg);
});
module.exports = router;
