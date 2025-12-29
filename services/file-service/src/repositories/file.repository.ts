import File from '../database/models/File';
import { BaseRepository } from './base.repository';

export class FileRepository extends BaseRepository<File> {
  constructor() {
    super(File);
  }

}

