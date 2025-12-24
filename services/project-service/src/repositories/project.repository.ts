import Project from '../database/models/Project';
import { BaseRepository } from './base.repository';

export class ProjectRepository extends BaseRepository<Project> {
    constructor() {
        super(Project);
    }
}
