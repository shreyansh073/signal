'use strict';
const bcrypt = require('bcrypt')
const pass = bcrypt.hashSync('comet', 8)
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Users', [
      {
        name: 'shreyansh',
        username: 'shreyansh',
        email: 'shreyansh@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'chandak',
        username: 'chandak',
        email: 'chandak@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'ankit',
        username: 'ankit',
        email: 'ankit@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'gupta',
        username: 'gupta',
        email: 'gupta@example.com',
        password: pass,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'pradyumn',
        username: 'pradyumn',
        email: 'pradyumn@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'awasthi',
        username: 'awasthi',
        email: 'awasthi@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'john',
        username: 'john',
        email: 'john@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'doe',
        username: 'doe',
        email: 'doe@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'paul',
        username: 'paul',
        email: 'paul@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'graham',
        username: 'graham',
        email: 'graham@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'kunal',
        username: 'kunal',
        email: 'kunal@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'shah',
        username: 'shah',
        email: 'shah@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'tired',
        username: 'tired',
        email: 'tired@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'bored',
        username: 'bored',
        email: 'bored@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'unicorn',
        username: 'unicorn',
        email: 'unicorn@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'decacorn',
        username: 'decacorn',
        email: 'decacorn@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'cel',
        username: 'cel',
        email: 'cel@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'bits',
        username: 'bits',
        email: 'bits@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'anonymous',
        username: 'anonymous',
        email: 'anonymous@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'sam',
        username: 'sam',
        email: 'sam@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'altman',
        username: 'altman',
        email: 'altman@example.com',
        password: pass,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
  ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.bulkDelete('Users', null, {});
  }
};
