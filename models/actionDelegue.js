var Sequelize = require('sequelize');
var configuration = require("../config")
var config = configuration.connection;
var user = require("./user");
var actionComercial = require("./actionComercial");
	
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
// setup actiondelegues model and its fields.
var actiondelegues = sequelize.define('actiondelegues', {
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
        allowNull: false,
        onDelete:'cascade',
        references: {
            model: actionComercial,
            key: "id"
        }
    },
    id_user: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: false,
        references: {
            model: user,
            key: "id"
        }
    },
    objectif: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: false
    },
}, { timestamps: false }); 
actiondelegues.belongsTo(actionComercial, {as: 'actions', foreignKey: 'id_action'});
actiondelegues.belongsTo(user, {as: 'users', foreignKey: 'id_user'});


// create all the defined tables in the specified database.
sequelize.sync()
    .then(() => console.log('actiondelegues table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export actiondelegues model for use in other files.
module.exports = actiondelegues;