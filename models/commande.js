var Sequelize = require("sequelize");
var configuration = require("../config");
var user = require("./user");
var pharmacie = require("./pharmacie");
var action = require("./actionComercial");
var segments = require("./segments");
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

// setup commande model and its fields.
var commande = sequelize.define("commandes", {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  id_action: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
    references: {
      model: action,
      key: "id",
    },
  },
  id_user: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
    references: {
      model: user,
      key: "id",
    },
  },
  id_pharmacie: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
    references: {
      model: pharmacie,
      key: "id",
    },
  },
  id_segment: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
    references: {
      model: segments,
      key: "id",
    },
  },
  etat: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
  },
  note: {
    type: Sequelize.STRING,
    unique: false,
    allowNull: true,
  },
  date: {
    type: Sequelize.DATEONLY,
    unique: false,
    allowNull: true,
  },
  decharge: {
    type: Sequelize.STRING,
    unique: false,
    allowNull: true,
  },
  datePayement: {
    type: Sequelize.DATEONLY,
    unique: false,
    allowNull: true,
  },
  payer: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
    defaultValue: 0,
  },
  total: {
    type: Sequelize.DOUBLE,
    unique: false,
    allowNull: true,
  },
  mois: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
  },
  payer_delegue: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
    defaultValue: 0,
  },
  commentaire: {
    type: Sequelize.STRING,
    unique: false,
    allowNull: true,
  },
  datePayementOpa: {
    type: Sequelize.DATEONLY,
    unique: false,
    allowNull: true,
  },
  payerOpa: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
    defaultValue: 0,
  },
  montantOpaAmm: {
    type: Sequelize.FLOAT,
    unique: false,
    allowNull: true,
    defaultValue: 0,
  },
  montantOpaAmc: {
    type: Sequelize.FLOAT,
    unique: false,
    allowNull: true,
    defaultValue: 0,
  },
  trimestre: {
    type: Sequelize.INTEGER,
    unique: false,
    allowNull: true,
  },
});

commande.belongsTo(action, { as: "actions", foreignKey: "id_action" });

commande.belongsTo(user, { as: "users", foreignKey: "id_user" });

commande.belongsTo(pharmacie, { as: "pharmacies", foreignKey: "id_pharmacie" });

commande.belongsTo(segments, { as: "segments", foreignKey: "id_segment" });

// create all the defined tables in the specified database.
sequelize
  .sync()
  .then(() =>
    console.log(
      "commandes table has been successfully created, if one doesn't exist"
    )
  )
  .catch((error) => console.log("This error occured", error));

// export commande model for use in other files.
module.exports = commande;