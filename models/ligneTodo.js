var Sequelize = require('sequelize');
var configuration = require("../config");
var todo = require("./todolist");
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

// setup Role model and its fields.
var ligne_todo = sequelize.define('ligne_todos', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
	task: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true, 
    },
	completed: {
        type: Sequelize.BOOLEAN,
        unique: false,
        allowNull: true, 
    },
	id_todo: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        references: {
            model: todo,
            key: "id"
        }
    },
    date_debut: {
        type: Sequelize.DATEONLY,
        unique: false,
        allowNull: false
    },
    date_fin: {
        type: Sequelize.DATEONLY,
        unique: false,
        allowNull: false
    },
}, { timestamps: false }); 

ligne_todo.belongsTo(todo, {as: 'todos', foreignKey: 'id_todo'});

// create all the defined tables in the specified database. 
sequelize.sync()
    .then(() => console.log('ligne_todo table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export Role model for use in other files.
module.exports = ligne_todo;