var Sequelize = require("sequelize");
var configuration = require("../config");
const { fail } = require("assert");
var config = configuration.connection;
var users = require("./user");
var fournisseurs = require("./fournisseur");


// create a sequelize instance with our local postgres database information.
const sequelize = new Sequelize(
  config.base,
  config.root,
  config.password,
  {
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
  },
  { timestamps: false }
);

const veille = sequelize.define(
  "veilles",
  {
    id: {
      type: Sequelize.INTEGER,
      unique: true,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    idUser: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
      onDelete: "CASCADE",
      references: {
        model: users,
        key: "id",
      },
    },

    fournisseur: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
      onDelete: "CASCADE",
      references: {
        model: fournisseurs,
        key: "id",
      },
    },

    titre: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    mois: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
    },
    annee: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
    },
  },
  { timestamps: false }
);

veille.belongsTo(users, { as: 'users', foreignKey: 'idUser'});


// create all the defined tables in the specified database.
sequelize
  .sync({ alter: true })
  .then(() =>
    console.log(
      "veille table has been successfully created, if one doesn't exist"
    )
  )
  .catch((error) => console.log("This error occured", error));

// export pack model for use in other files
module.exports = veille;
