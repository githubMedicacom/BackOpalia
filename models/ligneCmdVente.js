var Sequelize = require("sequelize");
var produit = require("./produit");
var commandeVente = require("./commandeVente");
var configuration = require("../config")
var config = configuration.connection;

// create a sequelize instance with our local postgres database information.
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
}, { timestamps: false });

const ligneCmdVente = sequelize.define("ligne_cmd_ventes", {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  id_cmd_vente: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
    references: {
      model: commandeVente,
      key: "id", 
    },
  },
  id_produit: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
    references: {
      model: produit,
      key: "id",
    },
  },
  quantite: {
    type: Sequelize.FLOAT,
    unique: false,
    allowNull: true,
  },
  montant: {
    type: Sequelize.FLOAT,
    unique: false,
    allowNull: true,
  },
}, { timestamps: false });
ligneCmdVente.belongsTo(produit, { as: 'produits', foreignKey: 'id_produit'});
ligneCmdVente.belongsTo(commandeVente, { as: 'commandeVentes', foreignKey: 'id_cmd_vente'});

// create all the defined tables in the specified database.
sequelize.sync()
  .then(() =>
    console.log("ligne_cmd_ventes table has been successfully created, if one doesn't exist")
  )
  .catch((error) => console.log("This error occured", error));

// export pack model for use in other files
module.exports = ligneCmdVente;
