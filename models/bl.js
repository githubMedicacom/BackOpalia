var Sequelize = require("sequelize");
var configuration = require("../config");
var ims = require("./ims");
var user = require("./user");
var pack = require("./pack");
var action = require("./actionComercial");
var pharmacie = require("./pharmacie");
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
var Bl = sequelize.define(
  "bls",
  {
    id: {
      type: Sequelize.INTEGER,
      unique: true,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    numBl: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: false,
    },
    dateBl: {
      type: Sequelize.DATEONLY,
      unique: false,
      allowNull: false,
    },
    id_gouvernorat: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: false,
      references: {
        model: ims,
        key: "id",
      },
    },
    iduser: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: false,
      references: {
        model: user,
        key: "id",
      },
    },
    id_pack: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: false,
      references: {
        model: pack,
        key: "id",
      },
    },
    client: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: false,
      references: {
        model: pharmacie,
        key: "id",
      },
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
    fournisseur: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    file: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    adresseClient: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    numeroBL: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    etat: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
    },
    bonification: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    dateInsertion: {
      type: Sequelize.DATEONLY,
      unique: false,
      allowNull: true,
    },
    dateValidation: {
      type: Sequelize.DATEONLY,
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
    decharge: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    commentaire: {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    },
    etatCmd: {
      type: Sequelize.INTEGER,
      unique: false,
      allowNull: true,
      defaultValue: 0,
    },
  },
  { timestamps: false }
);

Bl.belongsTo(ims, { as: "ims", foreignKey: "id_gouvernorat" });
Bl.belongsTo(pack, { as: "packs", foreignKey: "id_pack" });
Bl.belongsTo(user, { as: "users", foreignKey: "iduser" });
Bl.belongsTo(pharmacie, { as: "pharmacies", foreignKey: "client" });
Bl.belongsTo(action, { as: "actions", foreignKey: "id_action" });

// create all the defined tables in the specified database.
sequelize
  .sync()
  .then(() =>
    console.log("Bl table has been successfully created, if one doesn't exist")
  )
  .catch((error) => console.log("This error occured", error));

// export pharmacies model for use in other files.
module.exports = Bl;
