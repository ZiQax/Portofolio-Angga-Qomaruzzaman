document.addEventListener('DOMContentLoaded', () => {

    // --- LocalStorage CMS Setup (With Compression) ---
    function compressAndSaveImage(file, key, callback) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to WebP with 80% quality to save massive memory AND preserve transparency
                const compressedDataUrl = canvas.toDataURL('image/webp', 0.8);

                if (key) {
                    try {
                        localStorage.setItem(key, compressedDataUrl);
                    } catch (e) {
                        console.error('LocalStorage quota exceeded.', e);
                        alert('Even after compression, the image is too large for browser storage. Try deleting some previously uploaded images.');
                    }
                }

                if (callback) callback(compressedDataUrl);
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(file);
    }

    function loadImageFromLocal(key, imgElement, iconElement, spanElement = null) {
        const data = localStorage.getItem(key);
        if (data && imgElement) {
            imgElement.src = data;
            imgElement.classList.remove('hidden');
            if (iconElement) iconElement.classList.add('hidden');
            if (spanElement) spanElement.classList.add('hidden');
        }
    }

    // Load initial images
    loadImageFromLocal('cms_hero', document.getElementById('hero-image'));
    loadImageFromLocal('cms_thumb_1', document.getElementById('project-thumb-img-1'), document.getElementById('project-thumb-icon-1'));
    loadImageFromLocal('cms_thumb_2', document.getElementById('project-thumb-img-2'), document.getElementById('project-thumb-icon-2'));
    loadImageFromLocal('cms_thumb_3', document.getElementById('project-thumb-img-3'), document.getElementById('project-thumb-icon-3'));

    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    // Scroll Reveal
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
    }, observerOptions);
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Owner functionality: hero & cv
    const heroInput = document.getElementById('hero-image-input');
    const heroImage = document.getElementById('hero-image');
    if (heroInput && heroImage) {
        heroInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                compressAndSaveImage(file, 'cms_hero', function (compressedResult) {
                    heroImage.src = compressedResult;
                });
            }
        });
    }

    const cvBtn = document.getElementById('cv-btn');
    const cvInput = document.getElementById('cv-file-input');
    const cvText = document.getElementById('cv-btn-text');
    const cvChangeBtn = document.getElementById('cv-change-btn');

    function setupCvDownload() {
        const cvData = localStorage.getItem('cms_cv_data');
        const cvName = localStorage.getItem('cms_cv_name');

        if (cvData && cvName) {
            cvText.innerText = "Download CV";
            cvBtn.classList.remove('text-neutral-700', 'dark:text-neutral-200', 'border-neutral-200', 'dark:border-neutral-800');
            cvBtn.classList.add('border-accent-light', 'dark:border-accent-dark', 'text-accent-light', 'dark:text-accent-dark');
            if (cvChangeBtn) cvChangeBtn.classList.remove('hidden');

            cvBtn.onclick = function (e) {
                e.preventDefault();
                const a = document.createElement('a');
                a.href = cvData;
                a.download = cvName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } else {
            cvBtn.onclick = function (e) {
                e.preventDefault();
                cvInput.click();
            }
        }
    }

    if (cvBtn && cvInput && cvText) {
        setupCvDownload();

        cvInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    try {
                        localStorage.setItem('cms_cv_data', event.target.result);
                        localStorage.setItem('cms_cv_name', file.name);
                        setupCvDownload();
                        alert("CV saved to local storage! Visitors can now download it.");
                    } catch (err) {
                        console.error(err);
                        alert("File is too large for Local Storage (max 5MB limit). Try a smaller PDF.");
                    }
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // Modal Gallery CRM (dynamically injected inputs need event listeners delegated or re-attached.
    // Wait, the gallery inputs are in the main document, not inside the modal! Let's check lines 259-267.
    // Ah, yes! "Hidden file inputs for CRM features" are in the main body. Excellent!

    const galleryInputs = [
        document.getElementById('gallery-input-1'),
        document.getElementById('gallery-input-2'),
        document.getElementById('gallery-input-3')
    ];
    galleryInputs.forEach((input, index) => {
        if (!input) return;
        input.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const key = window.currentProjectId ? 'cms_gallery_' + window.currentProjectId + '_' + (index + 1) : null;
                compressAndSaveImage(file, key, function (compressedResult) {
                    const imgSlot = document.getElementById('gallery-img-' + (index + 1));
                    const iconSlot = document.getElementById('gallery-icon-' + (index + 1));
                    const spanSlot = document.getElementById('gallery-span-' + (index + 1));
                    if (imgSlot) {
                        imgSlot.src = compressedResult;
                        imgSlot.classList.remove('hidden');
                        if (iconSlot) iconSlot.classList.add('hidden');
                        if (spanSlot) spanSlot.classList.add('hidden');
                    }
                });
            }
        });
    });

    // Modal Hero CRM
    const modalHeroInput = document.getElementById('modal-hero-input');
    if (modalHeroInput) {
        modalHeroInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file && window.currentProjectId) {
                const key = 'cms_modal_hero_' + window.currentProjectId;
                compressAndSaveImage(file, key, function (compressedResult) {
                    const imgSlot = document.getElementById('modal-hero-img');
                    const iconSlot = document.getElementById('modal-hero-icon');
                    if (imgSlot) {
                        imgSlot.src = compressedResult;
                        imgSlot.classList.remove('hidden');
                        if (iconSlot) iconSlot.classList.add('hidden');
                    }
                });
            }
        });
    }

    // Thumb CRM
    const thumbInputs = [
        document.getElementById('project-thumb-input-1'),
        document.getElementById('project-thumb-input-2'),
        document.getElementById('project-thumb-input-3')
    ];
    thumbInputs.forEach((input, index) => {
        if (!input) return;
        input.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                compressAndSaveImage(file, 'cms_thumb_' + (index + 1), function (compressedResult) {
                    const imgSlot = document.getElementById('project-thumb-img-' + (index + 1));
                    const iconSlot = document.getElementById('project-thumb-icon-' + (index + 1));
                    if (imgSlot) {
                        imgSlot.src = compressedResult;
                        imgSlot.classList.remove('hidden');
                        if (iconSlot) iconSlot.classList.add('hidden');
                    }
                });
            }
        });
    });

});

