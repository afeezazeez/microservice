import { IsString, IsOptional, IsEnum, MaxLength, MinLength } from 'class-validator';
import { ProjectStatus } from '../../enums/project-status.enum';

export class UpdateProjectDto {
    @IsString()
    @IsOptional()
    @MinLength(2, { message: 'Project name must be at least 2 characters' })
    @MaxLength(255, { message: 'Project name must not exceed 255 characters' })
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(ProjectStatus, { message: 'Invalid project status' })
    @IsOptional()
    status?: ProjectStatus;

    @IsString()
    @IsOptional()
    start_date?: string;

    @IsString()
    @IsOptional()
    end_date?: string;
}
