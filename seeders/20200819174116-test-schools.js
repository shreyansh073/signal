'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Schools', [
      {
        name: 'BITS Pilani',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Stanford',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'Harvard',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'SRCC',
        createdAt: new Date(),
        updatedAt: new Date()
      },
  ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.bulkDelete('Schools', null, {});
  }
};
