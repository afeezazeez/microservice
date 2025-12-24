import { QueryInterface, DataTypes } from 'sequelize';

export default {
    up: async (queryInterface: QueryInterface) => {
        await queryInterface.createTable('projects', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            company_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            slug: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM('active', 'archived', 'completed'),
                allowNull: false,
                defaultValue: 'active',
            },
            created_by: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            start_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            end_date: {
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

        await queryInterface.addIndex('projects', ['company_id']);
        await queryInterface.addIndex('projects', ['slug']);
        await queryInterface.addIndex('projects', ['status']);
    },

    down: async (queryInterface: QueryInterface) => {
        await queryInterface.dropTable('projects');
    },
};

