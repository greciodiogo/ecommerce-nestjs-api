import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { FeedbackDto } from './dto/feedback.dto';

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

  async sendOrderInvoiceEmail(to: string, order: any) {
    // const final_order = 
    const html = this.compileTemplate('order-invoice.html', { order });
    const subject = 'Resumo do Pedido'
    const mailOptions = {
      from: this.configService.get<string>('email.user'),
      to,
      subject: subject,
      html,
    };

    try {
      await this.emailTransport().sendMail(mailOptions);
      return { message: 'Resumo do pedido enviado para o seu email.' };
    } catch (err) {
      console.error('Erro ao enviar e-mail:', err);
    }
  }

  async sendFeedbackEmail(feedbackDto: FeedbackDto) {
    const { email, subject, body } = feedbackDto;
    const adminEmail = this.configService.get<string>('admin.email');

    const html = this.compileTemplate('feedback.html', {
      email,
      subject,
      body,
    });

    const mailOptions = {
      to: `"${email}" <${this.configService.get<string>('email.user')}>`,
      from: adminEmail,
      replyTo: email,
      subject: `Novo Feedback/Reclamação: ${subject}`,
      html,
    };

    try {
      await this.emailTransport().sendMail(mailOptions);
      return { message: 'Seu feedback foi enviado com sucesso.' };
    } catch (err) {
      console.error('Erro ao enviar e-mail de feedback:', err);
    }
  }

  async sendMailWithAttachment({ to, subject, text, attachments }: { to: string, subject: string, text: string, attachments: any[] }) {
    const mailOptions = {
      from: this.configService.get<string>('email.user'),
      to,
      subject,
      text,
      attachments,
    };
    try {
      await this.emailTransport().sendMail(mailOptions);
      return { message: 'Email with attachment sent.' };
    } catch (err) {
      console.error('Erro ao enviar e-mail com anexo:', err);
    }
  }
}
