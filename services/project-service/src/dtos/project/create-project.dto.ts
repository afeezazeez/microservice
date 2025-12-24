import { IsString, IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateProjectDto {
    @IsString()
    @IsNotEmpty({ message: 'Project name is required' })
    @MinLength(2, { message: 'Project name must be at least 2 characters' })
    @MaxLength(255, { message: 'Project name must not exceed 255 characters' })
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    start_date?: string;

    @IsString()
    @IsOptional()
    end_date?: string;
}
