var Sequelize = require('sequelize');
var configuration = require("../config")
var user = require("./user");
var pharmacie = require("./pharmacie");
var fournisseur = require("./fournisseur");
var config = configuration.connection;
	
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

// setup Pharmacies model and its fields.
var commandeVente = sequelize.define('commande_ventes', {
    id: {
        type: Sequelize.INTEGER,
        unique: true, 
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    id_user: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        references: {
            model: user,
            key: "id"
        }
    },
    id_pharmacie: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        references: {
            model: pharmacie,
            key: "id"
        }
    },
    fournisseur: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
    type: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true ,
    },
    numero: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true 
    },
    etat: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
    },
    commentaire: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true 
    },
    total: {
        type: Sequelize.FLOAT,
        unique: false,
        allowNull: true 
    },
    date: {
        type: Sequelize.DATEONLY,
        unique: false,
        allowNull: false
    },
}); 

commandeVente.belongsTo(user, {as: 'users', foreignKey: 'id_user'});
commandeVente.belongsTo(pharmacie, {as: 'pharmacies', foreignKey: 'id_pharmacie'}); 

// create all the defined tacommandeVentees in the specified database.
sequelize.sync()
    .then(() => console.log('commandeVente has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export pharmacies model for use in other files.
module.exports = commandeVente;