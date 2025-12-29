import { Table, Column, Model, DataType, Index } from 'sequelize-typescript';

@Table({ tableName: 'files', timestamps: true, underscored: true })
export class File extends Model<File> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.INTEGER,
  })
  id!: number;


  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  filename!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  original_name!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  mime_type!: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  size!: number;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
  })
  storage_path!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  uploaded_by!: number;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  thumbnail_path?: string;
}

export default File;

