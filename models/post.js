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
      this.myAssociation = this.belongsTo(models.User, {as: 'repinnedFrom'})
      this.myAssociation = this.belongsToMany(models.User, {through: 'repinners'})
    }
  };
  Post.init({
    description: {
      type: DataTypes.TEXT,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    ogTitle: {
      type: DataTypes.STRING
    },
    ogDescription: {
      type: DataTypes.TEXT
    },
    ogImageUrl: {
      type: DataTypes.TEXT
    },
    ogSiteName: {
      type: DataTypes.STRING
    },
    ogType: {
      type: DataTypes.STRING
    },
    likeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    repinCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Post',
  });
  return Post;
};