'use strict';
const bcrypt = require('bcrypt')
const {SendEmailVerificationEmail} = require('../util/email/send');
const {getStreamClient} = require('../util/stream')
const jwt = require('jsonwebtoken')

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
      this.myAssociation = this.hasMany(models.Post, {as: 'owner'})
      this.myAssociation = this.hasMany(models.Post, {as: 'repinnedFrom'})
      this.myAssociation = this.belongsToMany(models.Post, {through: 'Repinner'})
      this.myAssociation = this.belongsToMany(models.User, {as: 'Destination',foreignKey: 'SourceId', through: 'Follow'})    
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
    avatar: {
      type: DataTypes.BLOB('tiny')
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
    school: {
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
    OTP: {
      type: DataTypes.INTEGER,
    },
    OTPCreatedAt: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'User',
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
      user.isVerified = false;
      await user.save();
    }
  }

  User.prototype.isValidOTP = async function(otp){
    const user = this;
    if((Date.now().valueOf() - user.OTPCreatedAt.valueOf())/1000 < 60 && user.OTP === parseInt(otp)){
      user.isVerified = true;
      user.save();
    }
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
      school: user.school,
      work: user.work,
      followerCount: user.followerCount,
      followingCount: user.followingCount,
      postCount: user.postCount,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      streamToken: streamToken,
      token: jwt.sign({email: user.email, id: user.id}, process.env.JWT_SECRET)
    }
    return serialized;
  }

  return User;
};