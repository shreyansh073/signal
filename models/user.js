'use strict';
const bcrypt = require('bcrypt')
const {SendEmailVerificationEmail} = require('../util/email/send');
const {getStreamClient} = require('../util/stream')

const {
  Model
} = require('sequelize');
const { connect } = require('getstream');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.myAssociation = this.belongsTo(models.Schools)
      this.myAssociation = this.hasMany(models.Posts, {as: 'owner'})
      this.myAssociation = this.hasMany(models.Posts, {as: 'repinnedFrom'})
      this.myAssociation = this.belongsToMany(models.Posts, {through: models.Repinners})
      this.myAssociation = this.hasMany(models.Ratings)
      this.myAssociation = this.belongsToMany(models.Users, {as: 'Destination',foreignKey: 'SourceId', through: models.Follows})    
    }
  };

  User.init({
    name: {
      type: DataTypes.STRING,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        is: /^[a-zA-Z0-9_.]+$/i,
        len: [1,20]
      }
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isOnboardingComplete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    avatarUrl: {
      type: DataTypes.STRING
    },
    bio: {
      type: DataTypes.STRING
    },
    work: {
      type: DataTypes.STRING
    },
    location: {
      type: DataTypes.STRING
    },
    postCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    followerCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    followingCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    expoToken: {
      type: DataTypes.STRING
    },
    token: {
      type: DataTypes.STRING
    },
    OTP: {
      type: DataTypes.INTEGER,
    },
    OTPCreatedAt: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Users',
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 8)
      },
    }
  });

  User.prototype.validPassword =  async function(password) {
    return bcrypt.compare(password, this.password);
  }

  User.prototype.setOTP = async function(){
    const user = this;
    if((Date.now().valueOf() - user.OTPCreatedAt.valueOf())/1000 > 60){
      const min = parseInt(process.env.MINOTP)
      const max = parseInt(process.env.MAXOTP)
      user.OTP = Math.round(Math.random() * (max - min) + min);
      user.OTPCreatedAt = sequelize.literal('CURRENT_TIMESTAMP')
      user.isVerified = false;
      await user.save();
    }
  }

  User.prototype.isValidOTP = async function(otp){
    const user = this;
    if(((Date.now().valueOf() - user.OTPCreatedAt.valueOf())/1000 < 60000) && user.OTP === parseInt(otp)){
      user.isVerified = true;
      await user.save();
      return true;
    }
    return false;
  }

  User.prototype.serializeAuthenticatedUser = function(){
    let serialized;
    const user = this;

    let streamToken = getStreamClient().createUserToken(`${user.id}`)

    serialized = {
      id: user.id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      school: user.SchoolId,
      work: user.work,
      followerCount: user.followerCount,
      followingCount: user.followingCount,
      postCount: user.postCount,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      isOnboardingComplete: user.isOnboardingComplete,
      createdAt: user.createdAt,
      streamToken: streamToken,
      token: user.token
    }
    return serialized;
  }

  return User;
};