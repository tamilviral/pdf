document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const convertBtn = document.getElementById('convertBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const downloadContainer = document.getElementById('downloadContainer');
    const downloadLink = document.getElementById('downloadLink');
    const convertAnother = document.getElementById('convertAnother');
    const errorContainer = document.getElementById('errorContainer');
    const preserveFormatting = document.getElementById('preserveFormatting');

    let file = null;

    // Handle drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('drop-zone--over');
    }

    function unhighlight() {
        dropZone.classList.remove('drop-zone--over');
    }

    // Handle file drop
    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFileSelect, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        file = dt.files[0];
        handleFile(file);
    }

    function handleFileSelect() {
        file = fileInput.files[0];
        handleFile(file);
    }

    function handleFile(file) {
        errorContainer.textContent = '';
        
        // Validate file
        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
            errorContainer.textContent = 'Please upload a PDF file';
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            errorContainer.textContent = 'File size must be less than 10MB';
            return;
        }

        // Display file name
        const prompt = dropZone.querySelector('.drop-zone__prompt');
        prompt.textContent = file.name;
        
        // Show convert button
        convertBtn.disabled = false;
    }

    // Convert button click handler
    convertBtn.addEventListener('click', async function() {
        if (!file) {
            errorContainer.textContent = 'Please select a PDF file first';
            return;
        }

        // Disable button and show progress
        convertBtn.disabled = true;
        progressContainer.style.display = 'block';
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('preserveFormatting', preserveFormatting.checked);

            // Simulate progress (in a real app, you'd use actual upload progress)
            simulateProgress();
            
            // Send to backend
            const response = await fetch('https://your-backend-service.com/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Conversion failed');
            }

            const result = await response.json();
            
            // Show download link
            downloadLink.href = result.downloadUrl;
            downloadLink.textContent = `Download ${result.fileName || 'converted_file.docx'}`;
            downloadContainer.style.display = 'flex';
            
        } catch (error) {
            errorContainer.textContent = error.message;
        } finally {
            // Reset progress
            clearInterval(progressInterval);
            progressContainer.style.display = 'none';
        }
    });

    // Convert another button
    convertAnother.addEventListener('click', function() {
        resetConverter();
    });

    function resetConverter() {
        file = null;
        fileInput.value = '';
        downloadContainer.style.display = 'none';
        convertBtn.disabled = false;
        errorContainer.textContent = '';
        const prompt = dropZone.querySelector('.drop-zone__prompt');
        prompt.textContent = 'Drop PDF file here or click to upload';
    }

    // Simulate progress (replace with real progress in production)
    let progress = 0;
    let progressInterval;
    
    function simulateProgress() {
        progress = 0;
        progressInterval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 90) clearInterval(progressInterval);
            updateProgress(progress);
        }, 300);
    }
    
    function updateProgress(value) {
        const percentage = Math.min(100, Math.floor(value));
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}%`;
    }
});
