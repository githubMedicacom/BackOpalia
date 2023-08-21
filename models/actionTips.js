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
// setup ActionTips model and its fields.
var ActionTips = sequelize.define('action_tips', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
	Segment: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false
    },
    Number: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: false
    },
    lastpurchases: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false
    },
    Frequency: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false
    },
    Value: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false
    },
    Activity: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false
    },
    ActionableTip: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false
    },
    etat: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        defaultValue: 1
    },
}, { timestamps: false }); 


// create all the defined tables in the specified database.
sequelize.sync()
    .then(() => console.log('ActionTips table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export ActionTips model for use in other files.
module.exports = ActionTips;