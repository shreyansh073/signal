
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
      this.myAssociation = this.belongsTo(models.Users)
      this.myAssociation = this.belongsTo(models.Posts)
    }
  };
  Post.init({
    rating: {
      type: DataTypes.INTEGER,
    },
    review: {
      type: DataTypes.STRING
    },
  }, {
    sequelize,
    modelName: 'Ratings',
  });
  return Post;
};