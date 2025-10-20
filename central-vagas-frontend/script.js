// URL base da nossa API backend
const API_URL = 'http://localhost:3000/api';

// Armazena todos os dados das unidades carregados da API
let allData = [];

// Função que é chamada assim que a página carrega
document.addEventListener('DOMContentLoaded', () => {
    carregarDadosAPI();
});

// Carrega os dados iniciais da API
async function carregarDadosAPI() {
    showMessage('Carregando dados...', 'loading');
    try {
        const response = await fetch(`${API_URL}/unidades`);
        if (!response.ok) {
            throw new Error(`Erro na rede: ${response.statusText}`);
        }
        allData = await response.json();
        popularUnidades();
        selecionarUnidade(); // Preenche os campos com a primeira unidade
        hideMessage();

        document.getElementById('content').classList.remove('hidden');

    } catch (err) {
        showMessage(`Erro ao carregar dados: ${err.message}. Verifique se o backend está rodando.`, 'error');
        console.error(err);
    }
}

function popularUnidades() {
  const select = document.getElementById('unidades');
  const valorSelecionado = select.value; // salva o valor atual

  select.innerHTML = '<option value="">-- Selecione uma unidade --</option>';
  allData.forEach((unidade) => {
    const option = document.createElement('option');
    option.value = unidade.id;
    option.textContent = unidade.nome;
    select.appendChild(option);
  });

  // restaura o valor selecionado, se ainda existir
  if (valorSelecionado) {
    select.value = valorSelecionado;
  }
}

function selecionarUnidade() {
    const selectedId = document.getElementById('unidades').value;
    // Limpa todos os campos se nenhuma unidade for selecionada
    const fields = ['capacidade', 'utilizadas', 'disponiveis', 'solicitadas', 'confirmadas', 'reservar', 'confirmar'];
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) element.value = '';
    });

    if (selectedId === "") return;

    // Encontra a unidade selecionada nos dados já carregados
    const unidadeData = allData.find(u => u.id == selectedId);
    if (!unidadeData) return;

    // Preenche os campos com os dados da unidade
    document.getElementById('capacidade').value = unidadeData.capacidade_vagas;
    document.getElementById('utilizadas').value = unidadeData.vagas_utilizadas;
    document.getElementById('disponiveis').value = unidadeData.vagas_disponiveis;
    document.getElementById('solicitadas').value = unidadeData.vagas_solicitadas;

    // Módulo Central
    if (document.getElementById('confirmadas')) {
        document.getElementById('confirmadas').value = unidadeData.vagas_confirmadas;
    }
    // Módulo Unidades (pré-preenche o campo 'confirmar' com o valor de solicitadas)
    if (document.getElementById('confirmar')) {
        document.getElementById('confirmar').value = unidadeData.vagas_solicitadas;
    }
}

// --- Funções Específicas dos Módulos ---

// MÓDULO CENTRAL
async function efetuarReserva() {
    const selectedId = document.getElementById('unidades').value;
    if (selectedId === "") {
        return showMessage("Por favor, selecione uma unidade.", "error");
    }

    const vagasDesejadas = parseInt(document.getElementById('reservar').value) || 0;
    // const vagasDesejadas = parseInt(document.getElementById('reservar').value) || 0;
    if (vagasDesejadas <= 0) {
        return showMessage("Por favor, informe um número de vagas válido.", "error");
    }

    try {
        const response = await fetch(`${API_URL}/unidades/${selectedId}/reservar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ vagasDesejadas: vagasDesejadas }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Erro do servidor');
        }

        showMessage(result.message, "success");
        carregarDadosAPI(); // Recarrega os dados para refletir a mudança
    } catch (err) {
        showMessage(err.message, "error");
        console.error(err);
    }
}

// MÓDULO UNIDADES
async function confirmarReserva() {
    const selectedId = document.getElementById('unidades').value;
    if (selectedId === "") {
        return showMessage("Por favor, selecione uma unidade.", "error");
    }

    const vagasAConfirmar = parseInt(document.getElementById('confirmar').value);
    if (isNaN(vagasAConfirmar) || vagasAConfirmar < 0) {
        return showMessage("Por favor, informe um número de vagas válido.", "error");
    }

    try {
        const response = await fetch(`${API_URL}/unidades/${selectedId}/confirmar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vagasAConfirmar: vagasAConfirmar }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Erro do servidor');
        }

        showMessage(result.message, "success");
        carregarDadosAPI(); // Recarrega os dados atualizados
    } catch (err) {
        showMessage(err.message, "error");
        console.error(err);
    }
}

// --- Funções Utilitárias ---
function showMessage(msg, type) {
    const container = document.getElementById('message-container');
    container.innerHTML = `<div class="message ${type}">${msg}</div>`;
}
function hideMessage() {
    const container = document.getElementById('message-container');
    container.innerHTML = '';
}
