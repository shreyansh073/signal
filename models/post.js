'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.myAssociation = this.belongsTo(models.User, {as: 'owner'})
      this.myAssociation = this.hasOne(models.Post, {as: 'repin'})
    }
  };
  Post.init({
    description: {
      type: DataTypes.STRING,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    likes: {
      type: DataTypes.INTEGER
    },
    repins: {
      type: DataTypes.INTEGER
    }
  }, {
    sequelize,
    modelName: 'Post',
  });
  return Post;
};