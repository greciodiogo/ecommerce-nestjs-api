import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Code } from './models/code.entity';
import { NotFoundError } from '../errors/not-found.error';
import { ConflictError } from '../errors/conflict.error';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import { CodeUpdateDto } from './dto/code-update.dto';


@Injectable()
export class CodesService {
  constructor(
    @InjectRepository(Code) private readonly codesRepository: Repository<Code>,
    private readonly mailService: MailService, 
  ) {}

  async sendVerificationCode(email: string): Promise<any> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
  
    try {
      // Tenta criar o código no banco
      const createdCode = await this.addCode(email, code, expiration);
  
      // Garante que foi criado com sucesso
      if (!createdCode) {
        throw new Error('Falha ao salvar o código no banco de dados');
      }
  
      // Só envia e-mail se salvou com sucesso
      await this.sendVerificationCodeToEmail(email, code, expiration);
  
      return { message: 'Código de verificação enviado com sucesso' };
  
    } catch (error) {
      console.error('Erro ao enviar código de verificação:', error);
      throw new ConflictError('sendVerificationCode', 'internal', 'Não foi possível enviar o código. Tente novamente.');
    }
  }

  async verifyCode(
    email: string,
    code: string,
  ): Promise<any> {
    try {
      const record = await this.codesRepository.findOne({ where: { email, code } });

      if (!record) {
        throw new ConflictError('code', 'expiresAt', 'Código inválido');
      }
      
      const isExpired = record.expiresAt.getTime() < Date.now();
      if (isExpired) {
        throw new ConflictError('code', 'expiresAt', 'Código expirado');
      }
      return { message: 'Código validado com sucesso' }
    } catch (error) {
      throw new ConflictError('code', 'email', email);
    }
  }

  async addCode(
    email: string,
    validCode: string,
    expiresAt: Date,
  ): Promise<any> {
    try {
      const code = new Code();
      code.email = email;
      code.code = validCode;
      code.expiresAt = expiresAt;
      const savedCode = await this.codesRepository.save(code);
      return savedCode;
    } catch (error) {
      throw new ConflictError('code', 'email', email);
    }
  }

  async sendVerificationCodeToEmail(
    email: string,
    validCode: string,
    expiresAt: Date,
  ): Promise<any> {
    const subject = 'código de confirmação'
    return await this.mailService.sendConfirmationEmail(email, subject, validCode, expiresAt);
  }
  
  async findCodeByEmail(email: string): Promise<Code | null> {
    return await this.codesRepository.findOne({
      where: { email },
    });
  }

  async getCodes(): Promise<Code[]> {
    return await this.codesRepository.find();
  }

  async getCode(id: number): Promise<Code> {
    const code = await this.codesRepository.findOne({ where: { id } });
    if (!code) {
      throw new NotFoundError('code', 'id', id.toString());
    }
    return code;
  }

  async updateCode(id: number, update: CodeUpdateDto): Promise<Code> {
    const code = await this.codesRepository.findOne({ where: { id } });
    if (!code) {
      throw new NotFoundError('code', 'id', id.toString());
    }
    Object.assign(code, update);
    await this.codesRepository.save(code);
    return code;
  }

  async deleteCode(id: number): Promise<boolean> {
    const code = await this.codesRepository.findOne({
      where: { id },
    });
    if (!code) {
      throw new NotFoundError('code', 'id', id.toString());
    }
    await this.codesRepository.delete({ id });
    return true;
  }
}
