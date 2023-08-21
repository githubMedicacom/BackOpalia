var Sequelize = require("sequelize");
var configuration = require("../config");
var config = configuration.connection;
var pole = require("./pole");	
var user = require("./user");	
var region = require("./region");	


// create a sequelize instance with our local postgres database information.
const sequelize = new Sequelize(config.base, config.root, config.password, {
  host: config.host,
  port: config.port,
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  operatorsAliases: false,
});

// setup Fournisseur model and its fields.
var Fournisseur = sequelize.define(
  "fournisseurs",
  {
    id: {
      type: Sequelize.INTEGER,
      unique: true,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    nom: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: false,
    },
    code: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    tva: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
      defaultValue: 0,
    },
    regionId: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
      references: {
          model: region,
          key: "id"
      }
  },
    poleId: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
      references: {
          model: pole,
          key: "id"
      }
  },
    userId: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
      references: {
        model: user,
        key: "id"
    }
    },
    etat: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
      defaultValue: 1,
    },
  },
  { timestamps: false }
);


Fournisseur.belongsTo(region, {as: 'regions', foreignKey: 'regionId'});
Fournisseur.belongsTo(pole, {as: 'poles', foreignKey: 'poleId'});
Fournisseur.belongsTo(user, {as: 'users', foreignKey: 'userId'});


// create all the defined tables in the specified database.
sequelize
  .sync({})
  .then(() =>
    console.log(
      "fournisseur table has been successfully created, if one doesn't exist"
    )
  )
  .catch((error) => console.log("This error occured", error));

// export segments model for use in other files.
module.exports = Fournisseur;
