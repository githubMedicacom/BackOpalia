var Sequelize = require("sequelize");
var configuration = require("../config");
var config = configuration.connection;
var segment = require("./segments");
var ligneIms = require("./ligneIms");

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
// setup actionComercials model and its fields.
var actionComercials = sequelize.define(
  "actioncomercials",
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
    objectif: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: false,
    },
    date_debut: {
      type: Sequelize.DATEONLY,
      unique: false,
      allowNull: false,
    },
    date_fin: {
      type: Sequelize.DATEONLY,
      unique: false,
      allowNull: false,
    },
    etat: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
      defaultValue: 0,
    },
    id_line: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: false,
      references: {
        model: ligneIms,
        key: "id",
      },
    },
    id_segment: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: false,
      references: {
        model: segment,
        key: "id",
      },
    },
    unite_amc: {
      type: Sequelize.FLOAT,
      unique: false,
      allowNull: true,
    },
    unite_amm: {
      type: Sequelize.FLOAT,
      unique: false,
      allowNull: true,
    },
    ca_amc: {
      type: Sequelize.DOUBLE,
      unique: false,
      allowNull: true,
    },
    ca_amm: {
      type: Sequelize.DOUBLE,
      unique: false,
      allowNull: true,
    },
    unite_boni_amc: {
      type: Sequelize.FLOAT,
      unique: false,
      allowNull: true,
    },
    unite_boni_amm: {
      type: Sequelize.FLOAT,
      unique: false,
      allowNull: true,
    },
  },
  { timestamps: false }
);

actionComercials.belongsTo(ligneIms, { as: "ligneIms", foreignKey: "id_line" });
actionComercials.belongsTo(segment, { as: "segments", foreignKey: "id_segment" });

// create all the defined tables in the specified database.
sequelize
  .sync()
  .then(() =>
    console.log(
      "actionComercials table has been successfully created, if one doesn't exist"
    )
  )
  .catch((error) => console.log("This error occured", error));

// export actionComercials model for use in other files.
module.exports = actionComercials;
