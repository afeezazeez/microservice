import { QueryInterface, DataTypes } from 'sequelize';

export default {
    up: async (queryInterface: QueryInterface) => {
        await queryInterface.createTable('project_members', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            project_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'projects',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            joined_at: {
                type: DataTypes.DATE,
                allowNull: true,
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

        await queryInterface.addIndex('project_members', ['project_id']);
        await queryInterface.addIndex('project_members', ['user_id']);
        await queryInterface.addIndex('project_members', ['project_id', 'user_id'], {
            unique: true,
            name: 'project_members_project_user_unique',
        });
    },

    down: async (queryInterface: QueryInterface) => {
        await queryInterface.dropTable('project_members');
    },
};

