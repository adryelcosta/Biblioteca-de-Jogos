# 🎮 GameVerse - Biblioteca de Jogos

O **GameVerse** é uma aplicação web interativa e responsiva desenvolvida para amantes de videogames que desejam organizar e gerenciar sua coleção pessoal de jogos. A aplicação consome dados em tempo real da API pública **RAWG** e gerencia o inventário local do usuário através de um ciclo completo de **CRUD** persistido no navegador.

---

## 🚀 Funcionalidades Principais

*   **Busca em Tempo Real (Consumo de API):** Integração com a API RAWG para buscar títulos de jogos, datas de lançamento e plataformas disponíveis.
*   **Mecanismo de Debounce:** Otimização de performance no campo de busca que aguarda o usuário pausar a digitação (500ms) para disparar a requisição, evitando sobrecarga de chamadas assíncronas.
*   **Janela de Detalhes Dinâmica:** Ao clicar em um card de resultado, o sistema faz uma segunda chamada assíncronas para puxar e exibir a sinopse oficial e completa do jogo antes de adicioná-lo.
*   **Gerenciamento de Coleção (CRUD Completo):**
    *   **Create:** Adiciona jogos à biblioteca com status inicial "Quero Jogar".
    *   **Read:** Lista os jogos salvos, agrupando-os dinamicamente por categorias visuais na gaveta lateral.
    *   **Update:** Permite editar o título, anotações/sinopse e o status do progresso do jogo.
    *   **Delete:** Remove jogos da coleção através de um modal customizado de confirmação gamer.
*   **Filtros Rápidos Reativos:** Filtre instantaneamente sua coleção entre "Todos", "🎯 Quero", "🕹️ Jogando" e "🏆 Zerado" com apenas um clique.
*   **Notificações Toast:** Avisos flutuantes personalizados para indicar sucesso nas ações ou alertar caso o usuário tente adicionar um jogo duplicado.
*   **Persistência de Dados:** Uso do `LocalStorage` para garantir que a coleção do usuário não seja perdida ao fechar ou atualizar o navegador.

---

## 🛠️ Tecnologias Utilizadas

*   **HTML5:** Estruturação semântica da aplicação e dos componentes modais.
*   **CSS3:** Estilização customizada em modo escuro (*Dark Mode*), design responsivo para dispositivos móveis e efeitos visuais *Glow* (neon) nos botões.
*   **JavaScript (ES6+):** Lógica de manipulação assíncrona do DOM, gerenciamento de estado local, controle de fluxo e consumo de API Rest (através de `fetch` e `async/await`).
*   **RAWG Video Games Database API:** Provedora do banco de dados global de jogos.

---

## 📂 Estrutura do Projeto

```text
├── index.html          # Estrutura de telas, modais e sidebar
├── style.css           # Estilização completa, layouts em Grid/Flexbox e animações
├── app.js              # Lógica do CRUD, persistência e consumo da API
└── README.md           # Documentação do projeto