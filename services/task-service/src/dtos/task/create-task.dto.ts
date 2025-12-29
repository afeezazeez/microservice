import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsDateString, MaxLength, MinLength } from 'class-validator';
import { TaskStatus } from '../../enums/task-status.enum';

export class CreateTaskDto {
  @IsInt()
  @IsNotEmpty({ message: 'Project ID is required' })
  project_id!: number;

  @IsString()
  @IsNotEmpty({ message: 'Task title is required' })
  @MinLength(2, { message: 'Task title must be at least 2 characters' })
  @MaxLength(255, { message: 'Task title must not exceed 255 characters' })
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsInt()
  @IsOptional()
  assigned_to?: number;

  @IsDateString()
  @IsOptional()
  due_date?: string;

  @IsInt({ each: true })
  @IsOptional()
  file_ids?: number[];
}

