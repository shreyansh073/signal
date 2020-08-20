'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
      },
      username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
        validate: {
          is: /^[a-zA-Z0-9_.]+$/i,
          len: [1,20]
        }
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isOnboardingComplete: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      avatarUrl: {
        type: Sequelize.STRING
      },
      bio: {
        type: Sequelize.STRING
      },
      work: {
        type: Sequelize.STRING
      },
      SchoolId: {
        type: Sequelize.STRING,
        references: {
          model: "Schools",
          key: "name"
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      location: {
        type: Sequelize.STRING
      },
      postCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      followerCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      followingCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      OTP: {
        type: Sequelize.INTEGER,
      },
      OTPCreatedAt: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};