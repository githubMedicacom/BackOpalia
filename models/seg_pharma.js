var Sequelize = require('sequelize');
var configuration = require("../config");
var segment = require("./segments");
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

// setup seg_pharma model and its fields.
var seg_pharma = sequelize.define('seg_pharmas', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
	Segment: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        references: {
          model: segment,
          key: "id",
        },
    },
	Pharmacie: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true,
    },
	id_pharmacie: {
        type: Sequelize.INTEGER,
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
seg_pharma.belongsTo(segment, { as: 'segments', foreignKey: 'Segment'});

// create all the defined tables in the specified database. 
sequelize.sync()
    .then(() => console.log('seg_pharmas table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export seg_pharma model for use in other files.
module.exports = seg_pharma;