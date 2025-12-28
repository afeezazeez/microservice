import { Table, Column, Model, DataType, HasMany, Index } from 'sequelize-typescript';
import TaskWatcher from './TaskWatcher';
import { TaskStatus } from '../../enums/task-status.enum';

@Table({ tableName: 'tasks', timestamps: true, underscored: true })
export class Task extends Model<Task> {
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
  project_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.ENUM(...Object.values(TaskStatus)),
    allowNull: false,
    defaultValue: TaskStatus.TODO,
  })
  status!: TaskStatus;

  @Index
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  assigned_to?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  created_by!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  due_date?: Date;

  @HasMany(() => TaskWatcher)
  watchers!: TaskWatcher[];
}

export default Task;

