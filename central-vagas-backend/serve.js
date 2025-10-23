
// Importa as bibliotecas
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

// Configura a aplicação Express
const app = express();
const PORT = 3000;

// Middlewares
app.use(cors()); // Permite requisições de outras origens (nosso frontend)
app.use(express.json()); // Permite que o servidor entenda JSON no corpo das requisições

// Configura a conexão com o PostgreSQL usando as variáveis do arquivo .env
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
});

// --- ROTAS DA API ---

// ROTA [GET] /api/unidades - Retorna todas as unidades
app.get('/api/unidades', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM unidades ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTA [PUT] /api/unidades/:id/reservar - Lógica da Central de Regulação
app.put('/api/unidades/:id/reservar', async (req, res) => {
  const { id } = req.params;
  const { vagasDesejadas } = req.body;

  if (!vagasDesejadas || vagasDesejadas <= 0) {
    return res.status(400).json({ message: 'Quantidade de vagas inválida.' });
  }

  try {
    // Pega os dados atuais da unidade no banco
    const unidadeResult = await pool.query('SELECT * FROM unidades WHERE id = $1', [id]);
    if (unidadeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Unidade não encontrada.' });
    }
    const unidade = unidadeResult.rows[0];

    // Validação da regra de negócio
    if(unidade.vagas_disponiveis == 0) {
        return res.status(400).json({ message: 'Sem vagas disponíveis.' })
    }
    else if (vagasDesejadas > unidade.vagas_disponiveis) {
      return res.status(400).json({ message: 'Quantidade informada excede o limite de vagas disponíveis.' });
    }

    // Cálculo
    const novasSolicitadas = unidade.vagas_solicitadas + vagasDesejadas;

    // Atualiza o banco de dados
    const updateResult = await pool.query(
      'UPDATE unidades SET vagas_solicitadas = $1 WHERE id = $2 RETURNING *',
      [novasSolicitadas, id]
    );
    
    res.json({ message: 'Reserva efetuada com sucesso.', unidade: updateResult.rows[0] });

  } catch (error) {
    console.error('Erro ao reservar vaga:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTA [PUT] /api/unidades/:id/confirmar - Lógica do Módulo das Unidades
app.put('/api/unidades/:id/confirmar', async (req, res) => {
    const { id } = req.params;
    const { vagasAConfirmar } = req.body;

    if (vagasAConfirmar === undefined || vagasAConfirmar <= 0) {
        return res.status(400).json({ message: 'Quantidade de vagas a confirmar inválida.' });
    }
    
    try {
        const unidadeResult = await pool.query('SELECT * FROM unidades WHERE id = $1', [id]);
        if (unidadeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Unidade não encontrada.' });
        }
        const unidade = unidadeResult.rows[0];

        // Validação
        if (vagasAConfirmar > unidade.vagas_solicitadas) {
            return res.status(400).json({ message: 'Quantidade informada excede a quantidade solicitada.' });
        }

        // Cálculos
        const novasSolicitadas = unidade.vagas_solicitadas - vagasAConfirmar;
        const novasUtilizadas = unidade.vagas_utilizadas + vagasAConfirmar;
        const novasDisponiveis = unidade.vagas_disponiveis - vagasAConfirmar;
        const vagasConfirmadas = unidade.vagasConfirmadas + vagasAConfirmar;

        // Atualiza o banco
        const updateResult = await pool.query(
            'UPDATE unidades SET vagas_utilizadas = $1, vagas_disponiveis = $2, vagas_solicitadas = $3, vagas_confirmadas = $4 WHERE id = $5 RETURNING *',
            [novasUtilizadas, novasDisponiveis, novasSolicitadas, vagasConfirmadas, id]
        );

        res.json({ message: 'Reserva confirmada com sucesso.', unidade: updateResult.rows[0] });
    } catch (error) {
        console.error('Erro ao confirmar reserva:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});


// Inicia o servidor
app.listen(PORT, () => {
  app.listen(3000, '0.0.0.0', () => {
  console.log('Servidor rodando em http://0.0.0.0:3000');
});
});