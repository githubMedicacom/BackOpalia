const express = require("express");
const Sequelize = require('sequelize');
const router = express.Router();
var segments = require("../models/segments");
var actionTips = require("../models/actionTips");
const auth = require("../middlewares/passport"); 
var configuration = require("../config")
var config = configuration.connection;
const sequelize = new Sequelize(config.base, config.root, config.password, {
	host:config.host,
	port: config.port,
	dialect:'mysql',
	pool:{
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000
	}, 
	operatorsAliases: false
});
router.post("/addClustrings", auth, (req, res) => {
  var actionArray = req.body.Action_tips;
  var segmentsArray = req.body.segments;
  //insert into actionTips
  actionArray.forEach((element) => {
    actionTips
      .create({
        Segment: element["Segment"],
        Number: element["Number"],
        lastpurchases: element["last.purchases"],
        Frequency: element["Frequency"],
        Value: element["Value"],
        Activity: element["Activity"],
        ActionableTip: element["Actionable.Tip"],
        etat: 1,
      })
      .then((r) => {})
      .catch((error) => {});
  });
  //insert into segment
  segmentsArray.forEach((element) => {
    var odre = 0;
    switch (element["Segment"]) {
      case "Champions": {
        odre = 1;
        break;
      }
      case "Loyal customers": {
        odre = 2;
        break;
      }
      case "Potential loyalists": {
        odre = 3;
        break;
      }
      case "New customers": {
        odre = 4;
        break;
      }
      case "Promising": {
        odre = 5;
        break;
      }
      case "Average customers": {
        odre = 6;
        break;
      }
      case "About to sleep": {
        odre = 7;
        break;
      }
      case "Need attention": {
        odre = 8;
        break;
      }
      case "Can't lose them": {
        odre = 9;
        break;
      }
      case "At risk": {
        odre = 10;
        break;
      }
      case "Hibernating": {
        odre = 11;
        break;
      }
      case "Lost": {
        odre = 12;
        break;
      }
    }
    segments
      .create({
        Segment: element["Segment"],
        Customer: element["Customer"],
        Rfm_Score: element["Rfm Score"],
        ordre: odre,
        etat: 1,
      })
      .then((r) => {})
      .catch((error) => {});
  });
  return res.status(200).send(true);
});
router.post("/getDonnees", auth, (req, res) => {
  segments.findAll({ where: { etat: 1 }, order: [["ordre", "ASC"]] }).then(function (segment) {
    return res.status(200).json({ segment });
    /* actionTips
      .findAll({ where: { etat: 1 }, order: [["Number", "DESC"]] })
      .then(function (action) {
        return res.status(200).json({ segment, action });
      }); */
    //return res.status(200).json(s);
  });
});
router.post("/actions", auth, (req, res) => {
  var segment = req.headers["segment"];
  actionTips.findOne({ where: { Segment: segment,etat: 1 } }).then(function (s) {
    if (!s) {
      return res.status(403).send(false);
    } else {
      return res.status(200).json(s.dataValues);
    }
  });
});
router.post("/getSegmentAction", auth, (req, res) => {
  var segment = req.body.segment;
  var segmentVal="";
  if(segment !="")
    segmentVal = ` and Segment IN ${segment} `
  var sql = `SELECT * FROM action_tips where etat = 1 ${segmentVal} ORDER BY Number desc`
  sequelize.query(sql, { type: sequelize.QueryTypes.SELECT})
  .then(function(segments) {
    return res.status(200).json(segments);
    // We don't need spread here, since only the results will be returned for select queries
  })
  .catch((error) => {console.log(error)});
});

module.exports = router;
