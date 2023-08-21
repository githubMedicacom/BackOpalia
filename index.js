// Importing the packages required for the project.

const express = require("express");
var cron = require('node-cron');
var app = express();
app.use(express.json({limit: '205mb'}));
const path = require("path");
const fetch = require("node-fetch");
app.use("/bl", express.static("./bl"));


var cors = require("cors");
app.use(cors());

app.use(express.static(path.join(__dirname, "../client/build")));
// Used for sending the Json Data to Node API 
app.use(express.json());
app.use("/produit/", require("./controller/produitController"));
app.use("/pack/", require("./controller/packController"));
app.use("/pharmacie/", require("./controller/pharmacieController"));
app.use("/ims/", require("./controller/imsController"));
app.use("/secteur/", require("./controller/secteurController"));
app.use("/fournisseur/", require("./controller/fournisseurController"));
app.use("/user/", require("./controller/userController"));
app.use("/role/", require("./controller/roleController"));
app.use("/settings/", require("./controller/settingsController"));
app.use("/clustering/", require("./controller/clusteringController"));
app.use("/ligneIms/", require("./controller/ligneImsController"));
app.use("/marcheIms/", require("./controller/marcheImsController"));
app.use("/bl/", require("./controller/blController"));
/* app.use("/cron/", require("./controller/cronController")); */
app.use("/actionComerciale/", require("./controller/actionComercialController"));
app.use("/region/", require("./controller/regionController"));
app.use("/pole/", require("./controller/poleController"));
app.use("/veille/", require("./controller/veilleController"));
app.use("/segment/", require("./controller/segmentController"));
app.use("/todoList/", require("./controller/todoListController"));
app.use("/commande/", require("./controller/commandeController"));
app.use("/messageries/", require("./controller/messageriesController"));
app.use("/notification/", require("./controller/notificationController"));
app.use("/root/", require("./controller/rootController"));
app.use("/excel/", require("./controller/excelController")); 
app.use("/commandeVente/", require("./controller/commandeVenteController")); 
app.use("/releve/", require("./controller/releveController"));
app.use("/releveMedical/", require("./controller/releveMedicalController"));
app.use("/tva/", require("./controller/tvaController"));
app.use("/stock/", require("./controller/stockController"));
app.use("/marche_concurent/", require("./controller/marche_concurentController")); 
app.use("/itm/", require("./controller/itmController")); 
app.use("/releveVente/", require("./controller/releveVenteController")); 

var task =cron.schedule('0 0 0 * * *', async() => {
  fetch(
    "http://54.38.180.6:8080/cron/saveAllData", 
    {
      method: "POST",
    }
  )
}, { 
  scheduled: false
});
task.start();

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
}); 

const PORT = 4000 || 5000 || 6000;
app.listen(PORT, (err) =>
  err ? console.log(err) : console.log(`app listening on port ${PORT}!`)
);
