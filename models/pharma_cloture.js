var Sequelize = require('sequelize');
var configuration = require("../config");
var segment = require("./segments");
var pharmacie = require("./pharmacie");
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

// setup pharma_cloture model and its fields.
var pharma_cloture = sequelize.define('pharma_clotures', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
	id_segment: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        references: {
          model: segment,
          key: "id",
        },
    },
	id_pharmacie: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        references: {
          model: pharmacie,
          key: "id",
        },
    },
	date: {
        type: Sequelize.DATEONLY,
        unique: false,
        allowNull: true,
    },
	etat: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        defaultValue: 0
    }
}, { timestamps: false }); 
pharma_cloture.belongsTo(segment, { as: 'segments', foreignKey: 'id_segment'});
pharma_cloture.belongsTo(pharmacie, { as: 'pharmacies', foreignKey: 'id_pharmacie'});

// create all the defined tables in the specified database. 
sequelize.sync()
    .then(() => console.log('pharma_clotures table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export pharma_cloture model for use in other files.
module.exports = pharma_cloture;