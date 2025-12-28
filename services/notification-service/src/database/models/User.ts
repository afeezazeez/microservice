import { Table, Column, Model, DataType, Index } from 'sequelize-typescript';

@Table({ tableName: 'users', timestamps: true, underscored: true })
export class User extends Model<User> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    allowNull: false,
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

  @Index
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  email!: string;
}

export default User;

