import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('task_files', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      task_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      file_id: {
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

    await queryInterface.addIndex('task_files', ['task_id']);
    await queryInterface.addIndex('task_files', ['file_id']);
    await queryInterface.addIndex('task_files', ['task_id', 'file_id'], {
      unique: true,
      name: 'task_files_unique',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('task_files');
  },
};

