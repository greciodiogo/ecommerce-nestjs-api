import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

@Injectable()
export class AppStoreConnectService {
  private readonly logger = new Logger(AppStoreConnectService.name);
  private readonly baseUrl = 'https://api.appstoreconnect.apple.com/v1';
  
  // Configurações da API Key (devem vir do .env)
  private readonly keyId = process.env.APP_STORE_KEY_ID; // VA5KZT38RU
  private readonly issuerId = process.env.APP_STORE_ISSUER_ID; // 61838bd2-03e4-4df8-9d72-c9b885d84baa
  private readonly privateKey = process.env.APP_STORE_PRIVATE_KEY; // Conteúdo do arquivo .p8
  private readonly appId = process.env.APP_STORE_APP_ID; // ID do app no App Store Connect

  /**
   * Gera um JWT token para autenticação na App Store Connect API
   * O token expira em 20 minutos (máximo permitido pela Apple)
   */
  private generateToken(): string {
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      iss: this.issuerId,
      iat: now,
      exp: now + (20 * 60), // 20 minutos
      aud: 'appstoreconnect-v1',
    };

    const header = {
      alg: 'ES256',
      kid: this.keyId,
      typ: 'JWT',
    };

    try {
      return jwt.sign(payload, this.privateKey, { 
        algorithm: 'ES256',
        header 
      });
    } catch (error) {
      this.logger.error('Erro ao gerar JWT token:', error);
      throw new Error('Falha ao gerar token de autenticação');
    }
  }

  /**
   * Faz uma requisição autenticada para a App Store Connect API
   */
  private async makeRequest(endpoint: string, params: any = {}) {
    const token = this.generateToken();
    
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params,
      });
      
      return response.data;
    } catch (error) {
      this.logger.error(`Erro na requisição para ${endpoint}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Busca informações do app
   */
  async getAppInfo() {
    try {
      const data = await this.makeRequest(`/apps/${this.appId}`);
      return data;
    } catch (error) {
      this.logger.error('Erro ao buscar informações do app:', error);
      throw error;
    }
  }

  /**
   * Busca métricas de downloads
   * @param startDate Data inicial (formato: YYYY-MM-DD)
   * @param endDate Data final (formato: YYYY-MM-DD)
   */
  async getDownloads(startDate: string, endDate: string) {
    try {
      // Endpoint para métricas de app analytics
      const data = await this.makeRequest('/analyticsReportRequests', {
        'filter[app]': this.appId,
        'filter[reportType]': 'INSTALLS',
        'filter[reportSubType]': 'SUMMARY',
        'filter[frequency]': 'DAILY',
        'filter[reportDate]': `${startDate}...${endDate}`,
      });
      
      return this.parseDownloadsData(data);
    } catch (error) {
      this.logger.error('Erro ao buscar downloads:', error);
      throw error;
    }
  }

  /**
   * Busca avaliações (ratings) do app
   */
  async getRatings() {
    try {
      const data = await this.makeRequest(`/apps/${this.appId}/customerReviews`, {
        'sort': '-createdDate',
        'limit': 100,
      });
      
      return this.parseRatingsData(data);
    } catch (error) {
      this.logger.error('Erro ao buscar avaliações:', error);
      throw error;
    }
  }

  /**
   * Busca distribuição de versões do app
   */
  async getVersionDistribution() {
    try {
      const data = await this.makeRequest('/analyticsReportRequests', {
        'filter[app]': this.appId,
        'filter[reportType]': 'APP_USAGE',
        'filter[reportSubType]': 'APP_VERSION',
        'filter[frequency]': 'DAILY',
      });
      
      return this.parseVersionData(data);
    } catch (error) {
      this.logger.error('Erro ao buscar distribuição de versões:', error);
      throw error;
    }
  }

  /**
   * Busca crashes e erros
   */
  async getCrashes(startDate: string, endDate: string) {
    try {
      const data = await this.makeRequest('/analyticsReportRequests', {
        'filter[app]': this.appId,
        'filter[reportType]': 'CRASHES',
        'filter[reportSubType]': 'SUMMARY',
        'filter[frequency]': 'DAILY',
        'filter[reportDate]': `${startDate}...${endDate}`,
      });
      
      return this.parseCrashesData(data);
    } catch (error) {
      this.logger.error('Erro ao buscar crashes:', error);
      throw error;
    }
  }

  /**
   * Busca todas as métricas de uma vez
   */
  async getAllMetrics(startDate: string, endDate: string) {
    try {
      const [appInfo, downloads, ratings, versions, crashes] = await Promise.all([
        this.getAppInfo(),
        this.getDownloads(startDate, endDate),
        this.getRatings(),
        this.getVersionDistribution(),
        this.getCrashes(startDate, endDate),
      ]);

      return {
        appInfo,
        downloads,
        ratings,
        versions,
        crashes,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Erro ao buscar todas as métricas:', error);
      throw error;
    }
  }

  // ========== Métodos auxiliares para parsear dados ==========

  private parseDownloadsData(data: any) {
    // Parsear dados de downloads da resposta da API
    // A estrutura exata depende da resposta da API
    return {
      total: 0,
      byDate: [],
      byCountry: [],
    };
  }

  private parseRatingsData(data: any) {
    if (!data?.data) {
      return {
        average: 0,
        total: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recent: [],
      };
    }

    const reviews = data.data;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    reviews.forEach((review: any) => {
      const rating = review.attributes?.rating || 0;
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
        totalRating += rating;
      }
    });

    const total = reviews.length;
    const average = total > 0 ? totalRating / total : 0;

    return {
      average: parseFloat(average.toFixed(2)),
      total,
      distribution,
      recent: reviews.slice(0, 10).map((review: any) => ({
        id: review.id,
        rating: review.attributes?.rating,
        title: review.attributes?.title,
        body: review.attributes?.body,
        reviewerNickname: review.attributes?.reviewerNickname,
        createdDate: review.attributes?.createdDate,
      })),
    };
  }

  private parseVersionData(data: any) {
    // Parsear dados de versões da resposta da API
    return {
      versions: [],
    };
  }

  private parseCrashesData(data: any) {
    // Parsear dados de crashes da resposta da API
    return {
      total: 0,
      byDate: [],
      byVersion: [],
    };
  }
}
