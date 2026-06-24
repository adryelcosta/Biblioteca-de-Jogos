// --- CONFIGURAÇÃO E ESTADO GLOBAL ---
const API_KEY = 'b6a4d2065ce44c7c943c491bf6a5080c'; 

// Elementos do DOM: Busca e Contêineres
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const messageArea = document.getElementById('message-area');
const gamesContainer = document.getElementById('games-container');
const libraryContainer = document.getElementById('library-container');
const libraryCount = document.getElementById('library-count');

// Elementos do DOM: Modais e Sidebar
const librarySidebar = document.getElementById('library-sidebar');
const btnOpenLibrary = document.getElementById('btn-open-library');
const btnCloseSidebar = document.getElementById('btn-close-sidebar');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editIdInput = document.getElementById('edit-id');
const editTitleInput = document.getElementById('edit-title');
const editStatusSelect = document.getElementById('edit-status');
const editSynopsisInput = document.getElementById('edit-synopsis');
const btnCloseModal = document.getElementById('btn-close-modal');

// Elementos do DOM: Modais Extras (Exclusão e Detalhes)
const confirmModal = document.getElementById('confirm-modal');
const btnConfirmYes = document.getElementById('btn-confirm-yes');
const btnConfirmNo = document.getElementById('btn-confirm-no');
const detailsModal = document.getElementById('details-modal');
const detailsContent = document.getElementById('details-content');
const btnCloseDetails = document.getElementById('btn-close-details');

// Inicialização das variáveis de controle
let debounceTimer;
let idToExclude = null; 
let statusFiltroAtual = 'Todos';

// Criação dinâmica do contêiner de Toasts (Notificações Gamer)
const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

// Carrega os dados salvos no navegador ou inicia um array vazio
let myLibrary = JSON.parse(localStorage.getItem('myLibrary')) || [];

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    renderLibrary();
    updateBadgeCount();
});

// Ouvintes de Eventos: Abrir e Fechar Interface
btnOpenLibrary.addEventListener('click', () => librarySidebar.classList.remove('hidden'));
btnCloseSidebar.addEventListener('click', () => librarySidebar.classList.add('hidden'));
btnCloseDetails.addEventListener('click', () => detailsModal.classList.add('hidden'));
btnCloseModal.addEventListener('click', () => editModal.classList.add('hidden'));

// Função para exibir notificações personalizadas em formato de Toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'warning' ? 'toast-warning' : ''}`;
    toast.innerHTML = `<span>${type === 'warning' ? '⚠️' : '🎮'}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s ease forwards';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// --- SEÇÃO 1: CONSUMO DA API (BUSCA E DETALHES) ---

// Mecanismo de Busca com técnica Debounce (evita requisições excessivas enquanto digita)
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    debounceTimer = setTimeout(() => fetchGames(query), 500);
});

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(debounceTimer);
    fetchGames(searchInput.value.trim());
});

// Requisição Assíncrona Primária: Busca listagem geral de jogos
async function fetchGames(query) {
    if (!query) { gamesContainer.innerHTML = ''; messageArea.textContent = ''; return; }
    gamesContainer.innerHTML = '';
    messageArea.textContent = 'Buscando jogos...';

    try {
        const response = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(query)}&page_size=4`);
        if (!response.ok) throw new Error('Erro na conexão com a API.');

        const data = await response.json();
        if (data.results.length === 0) throw new Error('Nenhum jogo encontrado.');

        messageArea.textContent = '';
        data.results.forEach(game => {
            const gameImage = game.background_image || 'https://via.placeholder.com/300x160?text=Sem+Imagem';
            const platforms = game.parent_platforms ? game.parent_platforms.map(p => p.platform.name).join(', ') : 'Não informado';

            const card = document.createElement('article');
            card.className = 'game-card';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <div onclick="window.verDetalhesJogo(${game.id})" style="flex-grow: 1; display: flex; flex-direction: column;">
                    <img class="game-thumb" src="${gameImage}" alt="${game.name}">
                    <div class="game-info">
                        <h3>${game.name}</h3>
                        <p><strong>Lançamento:</strong> ${game.released || 'N/A'}</p>
                        <p><strong>Plataformas:</strong> ${platforms}</p>
                    </div>
                </div>
                <div style="padding: 0 1rem 1rem 1rem;">
                    <button class="btn-add" onclick="event.stopPropagation(); window.addGameToLibrary('${game.name.replace(/'/g, "\\'")}', '${gameImage}', '${platforms}', ${game.id})">➕ Adicionar</button>
                </div>
            `;
            gamesContainer.appendChild(card);
        });
    } catch (error) {
        messageArea.textContent = error.message;
    }
}

// Requisição Assíncrona Secundária: Traz dados detalhados (Sinopse Completa) para o Modal de Informações
window.verDetalhesJogo = async (gameId) => {
    try {
        const response = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${API_KEY}`);
        if (!response.ok) throw new Error();
        const detail = await response.json();
        
        const gameImage = detail.background_image || 'https://via.placeholder.com/300x160?text=Sem+Imagem';
        const platforms = detail.parent_platforms ? detail.parent_platforms.map(p => p.platform.name).join(', ') : 'Não informado';

        detailsContent.innerHTML = `
            <img src="${gameImage}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 6px; margin-bottom: 12px;">
            <h2 style="color: #6c5ce7; margin-bottom: 8px;">${detail.name}</h2>
            <p style="font-size: 0.9rem;"><strong>Lançamento:</strong> ${detail.released || 'N/A'}</p>
            <p style="margin-bottom: 12px; font-size: 0.9rem;"><strong>Plataformas:</strong> ${platforms}</p>
            <div style="background: #1a1a1a; padding: 1rem; border-radius: 6px; max-height: 200px; overflow-y: auto;">
                <p style="font-size: 0.85rem; color: #ccc; line-height: 1.4;"><strong>Sinopse Oficial:</strong><br>${detail.description_raw || 'Sem sinopse oficial.'}</p>
            </div>
        `;
        detailsModal.classList.remove('hidden');
    } catch (err) {
        showToast('Não foi possível carregar os detalhes.', 'warning');
    }
};

