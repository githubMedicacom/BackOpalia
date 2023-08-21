var Sequelize = require("sequelize");
var produitConc = require("./marche_concurent");
var veilles = require("./veille");
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

const ligne_veille = sequelize.define("ligne_veilles", {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  id_concurent: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
    onDelete: 'CASCADE',
    references: {
      model: produitConc,
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
  id_veille: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
    onDelete: 'CASCADE',
    references: {
      model: veilles,
      key: "id",

    },
  },
}, { timestamps: false });
ligne_veille.belongsTo(produitConc, { as: 'marche_concurent', foreignKey: 'id_concurent'});
ligne_veille.belongsTo(veilles, { as: 'veilles', foreignKey: 'id_veille'});

// create all the defined tables in the specified database.
sequelize
  .sync({})
  .then(() =>
    console.log(
      "ligne_veille table has been successfully created, if one doesn't exist"
    )
  )
  .catch((error) => console.log("This error occured", error));

// export pack model for use in other files
module.exports = ligne_veille;
