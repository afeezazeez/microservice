import { IProject, IProjectMember } from '../../interfaces/project.interface';

export class ProjectMemberDto {
    id: number;
    user_id: number;
    joined_at: string | null;

    constructor(member: any) {
        this.id = member.id;
        this.user_id = member.user_id;
        this.joined_at = member.joined_at ? new Date(member.joined_at).toISOString() : null;
    }

    static make(member: any): IProjectMember {
        return new ProjectMemberDto(member);
    }

    static collection(members: any[]): IProjectMember[] {
        if (!members || !Array.isArray(members)) {
            return [];
        }
        return members.map(member => ProjectMemberDto.make(member));
    }
}

class ProjectResponseDto {
    id: number;
    company_id: number;
    name: string;
    slug: string;
    description: string | null;
    status: string;
    created_by: number;
    start_date: string | null;
    end_date: string | null;
    members?: IProjectMember[];
    created_at: string;
    updated_at: string;

    constructor(project: any) {
        this.id = project.id;
        this.company_id = project.company_id;
        this.name = project.name;
        this.slug = project.slug;
        this.description = project.description || null;
        this.status = project.status;
        this.created_by = project.created_by;
        this.start_date = project.start_date ? new Date(project.start_date).toISOString() : null;
        this.end_date = project.end_date ? new Date(project.end_date).toISOString() : null;
        this.created_at = new Date(project.createdAt || project.created_at).toISOString();
        this.updated_at = new Date(project.updatedAt || project.updated_at).toISOString();

        if (project.members) {
            this.members = ProjectMemberDto.collection(project.members);
        }
    }

    static make(project: any): IProject {
        return new ProjectResponseDto(project) as IProject;
    }

    static collection(projects: any[]): IProject[] {
        if (!projects || !Array.isArray(projects)) {
            return [];
        }
        return projects.map(project => ProjectResponseDto.make(project));
    }
}

export default ProjectResponseDto;
