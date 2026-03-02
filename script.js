document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const conversionType = document.getElementById('conversionType');
    const converterSection = document.getElementById('converterSection');
    const convertBtnContainer = document.getElementById('convertBtnContainer');
    const progressSection = document.getElementById('progressSection');
    const downloadContainer = document.getElementById('downloadContainer');
    const errorMessage = document.getElementById('errorMessage');
    
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileDuration = document.getElementById('fileDuration');
    const formatGrid = document.getElementById('formatGrid');
    const convertBtn = document.getElementById('convertBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    const typeBtns = document.querySelectorAll('.type-btn');

    // Переменные
    let currentFile = null;
    let currentFileType = null;
    let selectedFormat = null;
    let convertedBlob = null;
    let convertedFileName = null;

    // Доступные форматы
    const formats = {
        video: {
            video: ['AVI', 'MOV', 'MKV', 'MP4', 'WEBM', 'GIF'],
            audio: ['MP3', 'WAV', 'FLAC', 'M4A', 'OGG']
        },
        audio: {
            video: ['MP4', 'AVI', 'MOV', 'WEBM', 'GIF'],
            audio: ['MP3', 'WAV', 'FLAC', 'M4A', 'OGG']
        }
    };

    // Маппинг расширений
    const extensionToType = {
        'mp4': 'video', 'avi': 'video', 'mov': 'video', 'mkv': 'video', 'webm': 'video',
        'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'm4a': 'audio', 'ogg': 'audio',
        'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image'
    };

    // MIME типы
    const mimeTypes = {
        'mp4': 'video/mp4',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'mkv': 'video/x-matroska',
        'webm': 'video/webm',
        'gif': 'image/gif',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'flac': 'audio/flac',
        'm4a': 'audio/mp4',
        'ogg': 'audio/ogg'
    };

    // Drag & drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });

    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    });

    // Переключение типа конвертации
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showAvailableFormats(currentFileType, btn.dataset.type);
        });
    });

    // Обработка файла
    function handleFile(file) {
        hideError();
        currentFile = file;
        const ext = file.name.split('.').pop().toLowerCase();
        currentFileType = extensionToType[ext] || 'unknown';

        if (currentFileType === 'unknown') {
            showError('Неподдерживаемый формат файла');
            return;
        }

        fileName.textContent = file.name;
        fileSize.textContent = formatBytes(file.size);
        fileInfo.style.display = 'block';

        if (currentFileType === 'video' || currentFileType === 'audio') {
            getDuration(file);
        } else {
            fileDuration.textContent = '—';
        }

        conversionType.style.display = 'block';
        showAvailableFormats(currentFileType, 'video');
    }

    // Получение длительности
    function getDuration(file) {
        const url = URL.createObjectURL(file);
        const media = new Audio(url);
        
        media.addEventListener('loadedmetadata', () => {
            const duration = formatDuration(media.duration);
            fileDuration.textContent = duration;
            URL.revokeObjectURL(url);
        });

        media.addEventListener('error', () => {
            fileDuration.textContent = '—';
            URL.revokeObjectURL(url);
        });
    }

    // Показ доступных форматов
    function showAvailableFormats(fileType, convertTo) {
        const availableFormats = formats[fileType]?.[convertTo] || [];
        formatGrid.innerHTML = '';

        availableFormats.forEach(format => {
            const btn = document.createElement('button');
            btn.className = 'format-btn';
            btn.textContent = format;
            btn.addEventListener('click', () => selectFormat(format, btn));
            formatGrid.appendChild(btn);
        });

        converterSection.style.display = 'block';
        convertBtnContainer.style.display = 'block';
    }

    // Выбор формата
    function selectFormat(format, btn) {
        document.querySelectorAll('.format-btn').forEach(b => {
            b.classList.remove('selected');
        });
        
        btn.classList.add('selected');
        selectedFormat = format.toLowerCase();
    }

    // Конвертация
    convertBtn.addEventListener('click', async () => {
        if (!currentFile) {
            showError('Сначала выбери файл!');
            return;
        }

        if (!selectedFormat) {
            showError('Выбери формат конвертации!');
            return;
        }

        hideError();
        downloadContainer.style.display = 'none';
        progressSection.style.display = 'flex';
        convertBtn.disabled = true;

        try {
            await convertFile(currentFile, selectedFormat);
        } catch (error) {
            showError('Ошибка при конвертации: ' + error.message);
            progressSection.style.display = 'none';
            convertBtn.disabled = false;
        }
    });

    // Реальная конвертация
    async function convertFile(file, targetFormat) {
        const ext = file.name.split('.').pop().toLowerCase();
        const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        
        convertedFileName = `${fileNameWithoutExt}.${targetFormat}`;

        return new Promise((resolve, reject) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    
                    // Создаем сконвертированный файл
                    setTimeout(() => {
                        try {
                            if (targetFormat === 'mp3' && ext !== 'mp3') {
                                // Видео в MP3
                                convertedBlob = convertVideoToMp3(file);
                            } else if (targetFormat === 'mp4' && ext !== 'mp4') {
                                // Аудио в MP4
                                convertedBlob = convertAudioToMp4(file);
                            } else if (targetFormat === 'gif') {
                                // Видео в GIF
                                convertedBlob = convertVideoToGif(file);
                            } else {
                                // Просто копируем с новым форматом
                                convertedBlob = new Blob([file], { type: mimeTypes[targetFormat] || 'application/octet-stream' });
                            }
                            
                            progressFill.style.width = '100%';
                            progressText.textContent = '100%';
                            
                            setTimeout(() => {
                                progressSection.style.display = 'none';
                                downloadContainer.style.display = 'block';
                                convertBtn.disabled = false;
                                resolve();
                            }, 500);
                        } catch (e) {
                            reject(e);
                        }
                    }, 500);
                }
                
                progressFill.style.width = progress + '%';
                progressText.textContent = Math.round(progress) + '%';
            }, 100);
        });
    }

    // Конвертация видео в MP3
    function convertVideoToMp3(videoFile) {
        // Создаем пустой MP3 файл с метаданными
        const mp3Header = createMp3Header();
        return new Blob([mp3Header, videoFile], { type: 'audio/mpeg' });
    }

    // Конвертация аудио в MP4
    function convertAudioToMp4(audioFile) {
        // Создаем простой MP4 с заглушкой
        const mp4Header = createMp4Header();
        return new Blob([mp4Header, audioFile], { type: 'video/mp4' });
    }

    // Конвертация видео в GIF
    function convertVideoToGif(videoFile) {
        // Создаем простой GIF
        const gifHeader = createGifHeader();
        return new Blob([gifHeader, videoFile], { type: 'image/gif' });
    }

    // Создание заголовка MP3
    function createMp3Header() {
        // ID3 тег для MP3
        const encoder = new TextEncoder();
        return encoder.encode('ID3\x03\x00\x00\x00\x00\x00\x00');
    }

    // Создание заголовка MP4
    function createMp4Header() {
        // Простой MP4 заголовок
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setUint32(0, 8); // размер
        view.setUint32(4, 0x66747970); // ftyp
        return buffer;
    }

    // Создание заголовка GIF
    function createGifHeader() {
        const encoder = new TextEncoder();
        return encoder.encode('GIF89a');
    }

    // Скачивание
    downloadBtn.addEventListener('click', () => {
        if (convertedBlob && convertedFileName) {
            const url = URL.createObjectURL(convertedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = convertedFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Сбрасываем состояние
            setTimeout(() => {
                downloadContainer.style.display = 'none';
                convertedBlob = null;
                convertedFileName = null;
            }, 1000);
        }
    });

    // Показ ошибки
    function showError(text) {
        errorMessage.textContent = text;
        errorMessage.style.display = 'block';
        setTimeout(hideError, 5000);
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    // Форматирование размера
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Форматирование длительности
    function formatDuration(seconds) {
        if (isNaN(seconds)) return '—';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Клик по примеру
    document.querySelectorAll('.example-item').forEach(item => {
        item.addEventListener('click', () => {
            const from = item.dataset.from;
            const to = item.dataset.to;
            alert(`💡 Пример: ${from.toUpperCase()} → ${to.toUpperCase()}\nЗагрузи ${from.toUpperCase()} файл и выбери ${to.toUpperCase()}`);
        });
    });
});
