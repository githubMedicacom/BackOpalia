var Sequelize = require('sequelize');
var configuration = require("../config")
var marcheIms = require("./marcheIms");
var ligneIms = require("./ligneIms");
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

// setup marche_concurent model and its fields.
var marche_concurent = sequelize.define('marche_concurents', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
	designation: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false
    },
    id_marche: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: false ,
        references: {
            model: marcheIms,
            key: "id"
        }
    },
    etat: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        defaultValue: 1
    },
}, { timestamps: false }); 


marche_concurent.belongsTo(marcheIms, {as: 'marcheims', foreignKey: 'id_marche'});

// create all the defined tables in the specified database.  
sequelize.sync({})
    .then(() => console.log('marche_concurent table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export marche_concurent model for use in other files.
module.exports = marche_concurent;