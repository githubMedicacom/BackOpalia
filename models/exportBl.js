var Sequelize = require('sequelize');
var configuration = require("../config")
var user = require("./user");
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
var exportBl = sequelize.define('export_bl', {
    id: {
        type: Sequelize.INTEGER,
        unique: true, 
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    idUser: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: false,
        references: {
            model: user,
            key: "id"
        }
    }
}); 

exportBl.belongsTo(user, {as: 'users', foreignKey: 'idUser'});

// create all the defined tables in the specified database.
sequelize.sync()
    .then(() => console.log('exportBl table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export pharmacies model for use in other files.
module.exports = exportBl;