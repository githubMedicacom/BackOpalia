var Sequelize = require("sequelize");
var produit = require("./produit");
var stocks = require("./stock");
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

const ligne_stock = sequelize.define("ligne_stocks", {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  id_produit: {
    type: Sequelize.INTEGER,
    unique: false,
    references: {
      model: produit,
      key: "id",
    },
  },
  id_stock: {
    type: Sequelize.INTEGER,
    unique: false,
    onDelete:'cascade',
    references: {
      model: stocks,
      key: "id",
    },
  },
  stock: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
    defaultValue: 0
  },
  vente: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
    defaultValue: 0
  },
}, { timestamps: false });
ligne_stock.belongsTo(produit, { as: 'produits', foreignKey: 'id_produit'});
ligne_stock.belongsTo(stocks, { as: 'stocks', foreignKey: 'id_stock'});

// create all the defined tables in the specified database.
sequelize
  .sync()
  .then(() =>
    console.log(
      "ligne_stock table has been successfully created, if one doesn't exist"
    )
  )
  .catch((error) => console.log("This error occured", error));

// export pack model for use in other files
module.exports = ligne_stock;
