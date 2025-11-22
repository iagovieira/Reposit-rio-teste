// Invoice OCR Processing
(function() {
  'use strict';

  let currentImage = null;
  let ocrText = '';

  // Elements
  const uploadBox = document.getElementById('uploadBox');
  const invoiceFile = document.getElementById('invoiceFile');
  const previewSection = document.getElementById('previewSection');
  const previewImage = document.getElementById('previewImage');
  const processBtn = document.getElementById('processBtn');
  const loadingSection = document.getElementById('loadingSection');
  const formSection = document.getElementById('formSection');
  const successSection = document.getElementById('successSection');
  const errorSection = document.getElementById('errorSection');
  const errorMessage = document.getElementById('errorMessage');
  const invoiceForm = document.getElementById('invoiceForm');
  const cancelBtn = document.getElementById('cancelBtn');
  const newInvoiceBtn = document.getElementById('newInvoiceBtn');
  const retryBtn = document.getElementById('retryBtn');

  // Form inputs
  const valorInput = document.getElementById('valor');
  const dataInput = document.getElementById('data');
  const estabelecimentoInput = document.getElementById('estabelecimento');
  const tituloInput = document.getElementById('titulo');
  const descricaoInput = document.getElementById('descricao');

  // Initialize
  init();

  function init() {
    // File input change
    invoiceFile.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadBox.addEventListener('dragover', handleDragOver);
    uploadBox.addEventListener('drop', handleDrop);

    // Process button
    processBtn.addEventListener('click', processInvoice);

    // Form submission
    invoiceForm.addEventListener('submit', handleSubmit);

    // Cancel/Reset buttons
    cancelBtn.addEventListener('click', resetForm);
    newInvoiceBtn.addEventListener('click', resetForm);
    retryBtn.addEventListener('click', resetForm);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadBox.classList.add('drag-over');
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadBox.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  }

  function handleFile(file) {
    // Validate file type
    if (!file.type.match('image.*')) {
      showError('Por favor, selecione uma imagem válida.');
      return;
    }

    // Read and display image
    const reader = new FileReader();
    reader.onload = function(e) {
      currentImage = e.target.result;
      previewImage.src = currentImage;

      // Show preview section
      uploadBox.style.display = 'none';
      previewSection.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  async function processInvoice() {
    if (!currentImage) {
      showError('Nenhuma imagem selecionada.');
      return;
    }

    try {
      // Show loading
      previewSection.style.display = 'none';
      loadingSection.style.display = 'block';

      // Perform OCR
      const { data: { text } } = await Tesseract.recognize(
        currentImage,
        'por',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`Progresso: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      ocrText = text;
      console.log('Texto reconhecido:', text);

      // Extract information
      const invoiceData = extractInvoiceData(text);

      // Populate form
      valorInput.value = invoiceData.valor || '';
      dataInput.value = invoiceData.data || '';
      estabelecimentoInput.value = invoiceData.estabelecimento || '';

      // Show form
      loadingSection.style.display = 'none';
      formSection.style.display = 'block';

    } catch (error) {
      console.error('Erro ao processar nota fiscal:', error);
      showError('Erro ao processar a imagem. Por favor, tente novamente ou insira os dados manualmente.');

      // Show form anyway with empty fields
      loadingSection.style.display = 'none';
      formSection.style.display = 'block';
    }
  }

  function extractInvoiceData(text) {
    const data = {
      valor: '',
      data: '',
      estabelecimento: ''
    };

    // Clean text
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    // Extract valor (value) - look for patterns like R$ 123,45 or 123,45
    const valorPatterns = [
      /(?:R\$|RS)\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /total[:\s]*(?:R\$|RS)?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /valor[:\s]*(?:R\$|RS)?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /(\d{1,3}(?:\.\d{3})*,\d{2})/
    ];

    for (const pattern of valorPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        data.valor = 'R$ ' + match[1];
        break;
      }
    }

    // Extract data (date) - look for patterns like DD/MM/YYYY or DD-MM-YYYY
    const datePatterns = [
      /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/,
      /(\d{2})[\/\-](\d{2})[\/\-](\d{2})/
    ];

    for (const pattern of datePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        let day = match[1];
        let month = match[2];
        let year = match[3];

        // Convert 2-digit year to 4-digit
        if (year.length === 2) {
          year = '20' + year;
        }

        // Validate date
        if (parseInt(day) <= 31 && parseInt(month) <= 12) {
          data.data = `${year}-${month}-${day}`;
          break;
        }
      }
    }

    // Extract estabelecimento (establishment) - usually in the first few lines
    // Look for company name patterns or use first substantial line
    const possibleNames = lines.filter(line => {
      return line.length > 3 &&
             line.length < 100 &&
             !line.match(/^\d+$/) &&
             !line.match(/^[R\$\d\s\.,]+$/) &&
             !line.match(/^(CNPJ|CPF|DATA|VALOR|TOTAL)/i);
    });

    if (possibleNames.length > 0) {
      // Take the first or second line as establishment name
      data.estabelecimento = possibleNames[0];

      // If first line is too short, try combining with second
      if (data.estabelecimento.length < 10 && possibleNames.length > 1) {
        data.estabelecimento = possibleNames[0] + ' ' + possibleNames[1];
      }
    }

    return data;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const formData = {
      valor: valorInput.value,
      data: dataInput.value,
      estabelecimento: estabelecimentoInput.value,
      titulo: tituloInput.value,
      descricao: descricaoInput.value,
      ocrText: ocrText,
      image: currentImage
    };

    try {
      // Show loading
      formSection.style.display = 'none';
      loadingSection.style.display = 'block';

      // Send to Netlify Function
      const response = await fetch('/.netlify/functions/send-invoice-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar email');
      }

      // Show success
      loadingSection.style.display = 'none';
      successSection.style.display = 'block';

    } catch (error) {
      console.error('Erro ao enviar:', error);
      showError('Erro ao enviar o email. Por favor, tente novamente.');
      loadingSection.style.display = 'none';
      formSection.style.display = 'block';
    }
  }

  function showError(message) {
    errorMessage.textContent = message;
    previewSection.style.display = 'none';
    loadingSection.style.display = 'none';
    formSection.style.display = 'none';
    successSection.style.display = 'none';
    errorSection.style.display = 'block';
  }

  function resetForm() {
    currentImage = null;
    ocrText = '';
    invoiceFile.value = '';
    invoiceForm.reset();

    // Reset display
    uploadBox.style.display = 'block';
    previewSection.style.display = 'none';
    loadingSection.style.display = 'none';
    formSection.style.display = 'none';
    successSection.style.display = 'none';
    errorSection.style.display = 'none';
  }

})();
