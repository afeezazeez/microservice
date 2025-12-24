import { IsNumber, IsNotEmpty } from 'class-validator';

export class AddMemberDto {
    @IsNumber({}, { message: 'User ID must be a number' })
    @IsNotEmpty({ message: 'User ID is required' })
    user_id!: number;
}
