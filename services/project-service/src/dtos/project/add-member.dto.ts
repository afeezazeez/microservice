import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class AddMemberDto {
    @IsNumber({}, { message: 'User ID must be a number' })
    @IsNotEmpty({ message: 'User ID is required' })
    @Min(1, { message: 'User ID must be greater than 0' })
    user_id!: number;
}
