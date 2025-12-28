import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('task_watchers', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      task_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.addIndex('task_watchers', ['task_id']);
    await queryInterface.addIndex('task_watchers', ['user_id']);
    await queryInterface.addIndex('task_watchers', ['task_id', 'user_id'], {
      unique: true,
      name: 'task_watchers_task_user_unique',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('task_watchers');
  },
};

