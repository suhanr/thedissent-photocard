const textInput = document.getElementById('textInput');
const subTextInput = document.getElementById('subTextInput');
const textDisplay = document.getElementById('textDisplay');
const subTextDisplay = document.getElementById('subTextDisplay');
const imgUpload = document.getElementById('imgUpload');
const imageContainer = document.getElementById('imageContainer');
const photocard = document.getElementById('photocard');
const previewWrapper = document.getElementById('previewWrapper');
const advancedPanel = document.getElementById('advancedPanel');

let appScale = 0.5;

// ==========================================
// Auto Scaling Setup (Updated for 1350 height)
// ==========================================
function adjustScale() {
    const wrapperWidth = previewWrapper.clientWidth;
    if (window.innerWidth <= 1050) {
        appScale = wrapperWidth / 1080;
        photocard.style.transformOrigin = 'top left';
        photocard.style.marginLeft = '0px';
    } else {
        appScale = Math.min(0.65, wrapperWidth / 1100);
        photocard.style.transformOrigin = 'top center';
    }

    photocard.style.transform = `scale(${appScale})`;
    // Wrapper height dynamically matches 1350px scaled down
    previewWrapper.style.height = `${1350 * appScale}px`;
}
window.addEventListener('resize', adjustScale);
setTimeout(adjustScale, 100);

// Basic Info Live Update
function updateMainText() {
    let rT = textInput.value;
    let rS = subTextInput.value;
    textDisplay.innerHTML = rT.replace(/\*(.*?)\*/g, '<span class="text-yellow">$1</span>').replace(/\n/g, '<br>');
    if (rS.trim() === '') { subTextDisplay.style.display = 'none'; }
    else {
        subTextDisplay.style.display = 'block';
        subTextDisplay.innerHTML = rS.replace(/\*(.*?)\*/g, '<span class="text-yellow">$1</span>').replace(/\n/g, '<br>');
    }
}
textInput.addEventListener('input', updateMainText);
subTextInput.addEventListener('input', updateMainText);
document.getElementById('catInput').addEventListener('input', function () { document.getElementById('catDisplay').textContent = this.value; });
document.getElementById('dateInput').addEventListener('input', function () { document.getElementById('dateDisplay').textContent = this.value; });
document.getElementById('subTextColor').addEventListener('input', function () { subTextDisplay.style.color = this.value; });
updateMainText();