// --- Modal Logic (needs to be global so onclick can find it) ---
const modal = document.getElementById('project-modal');
const modalBody = document.getElementById('modal-body');
const modalTag = document.getElementById('modal-project-tag');

window.currentProjectId = null;

window.openProjectPage = function (projectId) {
    const data = window.modalData[projectId];
    if (!data || !modal || !modalBody || !modalTag) return;

    window.currentProjectId = projectId;

    modalTag.innerText = data.tag;

    const isProject = !(projectId.startsWith('exp-') || projectId.startsWith('edu-') || projectId.startsWith('cert-'));

    const techStackHtml = data.techStack.map(tech =>
        `<span class="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md text-xs font-medium text-neutral-600 dark:text-neutral-300 shadow-sm">${tech}</span>`
    ).join('');

    let buttonsHtml = '';
    if (data.githubUrl !== '#') {
        buttonsHtml += `<a href="${data.githubUrl}" target="_blank" class="px-8 py-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-sm transition-all duration-300 flex items-center gap-2 shadow-sm hover:scale-105">
            <i class="fa-brands fa-github"></i> Repository
        </a>`;
    }
    if (data.liveUrl !== '#') {
        buttonsHtml += `<a href="${data.liveUrl}" target="_blank" class="px-8 py-4 rounded-xl bg-accent-light hover:bg-indigo-700 text-white font-bold text-sm transition-all duration-300 flex items-center gap-2 shadow-lg shadow-accent-light/20 hover:scale-105">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Live Demo
        </a>`;
    }

    modalBody.innerHTML = `
        <div class="w-full max-w-7xl px-6 py-16 flex flex-col items-center">
            
            <div class="flex flex-col-reverse lg:flex-row items-center justify-between w-full gap-16 mb-20">
                <!-- Left: Text -->
                <div class="lg:w-1/2 text-left">
                    <h2 class="text-4xl md:text-6xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-6">${data.title}</h2>
                    <h3 class="text-2xl font-bold text-neutral-800 dark:text-neutral-200 mb-4">Overview</h3>
                    <p class="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8 text-lg">${data.description}</p>
                    
                    <h4 class="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">Highlights & Tech</h4>
                    <div class="flex flex-wrap gap-2">
                        ${techStackHtml}
                    </div>
                </div>

                <!-- Right: Hero Icon -->
                <div class="lg:w-1/2 flex justify-center lg:justify-end">
                    <div class="group w-64 h-64 md:w-96 md:h-96 rounded-3xl bg-white dark:bg-neutral-900 flex items-center justify-center text-neutral-300 dark:text-neutral-800 text-8xl md:text-9xl shadow-2xl border border-neutral-100 dark:border-neutral-800 animate-float relative overflow-hidden cursor-pointer" onclick="document.getElementById('modal-hero-input').click()">
                        <i id="modal-hero-icon" class="fa-solid ${data.imageIcon}"></i>
                        <img id="modal-hero-img" src="" class="absolute inset-0 w-full h-full object-contain p-6 hidden z-0" alt="Project Hero">
                        <div class="absolute inset-0 bg-neutral-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm z-10">
                            <i class="fa-solid fa-upload text-3xl text-white mb-2"></i>
                            <span class="text-white text-sm font-medium">Upload Hero (Owner)</span>
                        </div>
                    </div>
                </div>
            </div>
            
            ${isProject ? `
            <div class="w-full h-px bg-neutral-200 dark:bg-neutral-800 mb-20"></div>

            <!-- Additional Section: Gallery (CRM Uploadable) -->
            <div class="w-full mb-20">
                <h3 class="text-3xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-10 text-center">Gallery</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    <div class="group h-64 rounded-2xl bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 shadow-sm cursor-pointer relative overflow-hidden transition-all duration-300 hover:border-accent-light" onclick="document.getElementById('gallery-input-1').click()">
                        <img id="gallery-img-1" src="" class="absolute inset-0 w-full h-full object-contain p-2 hidden" alt="Feature 1">
                        <i id="gallery-icon-1" class="fa-solid fa-image text-3xl mb-2"></i>
                        <span id="gallery-span-1" class="text-sm font-medium">Image 1</span>
                        <div class="absolute inset-0 bg-neutral-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                            <i class="fa-solid fa-upload text-2xl text-white mb-2"></i>
                            <span class="text-white text-xs font-medium">Upload Image (Owner)</span>
                        </div>
                    </div>
                    
                    <div class="group h-64 rounded-2xl bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 shadow-sm cursor-pointer relative overflow-hidden transition-all duration-300 hover:border-accent-light" onclick="document.getElementById('gallery-input-2').click()">
                        <img id="gallery-img-2" src="" class="absolute inset-0 w-full h-full object-contain p-2 hidden" alt="Feature 2">
                        <i id="gallery-icon-2" class="fa-solid fa-image text-3xl mb-2"></i>
                        <span id="gallery-span-2" class="text-sm font-medium">Image 2</span>
                        <div class="absolute inset-0 bg-neutral-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                            <i class="fa-solid fa-upload text-2xl text-white mb-2"></i>
                            <span class="text-white text-xs font-medium">Upload Image (Owner)</span>
                        </div>
                    </div>
                    
                    <div class="group h-64 rounded-2xl bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 shadow-sm cursor-pointer relative overflow-hidden transition-all duration-300 hover:border-accent-light" onclick="document.getElementById('gallery-input-3').click()">
                        <img id="gallery-img-3" src="" class="absolute inset-0 w-full h-full object-contain p-2 hidden" alt="Feature 3">
                        <i id="gallery-icon-3" class="fa-solid fa-image text-3xl mb-2"></i>
                        <span id="gallery-span-3" class="text-sm font-medium">Image 3</span>
                        <div class="absolute inset-0 bg-neutral-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                            <i class="fa-solid fa-upload text-2xl text-white mb-2"></i>
                            <span class="text-white text-xs font-medium">Upload Image (Owner)</span>
                        </div>
                    </div>

                </div>
                <div class="flex justify-center mt-12">
                    <button class="px-8 py-3 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
                        <i class="fa-solid fa-images"></i> See more images
                    </button>
                </div>
            </div>
            ` : ''}

            ${buttonsHtml ? `<div class="flex flex-wrap justify-center gap-6 mt-10">${buttonsHtml}</div>` : ''}

        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const modalHeroData = localStorage.getItem('cms_modal_hero_' + projectId);
    if (modalHeroData) {
        const imgSlot = document.getElementById('modal-hero-img');
        const iconSlot = document.getElementById('modal-hero-icon');
        if (imgSlot) {
            imgSlot.src = modalHeroData;
            imgSlot.classList.remove('hidden');
            if (iconSlot) iconSlot.classList.add('hidden');
        }
    }

    // Now check if gallery images exist in local storage for this project and load them
    function loadGalleryImage(key, imgId, iconId, spanId) {
        const localData = localStorage.getItem(key);
        if (localData) {
            const imgElement = document.getElementById(imgId);
            const iconElement = document.getElementById(iconId);
            const spanElement = document.getElementById(spanId);

            if (imgElement) {
                imgElement.src = localData;
                imgElement.classList.remove('hidden');
                if (iconElement) iconElement.classList.add('hidden');
                if (spanElement) spanElement.classList.add('hidden');
            }
        }
    }

    loadGalleryImage('cms_gallery_' + projectId + '_1', 'gallery-img-1', 'gallery-icon-1', 'gallery-span-1');
    loadGalleryImage('cms_gallery_' + projectId + '_2', 'gallery-img-2', 'gallery-icon-2', 'gallery-span-2');
    loadGalleryImage('cms_gallery_' + projectId + '_3', 'gallery-img-3', 'gallery-icon-3', 'gallery-span-3');
}

window.closeProjectPage = function () {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}
