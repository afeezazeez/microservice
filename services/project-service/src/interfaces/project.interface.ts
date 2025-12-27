import { ProjectStatus } from '../enums/project-status.enum';

export interface IProjectMember {
    id: number;
    user_id: number;
    joined_at: string | null;
}

export interface IProject {
    id: number;
    company_id: number;
    name: string;
    slug: string;
    description: string | null;
    status: ProjectStatus;
    created_by: number;
    start_date: string | null;
    end_date: string | null;
    members?: IProjectMember[];
    created_at: string;
    updated_at: string;
}


