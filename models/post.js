
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
      this.myAssociation = this.belongsTo(models.Users, {as: 'owner'})
      this.myAssociation = this.belongsTo(models.Users, {as: 'repinnedFrom'})
      this.myAssociation = this.belongsTo(models.Posts, {as: 'repinnedFromPost'})
      this.myAssociation = this.belongsToMany(models.Users, {through: models.Repinners})
      this.myAssociation = this.hasMany(models.Ratings)
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
    },
    ratingCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    avgRating: {
      type: DataTypes.DOUBLE(5,2),
    }
  }, {
    sequelize,
    modelName: 'Posts',
  });
  return Post;
};