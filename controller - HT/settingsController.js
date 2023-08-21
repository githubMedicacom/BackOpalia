const express = require("express");
const router = express.Router();
var settings = require("../models/settings");
const auth = require("../middlewares/passport");
const multer = require("multer");
var fs = require("fs");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../client/src/assets/img");
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });
//icon
const storageIcon = multer.diskStorage({
  destination: function (req, file, cb) { 
    cb(null, "../client/src/assets/img");
    cb(null, "../client/public");
   
  },
  filename: function (req, file, cb) {
    cb(null, "favicon.ico");
  },
});
const uploadIcon = multer({ storage: storageIcon });
router.post("/saveLogo", upload.single("image"),(req, res) => {
  res.send({ filename: req.body.name });
});
router.post("/saveLogo1", upload.single("image"),(req, res) => {
  res.send({ filename: req.body.name });
});
router.post("/saveIcon", uploadIcon.single("icon"),(req, res) => {
  res.send({ filename: req.body.iconname });
});

// Desplay all lignes of client ...
router.post("/updateSettings",auth, (req, res) => { 
  settings.findOne({ where: { id: 1 } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      settings
        .update({
          name: req.body.name,
          logo: req.body.logo,
          icon: req.body.icon
        },{ where: { id: 1 } })
        .then((r2) => {
          return res.status(200).send(true);
        })
        .catch((error) => {
          return res.status(403).send(false);
        });
    }
  });
});
router.post("/getSettings", (req, res) => {
  var id = req.headers["id"];
  settings.findOne({ where: { id: id } }).then(function (r1) {
    if (!r1) {
      return res.status(403).send(false);
    } else {
      return res.status(200).json(r1.dataValues);
    }
  });
});
router.get("/getLogo/:file", auth, (req, res) => {
  if (fs.existsSync("../client/src/assets/img/" + req.params.file)) {
    var file = fs.createReadStream("../client/src/assets/img/" + req.params.file);
    file.pipe(res);
  } else return res.status(403).json({ message: false });
});

module.exports = router;