function rgb2hex(rgb) {
    if (rgb.search("rgb") === -1) return rgb;
    rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
    function hex(x) { return ("0" + parseInt(x).toString(16)).slice(-2); }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

// Add action buttons and handles (Updated with Crop Button)
function createHandles(wrapper, handlesArr) {
    handlesArr.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${pos}`;
        wrapper.appendChild(handle);
    });

    const editBtn = document.createElement('div');
    editBtn.className = 'action-btn edit-btn';
    editBtn.innerHTML = '✏️';
    editBtn.title = "এডিট";
    editBtn.onclick = (e) => { e.stopPropagation(); setActiveElement(wrapper); openPopup(); }
    editBtn.ontouchstart = (e) => { e.preventDefault(); e.stopPropagation(); setActiveElement(wrapper); openPopup(); }
    wrapper.appendChild(editBtn);

    // new crop button for image
    if (wrapper.classList.contains('draggable-image')) {
        const cropBtn = document.createElement('div');
        cropBtn.className = 'action-btn crop-btn';
        cropBtn.innerHTML = '✂️';
        cropBtn.title = "ক্রপ করুন";

        const openReCrop = (e) => {
            e.stopPropagation(); e.preventDefault();
            setActiveElement(wrapper);
            croppingElement = wrapper;
            currentOriginalImage = wrapper.dataset.originalImage;

            cropOverlay.style.display = 'block';
            cropModal.classList.add('show');
            cropTargetImage.src = currentOriginalImage;

            if (cropper) cropper.destroy();
            cropper = new Cropper(cropTargetImage, {
                viewMode: 1, autoCropArea: 0.8, background: false, zoomable: true
            });
        };
        cropBtn.onclick = openReCrop;
        cropBtn.ontouchstart = openReCrop;
        wrapper.appendChild(cropBtn);
    }

    const delBtn = document.createElement('div');
    delBtn.className = 'action-btn delete-btn';
    delBtn.innerHTML = '✕';
    delBtn.title = "ডিলিট";
    delBtn.onclick = (e) => { e.stopPropagation(); wrapper.remove(); clearSelection(); }
    delBtn.ontouchstart = (e) => { e.preventDefault(); e.stopPropagation(); wrapper.remove(); clearSelection(); }
    wrapper.appendChild(delBtn);
}

// Layer control function
function adjustLayer(change) {
    if (!activeEl) return;
    let currentZ = parseInt(activeEl.style.zIndex) || parseInt(activeEl.dataset.baseZ) || 20;
    let newZ = currentZ + change;
    activeEl.style.zIndex = newZ;
}

// ==========================================
// croper logic and image uploader(Advanced)
// ==========================================
let cropper = null;
let croppingElement = null; // for crop element tracking
let currentOriginalImage = null; // for keep original pic

const cropModal = document.getElementById('cropModal');
const cropOverlay = document.getElementById('cropModalOverlay');
const cropTargetImage = document.getElementById('cropTargetImage');

// Add Image (Cropper Modal Logic)
imgUpload.addEventListener('change', function (e) {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = function (event) {
            currentOriginalImage = event.target.result;
            croppingElement = null; //new image uploading

            // show pop-up
            cropOverlay.style.display = 'block';
            cropModal.classList.add('show');
            cropModal.style.top = '50%';
            cropModal.style.left = '50%';
            cropModal.style.transform = 'translate(-50%, -50%)';

            cropTargetImage.src = currentOriginalImage;

            // cropper start
            if (cropper) {
                cropper.destroy();
            }
            cropper = new Cropper(cropTargetImage, {
                viewMode: 1,
                autoCropArea: 0.8,
                background: false,
                zoomable: true,
            });
        }
        reader.readAsDataURL(file);
    }
    this.value = ''; // Reset input
});

function closeCropModal() {
    cropOverlay.style.display = 'none';
    cropModal.classList.remove('show');
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

function applyCrop() {
    if (!cropper) return;

    // crop canvas
    const canvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });
    const croppedDataUrl = canvas.toDataURL('image/png');

    if (croppingElement) {
        // for crop again(multiple)
        croppingElement.style.backgroundImage = `url(${croppedDataUrl})`;
        croppingElement = null;
    } else {
        // for new image
        const wrapper = document.createElement('div');
        wrapper.className = 'draggable-image drag-handle item-element';

        // ratio size
        const defaultWidth = 400;
        const defaultHeight = (canvas.height / canvas.width) * defaultWidth;

        wrapper.style.width = defaultWidth + 'px';
        wrapper.style.height = defaultHeight + 'px';
        wrapper.style.left = '50px';
        wrapper.style.top = '50px';
        wrapper.style.backgroundImage = `url(${croppedDataUrl})`;
        wrapper.dataset.originalImage = currentOriginalImage; // for saving original pic
        wrapper.dataset.baseZ = 10; wrapper.style.zIndex = 10;

        createHandles(wrapper, ['nw', 'ne', 'sw', 'se']);
        imageContainer.appendChild(wrapper);
        setActiveElement(wrapper);
    }

    closeCropModal();
}

// Add Shape
function addShape(type) {
    const wrapper = document.createElement('div');
    wrapper.className = 'draggable-shape drag-handle item-element';
    wrapper.style.left = '50px'; wrapper.style.top = '50px';
    wrapper.style.backgroundColor = '#ff4757';
    wrapper.dataset.baseZ = 15; wrapper.style.zIndex = 15;

    if (type === 'square') { wrapper.style.width = '200px'; wrapper.style.height = '200px'; }
    if (type === 'circle') { wrapper.style.width = '200px'; wrapper.style.height = '200px'; wrapper.style.borderRadius = '50%'; }
    if (type === 'line') { wrapper.style.width = '300px'; wrapper.style.height = '10px'; wrapper.style.backgroundColor = '#ffffff'; }

    createHandles(wrapper, ['nw', 'ne', 'sw', 'se']);
    imageContainer.appendChild(wrapper);
    setActiveElement(wrapper);
}

function addSticker(val) { if (val) createSticker(val, 120); }
function addCustomText() { createCustomText('আপনার টেক্সট', 50); }

function createCustomText(defaultText, defaultSize) {
    const wrapper = document.createElement('div');
    wrapper.className = 'draggable-text drag-handle item-element';
    wrapper.style.left = '50px'; wrapper.style.top = '50px';
    wrapper.style.color = '#000000';
    wrapper.style.backgroundColor = 'transparent';
    wrapper.style.fontSize = defaultSize + 'px';
    wrapper.style.width = 'fit-content'; wrapper.style.height = 'auto';
    wrapper.dataset.baseZ = 20; wrapper.style.zIndex = 20;

    const content = document.createElement('div');
    content.className = 'text-content';
    content.style.width = '100%'; content.style.height = '100%';
    content.innerHTML = defaultText;
    wrapper.appendChild(content);

    createHandles(wrapper, ['nw', 'sw', 'se']);
    imageContainer.appendChild(wrapper);
    setActiveElement(wrapper);
}

function createSticker(emoji, defaultSize) {
    const wrapper = document.createElement('div');
    wrapper.className = 'draggable-text is-sticker drag-handle item-element';
    wrapper.style.left = '50px'; wrapper.style.top = '50px';
    wrapper.style.color = '#000000';
    wrapper.style.backgroundColor = 'transparent';
    wrapper.style.fontSize = defaultSize + 'px';
    wrapper.style.width = 'fit-content'; wrapper.style.height = 'auto';
    wrapper.dataset.baseZ = 20; wrapper.style.zIndex = 20;

    const content = document.createElement('div');
    content.className = 'text-content';
    content.innerHTML = emoji;
    wrapper.appendChild(content);

    createHandles(wrapper, ['nw', 'sw', 'se']);
    imageContainer.appendChild(wrapper);
    setActiveElement(wrapper);
}

// ==========================================
// Popup & Editing Logic
// ==========================================
let activeEl = null;

function closePopup() {
    advancedPanel.classList.remove('show');
}

function clearSelection() {
    if (activeEl) activeEl.classList.remove('active-element');
    activeEl = null;
    closePopup();
}

function handleCanvasClick(e) {
    if (e.target.id === 'photocard' || e.target.id === 'imageContainer') {
        clearSelection();
    }
}

function setActiveElement(el) {
    if (activeEl) activeEl.classList.remove('active-element');
    activeEl = el;
    if (!el) return;
    el.classList.add('active-element');

    if (advancedPanel.classList.contains('show')) {
        openPopup();
    }
}

function openPopup() {
    if (!activeEl) return;

    if (!advancedPanel.style.left || advancedPanel.style.left === '50%') {
        advancedPanel.style.top = '50%';
        advancedPanel.style.left = '50%';
        advancedPanel.style.transform = 'translate(-50%, -50%)';
    }

    advancedPanel.classList.add('show');

    let currentOpacity = activeEl.style.opacity || 1;
    document.getElementById('propOpacity').value = currentOpacity * 100;
    document.getElementById('propOpacityVal').innerText = (currentOpacity * 100) + '%';

    let transformStr = activeEl.style.transform || '';
    let rotateMatch = transformStr.match(/rotate\(([-\d.]+)deg\)/);
    let currentRotate = rotateMatch ? parseInt(rotateMatch[1]) : 0;
    document.getElementById('propRotate').value = currentRotate;
    document.getElementById('propRotateVal').innerText = currentRotate + '°';

    let currentRadius = parseInt(activeEl.style.borderRadius) || 0;
    document.getElementById('propRadius').value = currentRadius;
    document.getElementById('propRadiusVal').innerText = currentRadius + 'px';

    const isText = activeEl.classList.contains('draggable-text');
    const isSticker = activeEl.classList.contains('is-sticker');
    const isShape = activeEl.classList.contains('draggable-shape');
    const isImage = activeEl.classList.contains('draggable-image');

    document.getElementById('textControls').style.display = (isText && !isSticker) ? 'block' : 'none';
    document.getElementById('fontSizeControlDiv').style.display = isText ? 'flex' : 'none';
    document.getElementById('radiusControlDiv').style.display = (isImage || isShape) ? 'flex' : 'none';
    document.getElementById('colorControlDiv').style.display = (isText || isShape) ? 'block' : 'none';
    document.getElementById('borderControlDiv').style.display = isImage ? 'flex' : 'none';

    if (isText) {
        const content = activeEl.querySelector('.text-content');
        if (!isSticker) {
            document.getElementById('editActiveText').value = content.innerHTML.replace(/<br>/g, '\n');
            document.getElementById('toggleShadow').checked = content.style.textShadow && content.style.textShadow.includes('rgba');
            document.getElementById('toggleOutline').checked = content.style.webkitTextStroke ? true : false;
        }

        document.getElementById('propColor').value = rgb2hex(activeEl.style.color || '#000000');

        if (activeEl.style.backgroundColor === 'transparent' || !activeEl.style.backgroundColor || activeEl.style.backgroundColor === 'rgba(0, 0, 0, 0)') {
            document.getElementById('propBgTrans').checked = true;
        } else {
            document.getElementById('propBgTrans').checked = false;
            document.getElementById('propBg').value = rgb2hex(activeEl.style.backgroundColor);
        }

        let currentSize = parseInt(activeEl.style.fontSize) || 40;
        document.getElementById('propFontSize').value = currentSize;
        document.getElementById('propFontSizeVal').innerText = currentSize + 'px';

    } else if (isShape) {
        document.getElementById('propColor').value = '#000000';
        if (activeEl.style.backgroundColor === 'transparent' || !activeEl.style.backgroundColor) {
            document.getElementById('propBgTrans').checked = true;
        } else {
            document.getElementById('propBgTrans').checked = false;
            document.getElementById('propBg').value = '#ff4757';
        }
    }

    if (isImage) {
        let bw = parseInt(activeEl.style.borderWidth) || 0;
        document.getElementById('propBorderWidth').value = bw;
        document.getElementById('propBorderWidthVal').innerText = bw + 'px';
        document.getElementById('propBorderColor').value = rgb2hex(activeEl.style.borderColor || '#ffffff');
    }
}

// Live Event Listeners for Properties
document.getElementById('propOpacity').addEventListener('input', function () {
    if (activeEl) activeEl.style.opacity = this.value / 100;
    document.getElementById('propOpacityVal').innerText = this.value + '%';
});

document.getElementById('propRotate').addEventListener('input', function () {
    if (activeEl) activeEl.style.transform = `rotate(${this.value}deg)`;
    document.getElementById('propRotateVal').innerText = this.value + '°';
});

document.getElementById('propRadius').addEventListener('input', function () {
    if (activeEl) activeEl.style.borderRadius = this.value + 'px';
    document.getElementById('propRadiusVal').innerText = this.value + 'px';
});

document.getElementById('propBorderWidth').addEventListener('input', function () {
    if (activeEl && activeEl.classList.contains('draggable-image')) {
        activeEl.style.borderWidth = this.value + 'px';
        activeEl.style.borderStyle = this.value > 0 ? 'solid' : 'none';
        document.getElementById('propBorderWidthVal').innerText = this.value + 'px';
    }
});

document.getElementById('propBorderColor').addEventListener('input', function () {
    if (activeEl && activeEl.classList.contains('draggable-image')) {
        activeEl.style.borderColor = this.value;
    }
});

document.getElementById('propColor').addEventListener('input', function () {
    if (activeEl && (activeEl.classList.contains('draggable-text') || activeEl.classList.contains('draggable-shape'))) {
        if (activeEl.classList.contains('draggable-text')) activeEl.style.color = this.value;
        if (activeEl.classList.contains('draggable-shape')) activeEl.style.backgroundColor = this.value;
    }
});

document.getElementById('propBg').addEventListener('input', function () {
    if (!activeEl || document.getElementById('propBgTrans').checked || activeEl.classList.contains('draggable-shape')) return;
    activeEl.style.backgroundColor = this.value;
});

document.getElementById('propBgTrans').addEventListener('change', function () {
    if (activeEl && !activeEl.classList.contains('draggable-shape')) {
        activeEl.style.backgroundColor = this.checked ? 'transparent' : document.getElementById('propBg').value;
    }
});

document.getElementById('propFontSize').addEventListener('input', function () {
    if (activeEl && activeEl.classList.contains('draggable-text')) {
        activeEl.style.fontSize = this.value + 'px';
        activeEl.style.height = 'auto';
        document.getElementById('propFontSizeVal').innerText = this.value + 'px';
    }
});

document.getElementById('editActiveText').addEventListener('input', function () {
    if (activeEl && activeEl.classList.contains('draggable-text') && !activeEl.classList.contains('is-sticker')) {
        activeEl.querySelector('.text-content').innerHTML = this.value.replace(/\n/g, '<br>');
    }
});

function formatActiveText(type) {
    if (!activeEl || activeEl.classList.contains('is-sticker')) return;
    const content = activeEl.querySelector('.text-content');
    if (type === 'bold') content.style.fontWeight = content.style.fontWeight === 'bold' ? 'normal' : 'bold';
    if (type === 'italic') content.style.fontStyle = content.style.fontStyle === 'italic' ? 'normal' : 'italic';
    if (['left', 'center', 'right'].includes(type)) content.style.textAlign = type;
}

function applyTextEffects() {
    if (!activeEl || activeEl.classList.contains('is-sticker')) return;
    const content = activeEl.querySelector('.text-content');
    const shadowOn = document.getElementById('toggleShadow').checked;
    const outlineOn = document.getElementById('toggleOutline').checked;

    let shadowString = '';
    if (shadowOn) shadowString += '4px 4px 8px rgba(0,0,0,0.7)';
    if (outlineOn) {
        if (shadowString) shadowString += ', ';
        shadowString += '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000';
    }
    content.style.textShadow = shadowString || 'none';
}

// ==========================================
// Interaction Logic (Drag, Resize, Popup Drag)
// ==========================================
let isDragging = false, isResizing = false, isDraggingPopup = false;
let currentElement = null, currentHandle = null;
let startX, startY, initialLeft, initialTop, startW, startH, startFontSize = 40;
let popupStartX, popupStartY, popupInitLeft, popupInitTop;

function getEventPos(e) {
    if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
}

function handleStart(e) {
    // Popup Drag
    if (e.target.closest('.drag-handle-popup')) {
        if (e.target.tagName.toLowerCase() === 'span') return;
        isDraggingPopup = true;
        const pos = getEventPos(e);
        popupStartX = pos.x; popupStartY = pos.y;

        const rect = advancedPanel.getBoundingClientRect();
        popupInitLeft = rect.left; popupInitTop = rect.top;

        advancedPanel.style.transform = 'none';
        advancedPanel.style.left = popupInitLeft + 'px';
        advancedPanel.style.top = popupInitTop + 'px';
        e.preventDefault();
        return;
    }

    if (e.target.closest('.popup-panel')) return;

    if (e.target.classList.contains('resize-handle')) {
        isResizing = true;
        currentHandle = e.target;
        currentElement = e.target.closest('.item-element');

        const pos = getEventPos(e);
        startX = pos.x; startY = pos.y;
        initialLeft = currentElement.offsetLeft; initialTop = currentElement.offsetTop;
        startW = currentElement.offsetWidth; startH = currentElement.offsetHeight;

        if (currentElement.classList.contains('draggable-text')) {
            startFontSize = parseFloat(window.getComputedStyle(currentElement).fontSize) || 40;
        }
        setActiveElement(currentElement);
        e.preventDefault(); e.stopPropagation();
    }
    else if (e.target.classList.contains('drag-handle') || e.target.closest('.item-element')) {
        isDragging = true;
        currentElement = e.target.closest('.item-element');

        const pos = getEventPos(e);
        startX = pos.x; startY = pos.y;
        initialLeft = currentElement.offsetLeft; initialTop = currentElement.offsetTop;

        setActiveElement(currentElement);
        e.preventDefault();
    }
}

function handleMove(e) {
    if (isDraggingPopup) {
        e.preventDefault();
        const pos = getEventPos(e);
        const dx = pos.x - popupStartX;
        const dy = pos.y - popupStartY;
        advancedPanel.style.left = (popupInitLeft + dx) + 'px';
        advancedPanel.style.top = (popupInitTop + dy) + 'px';
    }
    else if (isResizing && currentElement) {
        e.preventDefault();
        const pos = getEventPos(e);
        const dx = (pos.x - startX) / appScale;
        const dy = (pos.y - startY) / appScale;

        let newW = startW, newH = startH, newL = initialLeft, newT = initialTop;

        if (currentHandle.classList.contains('se')) { newW = startW + dx; newH = startH + dy; }
        else if (currentHandle.classList.contains('sw')) { newW = startW - dx; newH = startH + dy; newL = initialLeft + dx; }
        else if (currentHandle.classList.contains('ne')) { newW = startW + dx; newH = startH - dy; newT = initialTop + dy; }
        else if (currentHandle.classList.contains('nw')) { newW = startW - dx; newH = startH - dy; newL = initialLeft + dx; newT = initialTop + dy; }

        if (newW > 20) {
            currentElement.style.width = newW + 'px';
            currentElement.style.left = newL + 'px';
        }

        if (currentElement.classList.contains('draggable-text') && newW > 20) {
            let scaleRatio = newW / startW;
            let newFontSize = startFontSize * scaleRatio;
            if (newFontSize > 10) {
                currentElement.style.fontSize = newFontSize + 'px';
                if (activeEl === currentElement) {
                    document.getElementById('propFontSize').value = Math.round(newFontSize);
                    document.getElementById('propFontSizeVal').innerText = Math.round(newFontSize) + 'px';
                }
            }
            currentElement.style.height = 'auto';
        } else if (newH > 20) {
            currentElement.style.height = newH + 'px';
            currentElement.style.top = newT + 'px';
        }
    }
    else if (isDragging && currentElement) {
        e.preventDefault();
        const pos = getEventPos(e);
        const dx = (pos.x - startX) / appScale;
        const dy = (pos.y - startY) / appScale;
        currentElement.style.left = (initialLeft + dx) + 'px';
        currentElement.style.top = (initialTop + dy) + 'px';
    }
}

function handleEnd() { isDragging = false; isResizing = false; isDraggingPopup = false; currentElement = null; currentHandle = null; }

document.addEventListener('mousedown', handleStart, { passive: false });
document.addEventListener('mousemove', handleMove, { passive: false });
document.addEventListener('mouseup', handleEnd);
document.addEventListener('touchstart', handleStart, { passive: false });
document.addEventListener('touchmove', handleMove, { passive: false });
document.addEventListener('touchend', handleEnd);

// ==========================================
// Download Engine & Fixes for Mobile (Updated for 1350 & scale 1)
// ==========================================
function downloadPhotocard() {
    clearSelection();

    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    document.fonts.ready.then(() => {
        const originalTransform = photocard.style.transform;
        const originalOrigin = photocard.style.transformOrigin;

        photocard.style.transform = 'none';
        photocard.style.transformOrigin = 'top left';
        photocard.classList.add('exporting');

        html2canvas(photocard, {
            scale: 2,
            width: 1080,
            height: 1350,
            windowWidth: 1080,
            windowHeight: 1350,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#2b2b2d',
            scrollY: 0,
            scrollX: 0
        }).then(canvas => {
            photocard.style.transform = originalTransform;
            photocard.style.transformOrigin = originalOrigin;
            photocard.classList.remove('exporting');

            const link = document.createElement('a');
            link.download = `TheDissent_Photocard_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });
}
