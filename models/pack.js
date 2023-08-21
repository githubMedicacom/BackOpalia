var Sequelize = require('sequelize');
var segments = require("./segments");
var pharmacie = require("./pharmacie");
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

// setup Pack model and its fields.
var Pack = sequelize.define('packs', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
	nom: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false
    },
    bonification: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false
    },
    segment: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        defaultValue: 0,
        references: {
            model: segments,
            key: "id"
        }
    },
    id_pharmacie: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        references: {
            model: pharmacie,
            key: "id"
        }
    }, 
    etat: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        defaultValue: 1
    },
    type: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        defaultValue: 1
    },
}, { timestamps: false }); 

Pack.belongsTo(segments, {as: 'segments', foreignKey: 'segment'});

Pack.belongsTo(pharmacie, {as: 'pharmacies', foreignKey: 'id_pharmacie'});

// create all the defined tables in the specified database.
sequelize.sync({alter:true})
    .then(() => console.log('pack table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export pack model for use in other files.
module.exports = Pack;