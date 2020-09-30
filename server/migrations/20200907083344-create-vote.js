module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('votes', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.BIGINT,
      },
      objectType: {
        type: Sequelize.STRING
      },
      objectId: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      }
    }, {
      timestamps: true,
      charset: 'utf8mb4',
      indexes: [{
        fields: ['userId']
      }, {
        fields: ['objectType']
      }, {
        fields: ['objectId']
      }, {
        fields: ['type']
      }]
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('votes');
  }
};