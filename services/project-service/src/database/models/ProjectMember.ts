import { Table, Column, Model, DataType, ForeignKey, BelongsTo, Index } from 'sequelize-typescript';
import Project from './Project';

@Table({ tableName: 'project_members', timestamps: true, underscored: true })
export class ProjectMember extends Model<ProjectMember> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.INTEGER,
  })
  id!: number;

  @Index
  @ForeignKey(() => Project)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  project_id!: number;

  @Index
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  joined_at?: Date;

  @BelongsTo(() => Project)
  project!: Project;
}

export default ProjectMember;
