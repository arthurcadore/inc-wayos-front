# Releases

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [0.5.2] - 2026-02-15

### Adicionado
- Foi adicionado a coluna "Template" no arquivo de exportação
- Botão voltar nas página - 'Dispositivos Offline', 'Detalhes por Escola', 'Topologia de Rede', 'Detalhes dos Alarmes' e 'Dispositivos Conectados'
- Preserva o estado dos filtros da página de Dashboard
- Nós da página da topologia agora apresentam status Online/offline

### Corrigido
- Informação do 'Último Momento Offline' da Router obitida de uma única finta de dados (/open-api/v1/device/list)
- 'Último Momento Offline' da página de 'Detalhes da Escola" apresenta apenas em único local
- Layout da coluna 'Access Point' da tabela do Dashboar, ajustada.

---

## [0.5.1] - 2026-02-10

### Corrigido
- Atualização Discreta (Sempre será apresentado INEPs se eles existirem no cache)
- Tela de Alarmes (Agora apresenta hora exata do alarme criado)

---

## [0.5.0] - 2026-01-18

### Adicionado
- Informação de entregas físicas na API de visão global (princial)
- Linha de Vida no Dashboard
- Linha de Vida (espefício de um INEP) na tela Detalhes por Escola
- Configurações da aplicação de template na tela Detalhes por Escola
- Número do SimetBox na tela Detalhes por Escola

---

## [0.4.0] - 2026-01-18

### Status
**BETA** - Versão inicial em desenvolvimento

### Adicionado
- Módulo de topologia de rede
- Último Momento Offline nos dispositivos (router, switch e ap)

### Corrigido
- Alarmes dos dispositivos inc (estava buscando por shopId e deveri ser por serial number)
- Endereço MAC de dispositivos INC na tela de alertas

---

## [0.3.1] - 2025-12-31

### Status
**BETA** - Versão inicial em desenvolvimento

### Corrigido
- Agora são apresentados apenas alarmes do tipo "dev_offline" e não mais "dev_online"
- Textos corrigidos na página "Detalhes dos Alarmes"
- Exportação de arquivo ajustado (marcado comentário editado) na página "Detalhes dos Alarmes"
- Textos corrigidos na página "Dispositivos Conectados"
- Ajustes na página "Dispositivos Conectados"

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
