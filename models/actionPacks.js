var Sequelize = require('sequelize');
var configuration = require("../config")
var config = configuration.connection;
var pack = require("./pack");
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
// setup actionPacks model and its fields.
var actionPacks = sequelize.define('actionpacks', {
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
    id_pack: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: false,
        references: {
            model: pack,
            key: "id"
        }
    },
}, { timestamps: false }); 
actionPacks.belongsTo(actionComercial, {as: 'actionComercials', foreignKey: 'id_action'});
actionPacks.belongsTo(pack, {as: 'packs', foreignKey: 'id_pack'});


// create all the defined tables in the specified database. 
sequelize.sync()
    .then(() => console.log('actionPacks table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export actionPacks model for use in other files.
module.exports = actionPacks;