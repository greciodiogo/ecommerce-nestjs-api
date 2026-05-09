import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../settings/models/setting.entity';

@Controller('api/config')
export class ThemeConfigController {
  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepository: Repository<Setting>,
  ) {}

  /**
   * Retorna configuração de tema/cores do app
   * GET /api/config/theme
   * 
   * Usa a mesma cor do splash como cor primária do app
   */
  @Get('theme')
  async getTheme() {
    try {
      // Buscar configurações do banco de dados
      const settings = await this.settingsRepository.find({
        where: [
          { name: 'splash_color' },
          { name: 'app_primary_color' },
          { name: 'app_secondary_color' },
          { name: 'app_accent_color' },
        ],
      });

      // Converter array para objeto
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.name] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      // Usar splash_color como primária, ou campo específico se existir
      const primaryColor = settingsMap['app_primary_color'] || settingsMap['splash_color'] || '#FFB81C';
      const secondaryColor = settingsMap['app_secondary_color'] || '#FF9900';
      const accentColor = settingsMap['app_accent_color'] || '#FF6600';

      return {
        primaryColor: primaryColor,
        secondaryColor: secondaryColor,
        accentColor: accentColor,
        metadata: {
          source: settingsMap['app_primary_color'] ? 'app_primary_color' : 'splash_color',
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[THEME CONFIG] Erro ao carregar tema:', error);
      
      // Retorna tema padrão em caso de erro
      return {
        primaryColor: '#FFB81C',
        secondaryColor: '#FF9900',
        accentColor: '#FF6600',
        metadata: {
          source: 'fallback',
          lastUpdated: new Date().toISOString(),
        },
      };
    }
  }
}
