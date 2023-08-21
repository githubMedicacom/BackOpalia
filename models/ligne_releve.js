var Sequelize = require('sequelize');
var configuration = require("../config")
var config = configuration.connection;
var produit = require("./produit");	
var releve = require("./releve");	
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
var LigneReleve = sequelize.define('ligne_releves', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    id_releve: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        references: {
            model: releve,
            key: "id"
        }
    },
    id_produit: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        references: {
            model: produit,
            key: "id"
        }
    },
    mesure: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
    },
    mois: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        defaultValue: 0
    },
    type: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        defaultValue: 0
    },
    annee: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        defaultValue: 0
    },
    date: {
        type: Sequelize.DATEONLY,
        unique: false,
        allowNull: true,
    },

}, { timestamps: true }); 


LigneReleve.belongsTo(releve, {as: 'releves', foreignKey: 'id_releve'});

LigneReleve.belongsTo(produit, {as: 'produits', foreignKey: 'id_produit'});



// create all the defined tables in the specified database. 
sequelize.sync()
    .then(() => console.log('ligneReleves table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export Role model for use in other files.
module.exports = LigneReleve;