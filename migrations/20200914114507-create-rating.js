'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Ratings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      PostId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "Posts",
          key: "id"
        },
        primaryKey: true,
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      UserId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "Users",
          key: "id"
        },
        primaryKey: true,
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      rating: {
        type: Sequelize.INTEGER,
      },
      review: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('Ratings');
  }
};