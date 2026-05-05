/**
 * Script para traduzir produtos automaticamente
 * 
 * IMPORTANTE: Este script é opcional e requer configuração da API do Google Translate
 * 
 * Alternativas:
 * 1. Traduzir manualmente no admin panel
 * 2. Usar este script com Google Translate API
 * 3. Importar traduções de um CSV
 */

const { Client } = require('pg');

// Configuração do banco de dados
const client = new Client({
  host: process.env.DB_HOST || 'caboose.proxy.rlwy.net',
  port: process.env.DB_PORT || 17780,
  database: process.env.DB_DATABASE || 'railway',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

/**
 * Função simples de tradução (placeholder)
 * 
 * Para usar Google Translate API:
 * 1. npm install @google-cloud/translate
 * 2. Configurar credenciais
 * 3. Descomentar código abaixo
 */
async function translateText(text, targetLang = 'en') {
  // Opção 1: Google Translate API (requer configuração)
  /*
  const {Translate} = require('@google-cloud/translate').v2;
  const translate = new Translate({
    key: process.env.GOOGLE_TRANSLATE_API_KEY
  });
  
  const [translation] = await translate.translate(text, targetLang);
  return translation;
  */
  
  // Opção 2: Tradução manual (retorna null para preencher depois)
  return null;
  
  // Opção 3: Tradução simples baseada em dicionário
  // (adicionar lógica aqui se necessário)
}

async function translateProducts() {
  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');
    
    // Buscar produtos sem tradução
    const result = await client.query(`
      SELECT id, name, description 
      FROM products 
      WHERE name_en IS NULL 
      LIMIT 100
    `);
    
    console.log(`📦 Encontrados ${result.rows.length} produtos para traduzir`);
    
    let translated = 0;
    let skipped = 0;
    
    for (const product of result.rows) {
      try {
        // Traduzir nome e descrição
        const nameEn = await translateText(product.name);
        const descriptionEn = product.description 
          ? await translateText(product.description)
          : null;
        
        if (nameEn) {
          // Atualizar no banco
          await client.query(`
            UPDATE products 
            SET name_en = $1, description_en = $2 
            WHERE id = $3
          `, [nameEn, descriptionEn, product.id]);
          
          translated++;
          console.log(`✅ Traduzido: ${product.name} → ${nameEn}`);
        } else {
          skipped++;
          console.log(`⏭️  Pulado: ${product.name} (tradução não disponível)`);
        }
        
        // Delay para não sobrecarregar API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Erro ao traduzir produto ${product.id}:`, error.message);
        skipped++;
      }
    }
    
    console.log('\n📊 Resumo:');
    console.log(`   Traduzidos: ${translated}`);
    console.log(`   Pulados: ${skipped}`);
    console.log(`   Total: ${result.rows.length}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  translateProducts();
}

module.exports = { translateProducts };
