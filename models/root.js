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

// setup Root model and its fields.
var Root = sequelize.define('roots', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
	name: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
    className: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
    path: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
    component: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
    icon: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
    role: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
    ordre: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true
    },
    parent: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true
    },
    type: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true,
        defaultValue: 0
    },
}, { timestamps: false });


// create all the defined tables in the specified database.
sequelize.sync({})
    .then(() => console.log('Roots table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));
 
// export Root model for use in other files.
module.exports = Root;