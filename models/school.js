'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class School extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.myAssociation = this.hasMany(models.Users)
    }
  };

  School.init({
    name: {
      type: DataTypes.STRING,
      unique: true
    },
    logo: {
        type: DataTypes.STRING,
    }
  }, {
    sequelize,
    modelName: 'Schools',
  });

  return School;
};