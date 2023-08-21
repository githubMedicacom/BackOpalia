var Sequelize = require('sequelize');
var bcrypt = require('bcrypt');
var role = require("./role");
var ligneIms = require("./ligneIms");
var secteur = require("./secteur");
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

// setup User model and its fields.
var User = sequelize.define('users', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
	nomU: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
	prenomU: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
	login: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false
    },
	email: {
        type: Sequelize.STRING, 
        unique: false, 
        allowNull: true
    },
	tel: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
    idrole: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: false,
        references: {
            model: role,
            key: "id"
        }
    }, 
    etat: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        defaultValue: 1
    },
    password: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
    idsect: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        references: {
            model: secteur,
            key: "id"
        }
    }, 
    line: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true, 
        references: {
            model: ligneIms,
            key: "id"
        }
    }, 
    idAdmin: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        defaultValue: 1
    },
    crm: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
    type: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: true,
        defaultValue: 0
    },

}, { timestamps: false });

User.belongsTo(role, {as: 'roles', foreignKey: 'idrole'});

User.belongsTo(secteur, {as: 'secteurs', foreignKey: 'idsect'});

User.belongsTo(ligneIms, {as: 'ligneims', foreignKey: 'line'});

User.beforeCreate((user, options) => {  
	const salt = bcrypt.genSaltSync();
	user.password = bcrypt.hashSync(user.password, salt);
});
  
 
User.prototype.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
}; 

// create all the defined tables in the specified database.  
sequelize.sync()
    .then(() => console.log('users table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

/* User.findAll().then(function (u) {
    if (u.length == 0) {
        User.create({
            nomU: "admin",
            prenomU: "admin",
            login: "admin",
            email: 'admin@admin.com',
            tel: 0,
            idrole: 1,
            password: '26411058mk',
            etat: 1,
        })
    }
}); */

// export User model for use in other files. 
module.exports = User;