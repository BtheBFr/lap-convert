document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const converterSection = document.getElementById('converterSection');
    const convertBtnContainer = document.getElementById('convertBtnContainer');
    const progressSection = document.getElementById('progressSection');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileDuration = document.getElementById('fileDuration');
    const formatGrid = document.getElementById('formatGrid');
    const convertBtn = document.getElementById('convertBtn');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    // Переменные
    let currentFile = null;
    let currentFileType = null;
    let selectedFormat = null;

    // Доступные форматы для разных типов
    const formats = {
        video: ['AVI', 'MOV', 'MKV', 'MP4', 'WEBM', 'GIF'],
        audio: ['MP3', 'WAV', 'FLAC', 'M4A', 'OGG', 'MP4'],
        image: ['MP4', 'GIF']
    };

    // Маппинг расширений
    const extensionToType = {
        'mp4': 'video',
        'avi': 'video',
        'mov': 'video',
        'mkv': 'video',
        'webm': 'video',
        'mp3': 'audio',
        'wav': 'audio',
        'flac': 'audio',
        'm4a': 'audio',
        'ogg': 'audio',
        'jpg': 'image',
        'jpeg': 'image',
        'png': 'image',
        'gif': 'image'
    };

    // Обработчики drag & drop
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

    // Клик по примеру
    document.querySelectorAll('.example-item').forEach(item => {
        item.addEventListener('click', () => {
            alert(`Пример: ${item.textContent}\nВыбери файл для конвертации`);
        });
    });

    // Обработка файла
    function handleFile(file) {
        currentFile = file;
        const ext = file.name.split('.').pop().toLowerCase();
        currentFileType = extensionToType[ext] || 'unknown';

        // Показываем информацию о файле
        fileName.textContent = file.name;
        fileSize.textContent = formatBytes(file.size);
        fileInfo.style.display = 'block';

        // Получаем длительность для видео/аудио
        if (currentFileType === 'video' || currentFileType === 'audio') {
            getDuration(file);
        } else {
            fileDuration.textContent = '—';
        }

        // Показываем доступные форматы
        showAvailableFormats(currentFileType);
        converterSection.style.display = 'block';
        convertBtnContainer.style.display = 'block';
    }

    // Получение длительности
    function getDuration(file) {
        const url = URL.createObjectURL(file);
        const audio = new Audio(url);
        
        audio.addEventListener('loadedmetadata', () => {
            const duration = formatDuration(audio.duration);
            fileDuration.textContent = duration;
            URL.revokeObjectURL(url);
        });

        audio.addEventListener('error', () => {
            fileDuration.textContent = '—';
            URL.revokeObjectURL(url);
        });
    }

    // Показ доступных форматов
    function showAvailableFormats(type) {
        const availableFormats = formats[type] || [];
        formatGrid.innerHTML = '';

        availableFormats.forEach(format => {
            const btn = document.createElement('button');
            btn.className = 'format-btn';
            btn.textContent = format;
            btn.addEventListener('click', () => selectFormat(format, btn));
            formatGrid.appendChild(btn);
        });
    }

    // Выбор формата
    function selectFormat(format, btn) {
        // Убираем выделение у всех кнопок
        document.querySelectorAll('.format-btn').forEach(b => {
            b.classList.remove('selected');
        });
        
        // Выделяем выбранную
        btn.classList.add('selected');
        selectedFormat = format.toLowerCase();
    }

    // Конвертация
    convertBtn.addEventListener('click', () => {
        if (!currentFile) {
            alert('Сначала выбери файл!');
            return;
        }

        if (!selectedFormat) {
            alert('Выбери формат конвертации!');
            return;
        }

        // Показываем прогресс
        progressSection.style.display = 'flex';
        simulateConversion();
    });

    // Симуляция конвертации
    function simulateConversion() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                // Завершение
                setTimeout(() => {
                    alert(`✅ Конвертация завершена!\n${currentFile.name} → ${selectedFormat.toUpperCase()}`);
                    progressSection.style.display = 'none';
                    progressFill.style.width = '0%';
                    progressText.textContent = '0%';
                }, 500);
            }
            
            progressFill.style.width = progress + '%';
            progressText.textContent = Math.round(progress) + '%';
        }, 200);
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
});
