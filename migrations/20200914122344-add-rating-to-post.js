'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'Posts',
        'ratingCount',
        {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: 0
        },
        { transaction }
      );
      await queryInterface.addColumn(
        'Posts',
        'avgRating',
        {
          type: Sequelize.DataTypes.DOUBLE(5,2),
        },
        { transaction }
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('Posts', 'ratingCount', { transaction });
      await queryInterface.removeColumn('Posts', 'avgRating', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
