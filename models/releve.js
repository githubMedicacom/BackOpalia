var Sequelize = require('sequelize');
var configuration = require("../config")
var config = configuration.connection;
var user = require("./user");
var produit = require("./produit");	
var fournisseur = require("./fournisseur");	
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
});

// setup Role model and its fields.
var Releve = sequelize.define('releves', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    id_delegue: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        references: {
            model: user,
            key: "id"
        }
    },
    id_fournisseur: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        references: {
            model: fournisseur,
            key: "id"
        }
    },
    file: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true,
    },
    annee: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
    },
    mois: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
    },
    namefile: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true,
    },
    type: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        defaultValue: 1
    },

}, { timestamps: true }); 


Releve.belongsTo(user, {as: 'users', foreignKey: 'id_delegue'});

Releve.belongsTo(fournisseur, {as: 'fournisseurs', foreignKey: 'id_fournisseur'});


// create all the defined tables in the specified database. 
sequelize.sync({})
    .then(() => console.log('Releves table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export Role model for use in other files.
module.exports = Releve;