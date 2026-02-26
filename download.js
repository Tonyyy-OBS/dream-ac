/* Download page logic (lightweight, no runtime CSS compiler) */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const toastContainer = document.getElementById('toast-container');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (mobileMenu.classList.contains('hidden')) {
                return;
            }

            const target = e.target;
            if (target instanceof Node && !mobileMenu.contains(target) && !menuToggle.contains(target)) {
                mobileMenu.classList.add('hidden');
            }
        });

        mobileMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    function showToast(message, type = 'default', duration = 3500) {
        if (!toastContainer) {
            return;
        }

        const colors = {
            success: 'bg-green-600/90',
            warning: 'bg-yellow-500/90',
            error: 'bg-red-600/90',
            default: 'bg-zinc-800/90'
        };

        const tone = colors[type] || colors.default;

        const toast = document.createElement('div');
        toast.className = `toast ${tone} text-white text-sm flex items-center gap-3 max-w-sm`;
        const icon = document.createElement('i');
        icon.className = 'bi bi-info-circle opacity-80';
        const text = document.createElement('span');
        text.textContent = message;
        toast.append(icon, text);

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px) scale(0.9)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    const modal = document.getElementById('confirmModal');
    const downloadBtn = document.getElementById('downloadBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const agreeCheckbox = document.getElementById('agreeCheckbox');
    const downloadForm = document.getElementById('downloadForm');
    const pinInput = document.getElementById('pinInput');
    const errorMessage = (downloadForm?.dataset.errorMessage || '').trim();
    const configuredDownloadUrl = (downloadForm?.dataset.downloadUrl || '').trim();
    const allowedDownloadHosts = (downloadForm?.dataset.allowedDownloadHosts || '')
        .split(',')
        .map((host) => host.trim().toLowerCase())
        .filter((host) => host !== '');
    let modalHideTimer = null;

    if (!modal || !downloadBtn || !confirmBtn || !cancelBtn || !agreeCheckbox || !downloadForm || !pinInput) {
        return;
    }

    function normalizePinValue() {
        pinInput.value = pinInput.value.replace(/\D/g, '').slice(0, 6);
    }

    function parseSafeUrl(rawValue) {
        const value = (rawValue || '').trim();
        if (value === '' || value === '#') {
            return null;
        }

        // Block obvious scriptable protocols before URL parsing.
        if (/^(javascript|data|vbscript):/i.test(value)) {
            return null;
        }

        let parsed;
        try {
            parsed = new URL(value, window.location.href);
        } catch {
            return null;
        }

        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return null;
        }

        if (allowedDownloadHosts.length > 0 && !allowedDownloadHosts.includes(parsed.host.toLowerCase())) {
            return null;
        }

        return parsed.toString();
    }

    function getSafeActionUrl() {
        return parseSafeUrl(downloadForm.getAttribute('action') || '');
    }

    function getSafeConfiguredDownloadUrl() {
        return parseSafeUrl(configuredDownloadUrl);
    }

    normalizePinValue();
    pinInput.addEventListener('input', normalizePinValue);
    pinInput.addEventListener('paste', () => {
        window.setTimeout(normalizePinValue, 0);
    });

    // Keep form submission under JS control and route Enter key to the same modal flow.
    downloadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        downloadBtn.click();
    });

    modal.classList.remove('active');
    modal.classList.add('hidden');

    downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();

        if (pinInput.value.length !== 6) {
            showToast('Please enter a valid 6-digit PIN', 'warning', 2600);
            return;
        }

        if (modalHideTimer) {
            clearTimeout(modalHideTimer);
            modalHideTimer = null;
        }

        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
        document.body.style.overflow = 'hidden';
    });

    function closeModal() {
        if (modalHideTimer) {
            clearTimeout(modalHideTimer);
            modalHideTimer = null;
        }

        modal.classList.remove('active');
        modalHideTimer = window.setTimeout(() => {
            modal.classList.add('hidden');
            modalHideTimer = null;
        }, 300);
        document.body.style.overflow = '';
        agreeCheckbox.checked = false;
        confirmBtn.classList.add('btn-disabled');
    }

    cancelBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    agreeCheckbox.addEventListener('change', () => {
        if (agreeCheckbox.checked) {
            confirmBtn.classList.remove('btn-disabled');
        } else {
            confirmBtn.classList.add('btn-disabled');
        }
    });

    confirmBtn.addEventListener('click', () => {
        if (!agreeCheckbox.checked) {
            return;
        }

        if (pinInput.value.length !== 6) {
            closeModal();
            showToast('Please enter a valid 6-digit PIN', 'warning', 2600);
            return;
        }

        const safeActionUrl = getSafeActionUrl();
        const safeConfiguredDownloadUrl = getSafeConfiguredDownloadUrl();

        if (configuredDownloadUrl !== '' && safeConfiguredDownloadUrl === null) {
            closeModal();
            showToast('Configured download URL is invalid or not allowed.', 'error', 4200);
            return;
        }

        if (safeActionUrl === null && safeConfiguredDownloadUrl === null) {
            closeModal();
            showToast('Download endpoint is not configured yet.', 'warning', 3200);
            return;
        }

        closeModal();
        showToast('Preparing download...', 'default', 2200);

        if (safeConfiguredDownloadUrl !== null) {
            window.open(safeConfiguredDownloadUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        downloadForm.setAttribute('action', safeActionUrl);
        downloadForm.submit();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') {
            return;
        }

        if (modal.classList.contains('active')) {
            closeModal();
        }

        if (menuToggle && mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }
    });

    if (errorMessage !== '') {
        showToast(errorMessage, 'error', 4200);
    }
});

