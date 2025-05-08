'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
// ==== Associations ====
db.User.hasOne(db.Admin,    { foreignKey: 'userId' });
db.Admin.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.Teacher,    { foreignKey: 'userId' });
db.Teacher.belongsTo(db.User,  { foreignKey: 'userId' });

db.User.hasMany(db.Student,    { foreignKey: 'userId' });
db.Student.belongsTo(db.User,  { foreignKey: 'userId' });

db.SubscriptionPlan.hasMany(db.School, { foreignKey: 'planId' });
db.School.belongsTo(db.SubscriptionPlan, { foreignKey: 'planId' });

db.School.hasMany(db.Teacher, { foreignKey: 'schoolId' });
db.Teacher.belongsTo(db.School, { foreignKey: 'schoolId' });

db.Teacher.hasMany(db.Student, { foreignKey: 'teacherId' });
db.Student.belongsTo(db.Teacher, { foreignKey: 'teacherId' });

db.Test.hasMany(db.Question, { foreignKey: 'testId' });
db.Question.belongsTo(db.Test, { foreignKey: 'testId' });

db.Student.hasMany(db.Attempt, { foreignKey: 'studentId' });
db.Attempt.belongsTo(db.Student, { foreignKey: 'studentId' });

db.Test.hasMany(db.Attempt, { foreignKey: 'testId' });
db.Attempt.belongsTo(db.Test, { foreignKey: 'testId' });

db.School.hasMany(db.Payment, { foreignKey: 'schoolId' });
db.Payment.belongsTo(db.School, { foreignKey: 'schoolId' });

db.SubscriptionPlan.hasMany(db.Payment, { foreignKey: 'planId' });
db.Payment.belongsTo(db.SubscriptionPlan, { foreignKey: 'planId' });

db.User.hasMany(db.Message, { foreignKey: 'senderId',   as: 'SentMessages' });
db.User.hasMany(db.Message, { foreignKey: 'receiverId', as: 'ReceivedMessages' });
db.Message.belongsTo(db.User, { foreignKey: 'senderId',   as: 'Sender' });
db.Message.belongsTo(db.User, { foreignKey: 'receiverId', as: 'Receiver' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
