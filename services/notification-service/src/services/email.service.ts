import nodemailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export class EmailService {
  private transporter: Transporter;
  private templatesPath: string;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: config.email.auth.user ? {
        user: config.email.auth.user,
        pass: config.email.auth.pass,
      } : undefined,
    });

    this.templatesPath = path.join(__dirname, '../../views/emails');
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const html = await this.renderTemplate(options.template, options.data);

      const mailOptions = {
        from: `"${config.email.from.name}" <${config.email.from.address}>`,
        to: options.to,
        subject: options.subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      logger.error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async renderTemplate(templateName: string, data: Record<string, any>): Promise<string> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.ejs`);
      
      const templateData = {
        ...data,
        frontendUrl: config.frontendUrl,
      };

      const templateContent = await ejs.renderFile(templatePath, templateData);

      const mainLayoutPath = path.join(this.templatesPath, 'main.ejs');
      const fullHtml = await ejs.renderFile(mainLayoutPath, {
        title: data.title || 'TaskFlow',
        body: templateContent,
        ...templateData,
      });

      return fullHtml;
    } catch (error) {
      throw error;
    }
  }

  async sendUserInvitation(data: {
    to: string;
    userName: string;
    userEmail: string;
    companyName: string;
    roleName: string;
  }): Promise<void> {
    await this.sendEmail({
      to: data.to,
      subject: `Welcome to TaskFlow - You've been invited to join ${data.companyName}`,
      template: 'user-invitation',
      data: {
        title: 'Welcome to TaskFlow',
        userName: data.userName,
        userEmail: data.userEmail,
        companyName: data.companyName,
        roleName: data.roleName,
        loginUrl: `${config.frontendUrl}/login`,
      },
    });
  }

}

