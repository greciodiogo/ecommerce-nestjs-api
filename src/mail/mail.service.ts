import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  private emailTransport() {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: this.configService.get<string>('email.user'),
        pass: this.configService.get<string>('email.pass'),
        },
    });
  }

  private compileTemplate(templateName: string, context: any) {
    const templatePath = path.join(process.cwd(), 'src', 'mail', 'templates', templateName);

    const source = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(source);
    return template(context);
  }

  async sendConfirmationEmail(to: string, subject: string, code: string, expiration: Date) {
    const html = this.compileTemplate('confirmation-code.html', { code, expiration });

    const mailOptions = {
      from: this.configService.get<string>('email.user'),
      to,
      subject: subject,
      html,
    };

    try {
      await this.emailTransport().sendMail(mailOptions);
      return { message: 'Código enviado para o seu email.' };
    } catch (err) {
      console.error('Erro ao enviar e-mail:', err);
    }
  }
}
