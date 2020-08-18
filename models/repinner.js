module.exports = (sequelize, DataTypes) => {
    const Repinner = sequelize.define('Repinners', {
        PostId: {
            allowNull: false,
            type: DataTypes.INTEGER,
            references: {
              model: "Posts",
              key: "id"
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          UserId: {
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
  
    return Repinner;
  };