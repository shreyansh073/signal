'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Schools', [
      {
        name: 'MIT',
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
        name: 'Wharton',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'Caltech',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'Columbia',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'UPenn',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'Brown University',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'Berkeley',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'Northwestern',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'UCLA',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'Babson',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'Oxford',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'BITS Pilani',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'Carnegie Mellon',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'Colby',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'John Hopkins',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'SRCC',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'Univ of California San Deigo',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        name: 'Cambridge',
        createdAt: new Date(),
        updatedAt: new Date()
      },
  ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.bulkDelete('Schools', null, {});
  }
};
