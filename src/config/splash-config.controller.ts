import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../settings/models/setting.entity';

@Controller('api/config')
export class SplashConfigController {
  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepository: Repository<Setting>,
  ) {}

  /**
   * Retorna configuração da animação de splash
   * GET /api/config/splash-animation
   * 
   * Este endpoint replica o comportamento do encontrarCore
   * para manter compatibilidade com apps já publicados nas lojas
   */
  @Get('splash-animation')
  async getSplashAnimation() {
    try {
      // Buscar configurações do banco de dados
      const settings = await this.settingsRepository.find({
        where: [
          { name: 'splash_version' },
          { name: 'splash_color' },
          { name: 'splash_animation_url' },
          { name: 'splash_enabled' },
        ],
      });

      // Converter array para objeto para fácil acesso
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.name] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      // Valores com fallback
      const version = settingsMap['splash_version'] || '1.1.0';
      const backgroundColor = settingsMap['splash_color'] || '#FF9900';
      const enabled = settingsMap['splash_enabled'] === 'true' || true;
      const animationUrl = 
        settingsMap['splash_animation_url'] || 
        `https://api.encontrarshopping.com/static/animations/splash_v${version}.json`;

      return {
        version: version,
        url: animationUrl,
        checksum: null, // Opcional: pode calcular MD5 se necessário
        enabled: enabled,
        backgroundColor: backgroundColor,
        metadata: {
          fileSize: 98828, // bytes (tamanho real do arquivo)
          duration: 3000, // ms
          lastUpdated: new Date().toISOString(),
        },
        platforms: {
          android: {
            url: animationUrl,
            minVersion: '1.0.0',
          },
          ios: {
            url: animationUrl,
            minVersion: '1.0.0',
          },
        },
      };
    } catch (error) {
      console.error('[SPLASH CONFIG] Erro ao carregar configuração:', error);
      
      // Retorna configuração padrão em caso de erro
      const version = '1.1.0';
      return {
        version: version,
        url: `https://api.encontrarshopping.com/static/animations/splash_v${version}.json`,
        checksum: null,
        enabled: true,
        backgroundColor: '#FF9900',
        metadata: {
          fileSize: 98828,
          duration: 3000,
          lastUpdated: new Date().toISOString(),
        },
        platforms: {
          android: {
            url: `https://api.encontrarshopping.com/static/animations/splash_v${version}.json`,
            minVersion: '1.0.0',
          },
          ios: {
            url: `https://api.encontrarshopping.com/static/animations/splash_v${version}.json`,
            minVersion: '1.0.0',
          },
        },
      };
    }
  }
}
