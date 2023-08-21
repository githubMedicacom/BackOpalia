var Sequelize = require('sequelize');
var configuration = require("../config");
var user = require("./user");
var action = require("./actionComercial");
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

// setup messageries model and its fields.
var messageries = sequelize.define('messageries', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
	id_action: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        references: {
            model: action,
            key: "id"
        }
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
    date: {
        type: Sequelize.DATE,
        unique: false,
        allowNull: true
    },
	text: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true, 
    },
	img: {
        type: Sequelize.TEXT, 
        unique: false,
        allowNull: true, 
    },
}, { timestamps: false }); 

messageries.belongsTo(action, {as: 'actions', foreignKey: 'id_action'});

messageries.belongsTo(user, {as: 'users', foreignKey: 'id_user'});

// create all the defined tables in the specified database. 
sequelize.sync()
    .then(() => console.log('messageries table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export messageries model for use in other files.
module.exports = messageries;