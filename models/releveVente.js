var Sequelize = require('sequelize');
var configuration = require("../config")
var config = configuration.connection;
var user = require("./user");
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
var Releve_vente = sequelize.define('releves_ventes', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    id_userBi: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        references: {
            model: user,
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


Releve_vente.belongsTo(user, {as: 'users', foreignKey: 'id_userBi'});



// create all the defined tables in the specified database. 
sequelize.sync({})
    .then(() => console.log('Releve_ventes table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export Role model for use in other files.
module.exports = Releve_vente;