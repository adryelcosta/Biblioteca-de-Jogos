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
    carregarJogosDestaque(); // Carrega os jogos estáticos na tela inicial
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

// Mecanismo de Busca com técnica Debounce
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    // Se o usuário limpar o campo, os jogos em destaque voltam de forma estática
    if (!query) { carregarJogosDestaque(); return; }
    debounceTimer = setTimeout(() => fetchGames(query), 500);
});

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();
    if (!query) { carregarJogosDestaque(); return; }
    fetchGames(query);
});

// Requisição Assíncrona Primária: Busca listagem geral de jogos
async function fetchGames(query) {
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

// Requisição Assíncrona Secundária: Traz dados detalhados (Sinopse Completa)
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
        // CORRIGIDO: Corrigido de group.chave para grupo.chave para que o filtro funcione instantaneamente
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

// 3. DELETE: Abre o modal de exclusão
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

// 4. UPDATE: Manipula os modais para exibição de dados e edição de status
window.openEditModal = (id) => {
    const game = myLibrary.find(g => g.id === id);
    if (!game) return;
    editIdInput.value = game.id;
    editTitleInput.value = game.title;
    editStatusSelect.value = game.status;
    editSynopsisInput.value = game.synopsis;
    editModal.classList.remove('hidden');
};

// Salva estritamente o Status alterado pelo usuário (titulo e sinopse são readonly)
editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const gameIndex = myLibrary.findIndex(g => g.id === editIdInput.value);
    if (gameIndex !== -1) {
        myLibrary[gameIndex].status = editStatusSelect.value;
        editModal.classList.add('hidden');
        saveAndRefresh();
        showToast('Status do jogo atualizado com sucesso!');
    }
});

// --- SEÇÃO 3: JOGOS ESTÁTICOS EM DESTAQUE (IMAGENS HOSPEDADAS PERMANENTES) ---
function carregarJogosDestaque() {
    const jogosDestaque = [
        { 
            id: 3498, 
            name: "Grand Theft Auto V", 
            released: "2013-09-17", 
            platforms: "PC, PlayStation, Xbox", 
            background_image: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=500&auto=format&fit=crop&q=60" 
        },
        { 
            id: 3328, 
            name: "The Witcher 3: Wild Hunt", 
            released: "2015-05-18", 
            platforms: "PC, PlayStation, Xbox, Nintendo Switch", 
            background_image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=60" 
        },
        { 
            id: 4200, 
            name: "Portal 2", 
            released: "2011-04-18", 
            platforms: "PC, PlayStation, Xbox, Nintendo Switch", 
            background_image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=60" 
        },
        { 
            id: 5286, 
            name: "Tomb Raider (2013)", 
            released: "2013-03-05", 
            platforms: "PC, PlayStation, Xbox", 
            background_image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500&auto=format&fit=crop&q=60" 
        }
    ];

    messageArea.innerHTML = '<h2 style="grid-column: 1/-1; color: #6c5ce7; margin-bottom: 1rem; font-size: 1.3rem; border-left: 4px solid #6c5ce7; padding-left: 8px; text-align: left;">🔥 Sugestões em Destaque</h2>';
    gamesContainer.innerHTML = '';

    jogosDestaque.forEach(game => {
        const card = document.createElement('article');
        card.className = 'game-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div onclick="window.verDetalhesJogo(${game.id})" style="flex-grow: 1; display: flex; flex-direction: column;">
                <img class="game-thumb" src="${game.background_image}" alt="${game.name}">
                <div class="game-info">
                    <h3>${game.name}</h3>
                    <p><strong>Lançamento:</strong> ${game.released}</p>
                    <p><strong>Plataformas:</strong> ${game.platforms}</p>
                </div>
            </div>
            <div style="padding: 0 1rem 1rem 1rem;">
                <button class="btn-add" onclick="event.stopPropagation(); window.addGameToLibrary('${game.name.replace(/'/g, "\\'")}', '${game.background_image}', '${game.platforms}', ${game.id})">➕ Adicionar</button>
            </div>
        `;
        gamesContainer.appendChild(card);
    });
}

// --- FUNÇÕES AUXILIARES ---
function saveAndRefresh() {
    localStorage.setItem('myLibrary', JSON.stringify(myLibrary));
    renderLibrary();
    updateBadgeCount();
}

function updateBadgeCount() {
    libraryCount.textContent = myLibrary.length;
}