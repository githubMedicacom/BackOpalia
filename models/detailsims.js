var Sequelize = require('sequelize');
var Ims = require('./ims');
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

// setup Ims model and its fields.
var detailsims = sequelize.define('detailsims', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
	idIms: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: false,
        references: {
          model: Ims,
          key: "id",
        },
    },
    chef_produit: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true, 
    },
    produit: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true, 
    },
    volume: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true, 
    },
    total: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true, 
    },
    date: {
        type: Sequelize.DATE,
        unique: false,
        allowNull: true, 
    },
    dateInsertion: {
        type: Sequelize.DATE,
        unique: false,
        allowNull: true, 
    },
    etat: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        defaultValue: 1
    },
}, { timestamps: false }); 


detailsims.belongsTo(Ims, {as: 'ims', foreignKey: 'idIms'});
// create all the defined tables in the specified database.
sequelize.sync()
    .then(() => console.log('detailsims table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export ims model for use in other files. 
module.exports = detailsims;