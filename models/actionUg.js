var Sequelize = require("sequelize");
var Produit = require("./produit");
var Action = require ("./actionComercial");
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

const actionUg = sequelize.define("action_ug", {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },

  actionId: {
    type: Sequelize.INTEGER,
    allowNull: true,
    unique: false,
    references: {
    model: Action,
    key: "id",
    },
  },
 
  produitId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      unique: false,
      references: {
      model: Produit,
      key: "id",
    },
  },
  quantiteUg: {
    type: Sequelize.FLOAT,
    unique: false,
    allowNull: true,
  },

}, { timestamps: false });
actionUg.belongsTo(Produit, { as: 'produits', foreignKey: 'produitId'});
actionUg.belongsTo(Action, { as: 'actioncomercials', foreignKey: 'actionId'});


// create all the defined tables in the specified database.
sequelize
  .sync({})
  .then(() =>
    console.log(
      "action_ug table has been successfully created, if one doesn't exist"
    )
  )
  .catch((error) => console.log("This error occured", error));

// export pack model for use in other files
module.exports = actionUg;
