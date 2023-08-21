var Sequelize = require("sequelize");
var Secteur = require("./secteur");
var Ims = require("./ims");
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

const SecteurIms = sequelize.define("secteurims", {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  imsId: {
    type: Sequelize.INTEGER,
    unique: false,
    references: {
      model: Ims,
      key: "id",
    },
  },
  secteurId: {
    type: Sequelize.INTEGER,
    unique: false,
    references: {
      model: Secteur,
      key: "id",
    },
  },
}, { timestamps: false });
SecteurIms.belongsTo(Secteur, { as: 'secteurs', foreignKey: 'secteurId'});
SecteurIms.belongsTo(Ims, { as: 'ims', foreignKey: 'imsId'});

// create all the defined tables in the specified database.
sequelize.sync().then(() =>console.log("secteurIms table has been successfully created, if one doesn't exist"))
  .catch((error) => console.log("This error occured", error));

// export pack model for use in other files
module.exports = SecteurIms;
