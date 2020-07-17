'use strict';
const bcrypt = require('bcrypt')
const {SendEmailVerificationEmail} = require('../util/email/send');
const jwt = require('jsonwebtoken')
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
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
        isAlphanumeric: true
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
    avatar: {
      type: DataTypes.BLOB('long')
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

    serialized = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      token: jwt.sign({email: user.email, id: user.id}, process.env.JWT_SECRET)
    }
    return serialized;
  }

  return User;
};