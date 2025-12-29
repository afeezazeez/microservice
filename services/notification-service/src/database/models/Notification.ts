import { Table, Column, Model, DataType, Index } from 'sequelize-typescript';

@Table({ tableName: 'notifications', timestamps: true, underscored: true })
export class Notification extends Model<Notification> {
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
  user_id!: number;

  @Index
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  type!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  message!: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  metadata?: Record<string, any>;

  @Index
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  read_at?: Date;
}

export default Notification;

