var Sequelize = require('sequelize');
var configuration = require("../config")
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

// setup produitFour model and its fields.
var produitFour = sequelize.define('produitfours', {
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
        allowNull: true
    },
    fournisseur: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
}, { timestamps: false }); 


// create all the defined tables in the specified database.  
sequelize.sync()
    .then(() => console.log('produitfour table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export produitfour model for use in other files.
module.exports = produitFour;