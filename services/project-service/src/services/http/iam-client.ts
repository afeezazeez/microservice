import axios, { AxiosInstance } from 'axios';
import { WinstonLogger } from '../../utils/logger/winston.logger';

const IAM_SERVICE_URL = process.env.IAM_SERVICE_URL || 'http://iam-service';

const Logger = new WinstonLogger('IAMHttpClient');

export interface CheckPermissionParams {
  userId: number;
  permissionSlug: string;
  companyId: number;
  resourceType?: string | null;
  resourceId?: number | null;
}

export class IAMHttpClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: IAM_SERVICE_URL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async checkPermission(params: CheckPermissionParams): Promise<boolean> {
    try {
      const response = await this.client.post('/api/permissions/check', {
        user_id: params.userId,
        permission_slug: params.permissionSlug,
        company_id: params.companyId,
        resource_type: params.resourceType || null,
        resource_id: params.resourceId || null,
      });

      return response.data?.data?.allowed === true;
    } catch (error: any) {
      Logger.error('HTTP permission check failed', {
        error: error.message,
        status: error.response?.status,
        params,
      });
      throw error;
    }
  }
}

export const iamHttpClient = new IAMHttpClient();

