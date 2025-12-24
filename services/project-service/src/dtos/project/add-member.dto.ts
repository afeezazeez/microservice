import { IsNumber, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ProjectRole } from '../../enums/project-role.enum';

export class AddMemberDto {
    @IsNumber({}, { message: 'User ID must be a number' })
    @IsNotEmpty({ message: 'User ID is required' })
    user_id!: number;

    @IsEnum(ProjectRole, { message: 'Invalid project role' })
    @IsOptional()
    role?: ProjectRole;
}
