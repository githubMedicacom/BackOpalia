var Sequelize = require("sequelize");
var configuration = require("../config");
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

// setup Root model and its fields.
var Settings = sequelize.define(
  "settings",
  {
    id: {
      type: Sequelize.INTEGER,
      unique: true,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    logo: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    name: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    icon: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
  },
  { timestamps: false }
);

Settings.findAll().then(function (sett) {
  if (sett.length == 0) {
    Settings
      .create({name:"medicacom",logo:"logo2.png",icon:"favicon.ico"})
      .then((r) => {})
      .catch((error) => {});
  }
});

// create all the defined tables in the specified database.
sequelize.sync().then(() =>
    console.log("settings table has been successfully created, if one doesn't exist"))
  .catch((error) => console.log("This error occured", error));

// export setting model for use in other files.
module.exports = Settings;
