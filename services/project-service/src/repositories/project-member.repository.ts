import ProjectMember from '../database/models/ProjectMember';
import { BaseRepository } from './base.repository';

export class ProjectMemberRepository extends BaseRepository<ProjectMember> {
    constructor() {
        super(ProjectMember);
    }
}
