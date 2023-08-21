var Sequelize = require('sequelize');
var configuration = require("../config");
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

// setup support_lift model and its fields.
var support_lift = sequelize.define('support_lifts', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
	lhs_1: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true, 
    },
	lhs_2: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true, 
    },
	lhs_3: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true, 
    },
	lhs_4: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true, 
    },
	lhs_5: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true, 
    },
	rhs: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true, 
    },
	id_principal: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
    },
	support: {
        type: Sequelize.FLOAT,
        unique: false,
        allowNull: true, 
    },
	confidence: {
        type: Sequelize.FLOAT,
        unique: false,
        allowNull: true, 
    },
	coverage: {
        type: Sequelize.FLOAT,
        unique: false,
        allowNull: true, 
    },
	lift: {
        type: Sequelize.FLOAT,
        unique: false,
        allowNull: true, 
    },
	count: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
    },
	Segment: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
    },
}, { timestamps: false }); 

// create all the defined tables in the specified database. 
sequelize.sync()
    .then(() => console.log('support_lifts table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export support_lift model for use in other files.
module.exports = support_lift;