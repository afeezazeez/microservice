import { Table, Column, Model, DataType, Index } from 'sequelize-typescript';

@Table({ tableName: 'task_files', timestamps: true, underscored: true })
export class TaskFile extends Model<TaskFile> {
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
  task_id!: number;

  @Index
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  file_id!: number;
}

export default TaskFile;

