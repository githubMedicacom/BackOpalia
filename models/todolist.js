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

// setup todolist model and its fields.
var todolist = sequelize.define('todolists', {
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
}, { timestamps: false }); 

todolist.belongsTo(action, {as: 'actions', foreignKey: 'id_action'});

todolist.belongsTo(user, {as: 'users', foreignKey: 'id_user'});

// create all the defined tables in the specified database. 
sequelize.sync()
    .then(() => console.log('todolists table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export todolist model for use in other files.
module.exports = todolist;