module.exports = (sequelize, DataTypes) => {
    const Follow = sequelize.define('Follows', {
        SourceId: {
            allowNull: false,
            type: DataTypes.INTEGER,
            references: {
              model: "Users",
              key: "id"
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          DestinationId: {
            allowNull: false,
            type: DataTypes.INTEGER,
            references: {
              model: "Users",
              key: "id"
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          }
    });
  
    return Follow;
  };