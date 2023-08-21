var Sequelize = require("sequelize");
var configuration = require("../config");
var fournisseur = require("./fournisseur");
var user = require("./user");
var config = configuration.connection;

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

const stock = sequelize.define(
  "stocks",
  {
    id: {
      type: Sequelize.INTEGER,
      unique: true,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    id_fournisseur: {
      type: Sequelize.INTEGER,
      unique: false,
      onDelete: "cascade",
      references: {
        model: fournisseur,
        key: "id",
      },
    },
    id_user: {
      type: Sequelize.INTEGER,
      unique: false,
      onDelete: "cascade",
      references: {
        model: user,
        key: "id",
      },
    },
    titre: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    mois: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    annee: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
    },
    etat: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
      defaultValue: 1,
    },
    type: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
    
    },
  },
  { timestamps: false }
);
stock.belongsTo(fournisseur, { as: "fournisseurs", foreignKey: "id_fournisseur" });
stock.belongsTo(user, { as: "users", foreignKey: "id_user" });

// create all the defined tables in the specified database.
sequelize
  .sync({})
  .then(() =>
    console.log(
      "stock table has been successfully created, if one doesn't exist"
    )
  )
  .catch((error) => console.log("This error occured", error));

// export pack model for use in other files
module.exports = stock;
