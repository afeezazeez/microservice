import { Table, Column, Model, DataType, ForeignKey, BelongsTo, Index } from 'sequelize-typescript';
import Task from './Task';

@Table({ tableName: 'task_watchers', timestamps: true, underscored: true })
export class TaskWatcher extends Model<TaskWatcher> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.INTEGER,
  })
  id!: number;

  @Index
  @ForeignKey(() => Task)
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
  user_id!: number;

  @BelongsTo(() => Task)
  task!: Task;
}

export default TaskWatcher;

