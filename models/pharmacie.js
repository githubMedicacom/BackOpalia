var Sequelize = require("sequelize");
var configuration = require("../config");
var ims = require("./ims");
var segment = require("./segments");
var config = configuration.connection;

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

// setup Pharmacies model and its fields.
var Pharmacie = sequelize.define(
  "pharmacies",
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
      allowNull: true,
    },
    adresse: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    idIms: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
      references: {
        model: ims,
        key: "id",
      },
    },
    telephone: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
    },
    email: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    code: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    lat: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    lng: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    etat: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
      defaultValue: 1,
    },
    id_segment: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
      defaultValue: 0,
      references: {
        model: segment,
        key: "id",
      },
    },
  },
  { timestamps: false }
);

Pharmacie.belongsTo(ims, { as: "ims", foreignKey: "idIms" });
Pharmacie.belongsTo(segment, { as: "segments", foreignKey: "id_segment" });

// create all the defined tables in the specified database.
sequelize
  .sync()
  .then(() =>
    console.log(
      "pharmacies table has been successfully created, if one doesn't exist"
    )
  )
  .catch((error) => console.log("This error occured", error));

// export pharmacies model for use in other files.
module.exports = Pharmacie;