// --- SEÇÃO 2: OPERAÇÕES DO CRUD (LOCALSTORAGE) ---

// 1. CREATE: Salva um novo jogo na coleção pessoal
window.addGameToLibrary = async (title, image, platforms, gameId) => {
    if (myLibrary.some(game => game.title === title)) {
        showToast('Este jogo já está na sua biblioteca!', 'warning');
        return;
    }

    let apiSynopsis = 'Sem sinopse disponível.';
    try {
        const response = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${API_KEY}`);
        if (response.ok) {
            const detail = await response.json();
            apiSynopsis = detail.description_raw ? detail.description_raw.substring(0, 150) + '...' : 'Sem sinopse.';
        }
    } catch (err) { console.log(err); }

    myLibrary.push({ id: Date.now().toString(), title, image, platforms, status: 'Quero Jogar', synopsis: apiSynopsis });
    saveAndRefresh();
    showToast(`"${title}" adicionado à sua caixa!`);
    librarySidebar.classList.remove('hidden');
};

// 2. READ: Renderiza, filtra e agrupa os cards por categoria na gaveta
function renderLibrary() {
    libraryContainer.innerHTML = '';
    if (myLibrary.length === 0) {
        libraryContainer.innerHTML = '<p class="message">Sua caixa está vazia. Adicione jogos acima!</p>';
        return;
    }

    const statusGrupos = [
        { nome: '🎯 Quero Jogar', chave: 'Quero Jogar', classe: 'status-queto' },
        { nome: '🕹️ Jogando', chave: 'Jogando', classe: 'status-jogando' },
        { nome: '🏆 Zerado', chave: 'Zerado', classe: 'status-zerado' }
    ];

    statusGrupos.forEach(grupo => {
        if (statusFiltroAtual !== 'Todos' && statusFiltroAtual !== grupo.chave) return;

        const jogosDoGrupo = myLibrary.filter(game => game.status === grupo.chave);
        if (jogosDoGrupo.length > 0) {
            const header = document.createElement('h3');
            header.style = 'margin: 1.5rem 0 0.8rem 0; color: #fff; border-bottom: 2px solid #444; padding-bottom: 5px; font-size: 1.1rem;';
            header.textContent = grupo.nome;
            libraryContainer.appendChild(header);

            jogosDoGrupo.forEach(game => {
                const card = document.createElement('article');
                card.className = 'game-card';
                card.innerHTML = `
                    <img class="game-thumb" src="${game.image}" alt="${game.title}">
                    <div class="game-info">
                        <h3>${game.title}</h3>
                        <span class="status-badge ${grupo.classe}">${game.status}</span>
                        <p><strong>Plataformas:</strong> ${game.platforms || 'Não informado'}</p>
                        <p><strong>Sinopse/Notas:</strong> ${game.synopsis}</p>
                        <div class="crud-actions">
                            <button class="btn-edit" onclick="window.openEditModal('${game.id}')">✏️ Editar</button>
                            <button class="btn-delete" onclick="window.deleteGame('${game.id}')">🗑️ Excluir</button>
                        </div>
                    </div>
                `;
                libraryContainer.appendChild(card);
            });
        }
    });

    if (libraryContainer.innerHTML === '' && statusFiltroAtual !== 'Todos') {
        libraryContainer.innerHTML = `<p class="message">Nenhum jogo com o status "${statusFiltroAtual}" encontrado.</p>`;
    }
}

// Filtros rápidos por categoria na interface
window.filtrarPorStatus = (status) => {
    statusFiltroAtual = status;
    renderLibrary();
};

// 3. DELETE: Abre o modal customizado para confirmação de exclusão
window.deleteGame = (id) => { idToExclude = id; confirmModal.classList.remove('hidden'); };

btnConfirmYes.addEventListener('click', () => {
    if (idToExclude) {
        myLibrary = myLibrary.filter(game => game.id !== idToExclude);
        saveAndRefresh();
        showToast('Jogo removido com sucesso.');
    }
    confirmModal.classList.add('hidden');
    idToExclude = null;
});

btnConfirmNo.addEventListener('click', () => { confirmModal.classList.add('hidden'); idToExclude = null; });

// 4. UPDATE: Manipula os modais para edição de dados de texto e status
window.openEditModal = (id) => {
    const game = myLibrary.find(g => g.id === id);
    if (!game) return;
    editIdInput.value = game.id;
    editTitleInput.value = game.title;
    editStatusSelect.value = game.status;
    editSynopsisInput.value = game.synopsis;
    editModal.classList.remove('hidden');
};

editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const gameIndex = myLibrary.findIndex(g => g.id === editIdInput.value);
    if (gameIndex !== -1) {
        myLibrary[gameIndex].title = editTitleInput.value;
        myLibrary[gameIndex].status = editStatusSelect.value;
        myLibrary[gameIndex].synopsis = editSynopsisInput.value.trim() || 'Sem sinopse adicionada.';
        editModal.classList.add('hidden');
        saveAndRefresh();
        showToast('Jogo atualizado com sucesso!');
    }
});

// --- FUNÇÕES AUXILIARES ---
function saveAndRefresh() {
    localStorage.setItem('myLibrary', JSON.stringify(myLibrary));
    renderLibrary();
    updateBadgeCount();
}

function updateBadgeCount() {
    libraryCount.textContent = myLibrary.length;
}