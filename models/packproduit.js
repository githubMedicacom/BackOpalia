var Sequelize = require("sequelize");
var Produit = require("./produit");
var Pack = require("./pack");
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

const PackProduit = sequelize.define("packproduits", {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  packId: {
    type: Sequelize.INTEGER,
    unique: false,
    references: {
      model: Pack,
      key: "id",
    },
  },
  produitId: {
    type: Sequelize.INTEGER,
    unique: false,
    references: {
      model: Produit,
      key: "id",
    },
  },
  quantite: {
    type: Sequelize.FLOAT,
    unique: false,
    allowNull: true,
    defaultValue: 0,
  },
  montant: {
    type: Sequelize.FLOAT,
    unique: false,
    allowNull: true,
    defaultValue: 0,
  },

  quantiteUg: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
    defaultValue: 0,
  },

}, { timestamps: false });
PackProduit.belongsTo(Produit, { as: 'produits', foreignKey: 'produitId'});
PackProduit.belongsTo(Pack, { as: 'packs', foreignKey: 'packId'});

// create all the defined tables in the specified database.
sequelize
  .sync({alter:true})
  .then(() =>
    console.log(
      "pack table has been successfully created, if one doesn't exist"
    )
  )
  .catch((error) => console.log("This error occured", error));

// export pack model for use in other files
module.exports = PackProduit;
