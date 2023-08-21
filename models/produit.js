var Sequelize = require('sequelize');
var configuration = require("../config")
var marcheIms = require("./marcheIms");
var ligneIms = require("./ligneIms");
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

// setup Produit model and its fields.
var Produit = sequelize.define('produits', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
	designation: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false
    },
    code: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false
    },
    code_pf: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
    code_lbr: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
    prix: {
        type: Sequelize.FLOAT,
        unique: false,
        allowNull: false
    },
    desigims: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: false ,
        references: {
            model: marcheIms,
            key: "id"
        }
    },
    ligne: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: false,
        references: {
            model: ligneIms,
            key: "id"
        }
    }, 
    etat: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        defaultValue: 1
    },
    parent: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        defaultValue: 0
    },
    prixConseiller: {
        type: Sequelize.FLOAT,
        unique: false,
        allowNull: true, 
        defaultValue: 0
    },
    direct: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        defaultValue: 1
    },
    type: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        defaultValue: 0
    },
    bi: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        defaultValue: 0
    },
    lbr: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        defaultValue: 0
    },
    produit_ims: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
}, { timestamps: false }); 


Produit.belongsTo(marcheIms, {as: 'marcheims', foreignKey: 'desigims'});
Produit.belongsTo(ligneIms, {as: 'ligneims', foreignKey: 'ligne'});

// create all the defined tables in the specified database.  
sequelize.sync({})
    .then(() => console.log('produit table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export produit model for use in other files.
module.exports = Produit;