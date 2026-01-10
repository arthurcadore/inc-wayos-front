# Releases

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [0.3.0] - 2025-12-31

### Status
**BETA** - Versão inicial em desenvolvimento

### Adicionado
- Detalhes por Escolas
- Informações de IP dos dispositivos da Inc (Switches e Access Points)
- Página de Dispositivos Conectados
- Página de Detalhes dos Alarmes

### Alterações
- Removido a parametrização "enableCache", agora sempre estará ativo o uso do cache
- O cache não será mas apagado no momento da atualização da página principal (Visão Global da Rede)

### Corrigido
- Bug de duplicação do total de devices na tela "Visão Global da Rede" em "Status do dispositivo"

---

## [0.2.0] - 2025-12-27

### Status
**BETA** - Versão inicial em desenvolvimento

### Alterações
- Alterado mecanismo de loading (modias Último Momento Offline - Roteador, Switches e APs) para uma tipo discreto sem bloquear a página.

---

## [0.1.0] - 2025-12-26

### Status
**BETA** - Versão inicial em desenvolvimento

### Adicionado
- Dashboard inicial do projeto Aprender Conectado
- Autenticação de usuários
- Listagem de escolas
- Visualização de detalhes de escolas
- Listagem de dispositivos conectados
- Listagem de dispositivos offline
- Componente de último momento offline (Inccloud e WayOS)
- Sistema de layout com menu lateral, topbar e footer
- Integração com API backend
- Exportação de dados para arquivos
- Cache de dados com TTL configurável
- Suporte a múltiplos ambientes (development, homologation, production)
- Exibição da versão da aplicação no footer
- Página para apresentar as CHANGELOG (Acessível pelo link no rodapé "versão: X.X.X")

### Alterações
- Alterado mecanismo de loading (página Visão Global da Rede) para uma tipo discreto sem bloquear a página.

### Tecnologias
- Angular 18+
- PrimeNG
- TypeScript
- TailwindCSS
- Sass

---

## Como atualizar este arquivo

Para cada nova versão, adicione uma nova seção acima com:

- **Versão e data**: `## [X.Y.Z] - YYYY-MM-DD`
- **Status**: Beta, RC (Release Candidate), Stable, etc.
- **Categorias**:
  - `Adicionado` - novos recursos
  - `Modificado` - mudanças em funcionalidades existentes
  - `Descontinuado` - recursos que serão removidos
  - `Removido` - recursos removidos
  - `Corrigido` - correções de bugs
  - `Segurança` - correções de vulnerabilidades
