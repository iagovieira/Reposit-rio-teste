const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { valor, data: dataNotaFiscal, estabelecimento, titulo, descricao, ocrText, image } = data;

    // Validate required fields
    if (!valor || !dataNotaFiscal || !estabelecimento) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Campos obrigatórios faltando' })
      };
    }

    // Create transporter
    // For production, use environment variables for email credentials
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Format date for display
    const dateObj = new Date(dataNotaFiscal);
    const formattedDate = dateObj.toLocaleDateString('pt-BR');

    // Create email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 0 0 5px 5px;
          }
          .field {
            margin-bottom: 15px;
            padding: 10px;
            background-color: white;
            border-left: 4px solid #4CAF50;
          }
          .field-label {
            font-weight: bold;
            color: #4CAF50;
            margin-bottom: 5px;
          }
          .field-value {
            color: #333;
          }
          .image-container {
            margin-top: 20px;
            text-align: center;
          }
          .image-container img {
            max-width: 100%;
            height: auto;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nova Nota Fiscal Recebida</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">Estabelecimento:</div>
              <div class="field-value">${estabelecimento}</div>
            </div>

            <div class="field">
              <div class="field-label">Valor:</div>
              <div class="field-value">${valor}</div>
            </div>

            <div class="field">
              <div class="field-label">Data:</div>
              <div class="field-value">${formattedDate}</div>
            </div>

            ${titulo ? `
            <div class="field">
              <div class="field-label">Título:</div>
              <div class="field-value">${titulo}</div>
            </div>
            ` : ''}

            ${descricao ? `
            <div class="field">
              <div class="field-label">Descrição:</div>
              <div class="field-value">${descricao}</div>
            </div>
            ` : ''}

            ${image ? `
            <div class="image-container">
              <p style="font-weight: bold; margin-bottom: 10px;">Imagem da Nota Fiscal:</p>
              <img src="${image}" alt="Nota Fiscal">
            </div>
            ` : ''}

            ${ocrText ? `
            <div class="field" style="margin-top: 20px;">
              <div class="field-label">Texto Reconhecido (OCR):</div>
              <div class="field-value" style="white-space: pre-wrap; font-family: monospace; font-size: 11px;">${ocrText}</div>
            </div>
            ` : ''}

            <div class="footer">
              <p>Este email foi gerado automaticamente pelo sistema de reconhecimento de notas fiscais.</p>
              <p>Data de envio: ${new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Email options
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: 'financeiro@erural.net',
      subject: `Nova Nota Fiscal - ${estabelecimento} - ${valor}`,
      html: emailHtml,
      replyTo: process.env.SMTP_FROM || process.env.SMTP_USER
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Email enviado com sucesso'
      })
    };

  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Erro ao enviar email',
        details: error.message
      })
    };
  }
};
