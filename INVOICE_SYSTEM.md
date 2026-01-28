# Sistema de Reconhecimento de Nota Fiscal

Sistema automatizado para upload, reconhecimento OCR e envio por email de notas fiscais.

## Funcionalidades

- **Upload de Imagem**: Suporte para drag & drop e seleção de arquivos
- **Reconhecimento OCR**: Extração automática de:
  - Valor da nota fiscal
  - Data de emissão
  - Nome do estabelecimento
- **Formulário Editável**: Permite correção manual e adição de:
  - Título personalizado
  - Descrição detalhada
- **Envio Automático**: Email formatado enviado para `financeiro@erural.net`

## Como Usar

1. Acesse a página: `/nota-fiscal/`
2. Faça upload de uma foto da nota fiscal (arraste ou clique)
3. Clique em "Processar Nota Fiscal" para iniciar o OCR
4. Revise e edite os dados reconhecidos
5. Adicione título e descrição (opcional)
6. Clique em "Enviar para Financeiro"

## Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure as credenciais SMTP:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-aplicativo
SMTP_FROM=seu-email@gmail.com
```

### 3. Configurar Gmail (Recomendado)

Para usar Gmail como servidor SMTP:

1. Ative a autenticação de dois fatores na sua conta Google
2. Acesse [App Passwords](https://myaccount.google.com/apppasswords)
3. Gere uma nova senha de aplicativo
4. Use essa senha no campo `SMTP_PASS` do arquivo `.env`

### 4. Configurar no Netlify

No dashboard do Netlify, adicione as variáveis de ambiente:

1. Acesse `Site settings` > `Environment variables`
2. Adicione cada variável:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`

## Tecnologias Utilizadas

### Frontend
- **Tesseract.js**: OCR (Optical Character Recognition) para reconhecimento de texto em imagens
- **Vanilla JavaScript**: Processamento e validação no cliente
- **HTML5 File API**: Upload e preview de imagens

### Backend
- **Netlify Functions**: Serverless functions para envio de email
- **Nodemailer**: Biblioteca Node.js para envio de emails via SMTP

## Estrutura de Arquivos

```
/home/user/Reposit-rio-teste/
├── src/
│   ├── nota-fiscal.njk                    # Página HTML do formulário
│   ├── static/
│   │   └── scripts/
│   │       └── invoice-ocr.js             # Lógica OCR e processamento
│   └── includes/
│       └── style/
│           └── invoice.css                # Estilos da página
├── netlify/
│   └── functions/
│       └── send-invoice-email.js          # Função de envio de email
└── .env                                    # Configurações (não versionado)
```

## Formato do Email

O email enviado contém:

- **Cabeçalho**: "Nova Nota Fiscal Recebida"
- **Dados Principais**:
  - Estabelecimento
  - Valor
  - Data
  - Título (se fornecido)
  - Descrição (se fornecida)
- **Imagem**: Preview da nota fiscal
- **Texto OCR**: Texto completo reconhecido para referência
- **Rodapé**: Data/hora de envio

## Resolução de Problemas

### OCR não está reconhecendo bem o texto

- Certifique-se de que a imagem está bem iluminada
- Evite fotos com sombras ou reflexos
- Tire a foto diretamente de frente (sem ângulos)
- Use resolução mínima de 1000x1000 pixels

### Email não está sendo enviado

1. Verifique as credenciais SMTP no `.env` ou Netlify
2. Confirme que as variáveis estão corretas no dashboard do Netlify
3. Para Gmail, verifique se está usando uma "Senha de Aplicativo"
4. Verifique os logs da função no Netlify: `Functions` > `send-invoice-email`

### Erro "Method Not Allowed"

A função só aceita requisições POST. Verifique se o frontend está fazendo a requisição correta.

### Campos obrigatórios faltando

Os campos `valor`, `data` e `estabelecimento` são obrigatórios. Se o OCR não reconhecer, preencha manualmente.

## Melhorias Futuras

- [ ] Suporte para múltiplos uploads simultâneos
- [ ] Histórico de notas enviadas
- [ ] Integração com sistemas de contabilidade
- [ ] Reconhecimento de CNPJ/CPF
- [ ] Categorização automática de despesas
- [ ] Exportação em PDF
- [ ] Validação de valores com banco de dados

## Suporte

Para problemas ou dúvidas, entre em contato com a equipe de desenvolvimento.
