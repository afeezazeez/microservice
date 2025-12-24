import { Table, Column, Model, DataType, HasMany, Index } from 'sequelize-typescript';
import ProjectMember from './ProjectMember';
import { ProjectStatus } from '../../enums/project-status.enum';

@Table({ tableName: 'projects', timestamps: true, underscored: true })
export class Project extends Model<Project> {
    @Column({
        autoIncrement: true,
        primaryKey: true,
        type: DataType.INTEGER,
    })
    id!: number;

    @Index
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    company_id!: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    name!: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
        unique: true,
    })
    slug!: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    description?: string;

    @Column({
        type: DataType.ENUM(...Object.values(ProjectStatus)),
        allowNull: false,
        defaultValue: ProjectStatus.ACTIVE,
    })
    status!: ProjectStatus;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    created_by!: number;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    start_date?: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    end_date?: Date;

    @HasMany(() => ProjectMember)
    members!: ProjectMember[];
}

export default Project;
