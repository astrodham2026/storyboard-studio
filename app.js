/**
 * Storyboard Studio — app.js
 * Features: full-page Scene View, 4-per-row 16:9 images, drag & drop + paste upload,
 *           20 MB limit, original-quality clipboard copy/download, trash bin, live search.
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ===================================================================
     STATE
  =================================================================== */
  const state = {
    storyName: 'Untitled Storyboard',
    genre: '',
    scenes: [],
    trash: [],
    activeSceneId: null,
    viewSceneId: null,   // which scene we are currently viewing
    presentIndex: 0,
    searchQuery: ''
  };

  // Raw Blob store — keyed by image element id — never serialised to localStorage
  // This ensures clipboard/download always uses original byte-perfect file.
  const rawBlobStore = {};

  /* ===================================================================
     DOM REFERENCES
  =================================================================== */
  const landingScreen      = document.getElementById('landing-screen');
  const appScreen          = document.getElementById('app-screen');
  const workspaceEditMode  = document.getElementById('workspace-edit-mode');
  const sceneViewScreen    = document.getElementById('scene-view-screen');
  const btnBackFromView    = document.getElementById('btn-back-from-view');
  const btnEditFromView    = document.getElementById('btn-edit-from-view');
  const sceneViewBreadcrumb= document.getElementById('scene-view-breadcrumb');
  const sceneViewBody      = document.getElementById('scene-view-body');

  const btnHeroStart       = document.getElementById('btn-hero-start');
  const displayStoryName   = document.getElementById('display-story-name');
  const inputGlobalSearch  = document.getElementById('input-global-search');
  const btnClearSearch     = document.getElementById('btn-clear-search');
  const btnOpenTrash       = document.getElementById('btn-open-trash');
  const trashCount         = document.getElementById('trash-count');

  const sidebarSceneList   = document.getElementById('sidebar-scene-list');
  const sceneCountBadge    = document.getElementById('scene-count-badge');
  const btnSidebarAddScene = document.getElementById('btn-sidebar-add-scene');

  const inputSceneTitle    = document.getElementById('input-scene-title');
  const inputSceneDesc     = document.getElementById('input-scene-desc');
  const storyboardFrame    = document.getElementById('storyboard-frame');
  const emptyCanvasView    = document.getElementById('empty-canvas-view');
  const sceneElementsGrid  = document.getElementById('scene-elements-grid');
  const btnCanvasAddContent= document.getElementById('btn-canvas-add-content');

  // Modals
  const modalStorySetup    = document.getElementById('modal-story-setup');
  const formStorySetup     = document.getElementById('form-story-setup');
  const inputStoryName     = document.getElementById('input-story-name');
  const inputStoryGenre    = document.getElementById('input-story-genre');

  const modalAddScene      = document.getElementById('modal-add-scene');
  const formAddScene       = document.getElementById('form-add-scene');
  const inputNewSceneName  = document.getElementById('input-new-scene-name');

  const modalContentType   = document.getElementById('modal-content-type');
  const optSelectImage     = document.getElementById('opt-select-image');
  const optSelectContext   = document.getElementById('opt-select-context');

  const modalAddImage      = document.getElementById('modal-add-image');
  const formAddImage       = document.getElementById('form-add-image');
  const inputImageAlt      = document.getElementById('input-image-alt');
  const inputFileImage     = document.getElementById('input-file-image');
  const inputUrlImage      = document.getElementById('input-url-image');
  const btnBrowseFile      = document.getElementById('btn-browse-file');
  const btnOpenSketch      = document.getElementById('btn-open-sketch');
  const imageDropZone      = document.getElementById('image-drop-zone');
  const dropZonePreview    = document.getElementById('drop-zone-preview');

  const modalAddContext    = document.getElementById('modal-add-context');
  const formAddContext     = document.getElementById('form-add-context');
  const selectContextCategory = document.getElementById('select-context-category');
  const textareaContextText   = document.getElementById('textarea-context-text');

  const modalSketchPad     = document.getElementById('modal-sketch-pad');
  const sketchCanvas       = document.getElementById('sketch-canvas');
  const sketchColor        = document.getElementById('sketch-color');
  const sketchSize         = document.getElementById('sketch-size');
  const btnClearSketch     = document.getElementById('btn-clear-sketch');
  const btnSaveSketch      = document.getElementById('btn-save-sketch');
  let   isDrawing          = false;
  const ctx                = sketchCanvas ? sketchCanvas.getContext('2d') : null;

  const modalTrashBin      = document.getElementById('modal-trash-bin');
  const trashItemsContainer= document.getElementById('trash-items-container');
  const btnEmptyTrash      = document.getElementById('btn-empty-trash');

  const modalPresentation  = document.getElementById('modal-presentation');
  const btnNavPresent      = document.getElementById('btn-nav-present');
  const presentStoryTitle  = document.getElementById('present-story-title');
  const presentCurrentIdx  = document.getElementById('present-current-index');
  const presentTotalScenes = document.getElementById('present-total-scenes');
  const presentSlideContent= document.getElementById('present-slide-content');
  const btnPresentPrev     = document.getElementById('btn-present-prev');
  const btnPresentNext     = document.getElementById('btn-present-next');

  const btnNavExportJson   = document.getElementById('btn-nav-export-json');
  const btnNavNew          = document.getElementById('btn-nav-new');

  // Pending images queued in drop zone before form submit
  let pendingDropImages    = []; // [{dataUrl, blob, fileName}]

  /* ===================================================================
     INIT
  =================================================================== */
  function init() {
    setupModalClose();
    setupSketchPad();
    setupDropZone();
    setupEventListeners();

    const saved = localStorage.getItem('storyboard_studio_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.scenes && parsed.scenes.length > 0) {
          Object.assign(state, { storyName: parsed.storyName || 'Saved Storyboard', genre: parsed.genre || '', scenes: parsed.scenes, trash: parsed.trash || [] });
          state.activeSceneId = parsed.scenes[0].id;
          openWorkspace();
          updateTrashBadge();
          showToast('Restored saved storyboard!');
        }
      } catch(e) { console.error(e); }
    }
  }

  function save() {
    localStorage.setItem('storyboard_studio_data', JSON.stringify({ storyName: state.storyName, genre: state.genre, scenes: state.scenes, trash: state.trash }));
    updateTrashBadge();
  }

  function updateTrashBadge() { if (trashCount) trashCount.textContent = state.trash.length; }

  /* ===================================================================
     LANDING → WORKSPACE FLOW
  =================================================================== */
  btnHeroStart.addEventListener('click', () => { openModal(modalStorySetup); inputStoryName.focus(); });

  formStorySetup.addEventListener('submit', e => {
    e.preventDefault();
    const name = inputStoryName.value.trim(); if (!name) return;
    state.storyName = name; state.genre = inputStoryGenre.value.trim();
    if (!state.scenes.length) { const s = makeScene('Scene 1 — Establishing Shot'); state.scenes.push(s); state.activeSceneId = s.id; }
    closeModal(modalStorySetup);
    openWorkspace(); save(); showToast(`Storyboard "${state.storyName}" created!`);
  });

  function openWorkspace() {
    landingScreen.classList.remove('active');
    appScreen.classList.add('active');
    displayStoryName.textContent = state.storyName;
    renderSidebar(); renderActiveScene();
  }

  btnNavNew.addEventListener('click', () => {
    if (!confirm('Start a new story? Export first to avoid losing work.')) return;
    Object.assign(state, { storyName: 'Untitled Storyboard', genre: '', scenes: [], trash: [], activeSceneId: null });
    localStorage.removeItem('storyboard_studio_data');
    appScreen.classList.remove('active'); landingScreen.classList.add('active');
    openModal(modalStorySetup);
  });

  /* ===================================================================
     SCENE MANAGEMENT
  =================================================================== */
  function makeScene(title = 'New Scene') {
    return { id: `scene_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, title, description: '', elements: [] };
  }

  btnSidebarAddScene.addEventListener('click', () => {
    inputNewSceneName.value = `Scene ${state.scenes.length + 1}`;
    openModal(modalAddScene); inputNewSceneName.focus(); inputNewSceneName.select();
  });

  formAddScene.addEventListener('submit', e => {
    e.preventDefault();
    const title = inputNewSceneName.value.trim() || `Scene ${state.scenes.length + 1}`;
    const s = makeScene(title); state.scenes.push(s); state.activeSceneId = s.id;
    closeModal(modalAddScene); renderSidebar(); renderActiveScene(); save(); showToast(`Added: ${title}`);
  });

  function renderSidebar() {
    sidebarSceneList.innerHTML = '';
    sceneCountBadge.textContent = state.scenes.length;
    state.scenes.forEach((scene, idx) => {
      const item = document.createElement('div');
      item.className = `scene-item ${scene.id === state.activeSceneId ? 'active' : ''}`;
      item.innerHTML = `
        <div class="scene-item-top">
          <div class="scene-info">
            <div class="scene-badge">${idx + 1}</div>
            <span class="scene-title-text">${highlightText(scene.title)}</span>
          </div>
        </div>
        <div class="scene-item-actions">
          <button class="btn btn-secondary btn-sm btn-view-scene" title="View Scene"><i class="fa-solid fa-eye" style="color:var(--accent-cyan);"></i> View</button>
          <button class="btn btn-primary btn-sm btn-edit-scene" title="Edit Scene"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
          <button class="btn btn-danger btn-icon btn-sm btn-delete-scene" title="Move to Trash"><i class="fa-solid fa-trash-can" style="font-size:.75rem;"></i></button>
        </div>`;

      item.querySelector('.btn-view-scene').addEventListener('click', e => { e.stopPropagation(); openSceneView(scene.id); });
      item.querySelector('.btn-edit-scene').addEventListener('click', e => {
        e.stopPropagation(); state.activeSceneId = scene.id;
        showEditMode(); renderSidebar(); renderActiveScene();
      });
      item.querySelector('.btn-delete-scene').addEventListener('click', e => {
        e.stopPropagation();
        if (state.scenes.length <= 1) { showToast('Must have at least 1 scene!', 'warning'); return; }
        if (!confirm(`Move "${scene.title}" to Trash?`)) return;
        state.scenes = state.scenes.filter(s => s.id !== scene.id);
        state.trash.push({ id: `trash_${Date.now()}`, type: 'scene', data: scene, deletedAt: new Date().toLocaleTimeString() });
        if (state.activeSceneId === scene.id) state.activeSceneId = state.scenes[0].id;
        renderSidebar(); renderActiveScene(); save(); showToast('Scene moved to Trash');
      });

      sidebarSceneList.appendChild(item);
    });
  }

  /* ===================================================================
     FULL-PAGE SCENE VIEW
  =================================================================== */
  function openSceneView(sceneId) {
    state.viewSceneId = sceneId;
    const scene = state.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    // Switch to view screen
    workspaceEditMode.style.display = 'none';
    sceneViewScreen.style.display = 'flex';
    sceneViewBreadcrumb.textContent = scene.title;

    // Separate images and context elements
    const images = scene.elements.filter(el => el.type === 'image');
    const contexts = scene.elements.filter(el => el.type === 'context');

    let html = `
      <div style="margin-bottom:1.5rem;">
        <h1 style="font-family:var(--font-heading);font-size:2rem;font-weight:800;color:#fff;margin-bottom:0.4rem;">${highlightText(scene.title)}</h1>
        ${scene.description ? `<p style="color:var(--text-muted);font-size:1rem;">${highlightText(scene.description)}</p>` : ''}
      </div>`;

    // 4-per-row image grid
    if (images.length > 0) {
      html += `<div class="scene-view-images-grid">`;
      images.forEach(img => {
        html += `
          <div class="scene-view-image-card">
            <div class="image-16-9-wrapper">
              <img src="${img.displaySrc || img.src}" alt="${escHtml(img.alt || '')}">
            </div>
            ${img.alt ? `<div class="image-alt-caption"><i class="fa-solid fa-info-circle"></i> ${highlightText(img.alt)}</div>` : ''}
            <div style="display:flex;gap:6px;padding:6px 8px;background:rgba(0,0,0,0.3);">
              <button class="btn btn-secondary btn-sm" onclick="copyImgToClipboard('${img.id}','${img.src}')" title="Copy to Clipboard">
                <i class="fa-solid fa-copy"></i> Copy
              </button>
              <a href="${img.src}" download="${escHtml(img.fileName || 'image.png')}" class="btn btn-secondary btn-sm" title="Download original quality">
                <i class="fa-solid fa-download"></i> Download
              </a>
            </div>
          </div>`;
      });
      html += `</div>`;
    }

    // Context boxes stacked
    if (contexts.length > 0) {
      html += `<div class="scene-view-contexts">`;
      contexts.forEach(ctx => {
        const cls = ctx.category === 'Technical Aspects' ? 'cat-technical' : ctx.category === 'Conversation' ? 'cat-conversation' : 'cat-narration';
        html += `
          <div class="scene-view-context-card">
            <div class="context-box-render">
              <span class="category-badge ${cls}">${escHtml(ctx.category)}</span>
              <div class="context-text-display">${highlightText(ctx.text)}</div>
            </div>
          </div>`;
      });
      html += `</div>`;
    }

    if (!images.length && !contexts.length) {
      html += `<p style="color:var(--text-dim);text-align:center;padding:3rem;">No content in this scene yet.</p>`;
    }

    sceneViewBody.innerHTML = html;
  }

  // Global clipboard copy function (for view mode buttons)
  window.copyImgToClipboard = function(imgId, fallbackSrc) {
    // Try raw blob first
    const blob = rawBlobStore[imgId];
    if (blob) {
      navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
        .then(() => showToast('Original image copied to clipboard!'))
        .catch(() => copyFromSrc(fallbackSrc));
    } else {
      copyFromSrc(fallbackSrc);
    }
  };

  function copyFromSrc(src) {
    const img = new Image(); img.crossOrigin = 'anonymous'; img.src = src;
    img.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      cv.getContext('2d').drawImage(img, 0, 0);
      cv.toBlob(blob => {
        if (blob) navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          .then(() => showToast('Image copied to clipboard!'))
          .catch(() => showToast('Clipboard copy not supported here', 'warning'));
      });
    };
  }

  function showEditMode() {
    sceneViewScreen.style.display = 'none';
    workspaceEditMode.style.display = 'flex';
  }

  btnBackFromView.addEventListener('click', () => showEditMode());
  btnEditFromView.addEventListener('click', () => {
    if (state.viewSceneId) state.activeSceneId = state.viewSceneId;
    showEditMode(); renderSidebar(); renderActiveScene();
  });

  /* ===================================================================
     CANVAS EDIT PAD
  =================================================================== */
  function getActiveScene() { return state.scenes.find(s => s.id === state.activeSceneId); }

  function renderActiveScene() {
    const scene = getActiveScene(); if (!scene) return;
    inputSceneTitle.value = scene.title;
    inputSceneDesc.value = scene.description || '';
    sceneElementsGrid.innerHTML = '';

    const hasElements = scene.elements.length > 0;
    emptyCanvasView.style.display = hasElements ? 'none' : 'flex';
    storyboardFrame.classList.toggle('has-content', hasElements);

    // Render images first (4-per-row grid)
    const images = scene.elements.filter(el => el.type === 'image');
    const contexts = scene.elements.filter(el => el.type === 'context');

    images.forEach((elem, i) => {
      const card = document.createElement('div');
      card.className = 'content-card';
      card.innerHTML = `
        <div class="content-card-header">
          <span class="content-type-tag tag-image"><i class="fa-solid fa-image"></i> IMG</span>
          <div class="content-card-actions">
            <button class="btn btn-secondary btn-sm" title="Copy to Clipboard" data-imgid="${elem.id}" data-src="${elem.src}">
              <i class="fa-solid fa-copy"></i>
            </button>
            <a href="${elem.src}" download="${escHtml(elem.fileName || 'image.png')}" class="btn btn-secondary btn-sm" title="Download original">
              <i class="fa-solid fa-download"></i>
            </a>
            <button class="btn btn-danger btn-icon btn-sm btn-remove-elem" title="Trash">
              <i class="fa-solid fa-trash-can" style="font-size:.7rem;"></i>
            </button>
          </div>
        </div>
        <div class="content-card-body">
          <div class="image-16-9-wrapper">
            <img src="${elem.displaySrc || elem.src}" alt="${escHtml(elem.alt || 'Scene Frame')}">
          </div>
          ${elem.alt ? `<div class="image-alt-caption"><i class="fa-solid fa-info-circle"></i> ${highlightText(elem.alt)}</div>` : ''}
        </div>`;

      card.querySelector('[data-imgid]').addEventListener('click', () => {
        window.copyImgToClipboard(elem.id, elem.src);
      });
      card.querySelector('.btn-remove-elem').addEventListener('click', () => {
        const idx = scene.elements.findIndex(el => el.id === elem.id);
        if (idx !== -1) { const removed = scene.elements.splice(idx, 1)[0]; pushToTrash('element', removed, scene.id); }
        renderActiveScene(); save();
      });

      sceneElementsGrid.appendChild(card);
    });

    // Then render context boxes (full-width) with inline editable textarea
    contexts.forEach((elem) => {
      const MASTER = elem.category === 'Master Prompt';
      const WORD_LIMIT = 10000;
      const CHAR_LIMIT = 3000;
      const cls = elem.category === 'Technical Aspects' ? 'cat-technical'
                : elem.category === 'Conversation' ? 'cat-conversation'
                : elem.category === 'Master Prompt' ? 'cat-master'
                : 'cat-narration';

      const card = document.createElement('div');
      card.className = 'content-card full-width';

      // Counter display initial
      const currentCount = MASTER ? (elem.text || '').length : countWords(elem.text || '');
      const limit        = MASTER ? CHAR_LIMIT : WORD_LIMIT;
      const unit         = MASTER ? 'chars' : 'words';
      const overLimit    = currentCount > limit;

      card.innerHTML = `
        <div class="content-card-header">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="content-type-tag tag-context"><i class="fa-solid fa-message"></i> ${escHtml(elem.category)}</span>
            <span class="category-badge ${cls}" style="font-size:.7rem;">${escHtml(elem.category)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="ctx-counter ${overLimit ? 'ctx-counter-over' : ''}" data-elemid="${elem.id}">${currentCount} / ${limit} ${unit}</span>
            <button class="btn btn-danger btn-icon btn-sm btn-remove-elem" title="Trash"><i class="fa-solid fa-trash-can" style="font-size:.7rem;"></i></button>
          </div>
        </div>
        <div class="content-card-body">
          <textarea
            class="ctx-inline-textarea${MASTER ? ' ctx-master' : ''}"
            data-elemid="${elem.id}"
            data-master="${MASTER}"
            placeholder="${MASTER ? 'Enter master prompt (max 3,000 characters)...' : 'Type here — auto-saves as you type...'}"
            spellcheck="true"
          >${escHtml(elem.text || '')}</textarea>
        </div>`;

      // REMOVE button
      card.querySelector('.btn-remove-elem').addEventListener('click', () => {
        const idx = scene.elements.findIndex(el => el.id === elem.id);
        if (idx !== -1) { const removed = scene.elements.splice(idx, 1)[0]; pushToTrash('element', removed, scene.id); }
        renderActiveScene(); save();
      });

      // INLINE TEXTAREA — auto-save + limit enforcement
      const ta = card.querySelector('.ctx-inline-textarea');
      const counter = card.querySelector('.ctx-counter');
      let saveTimer = null;

      ta.addEventListener('input', () => {
        const raw = ta.value;
        const count = MASTER ? raw.length : countWords(raw);
        const over  = count > limit;

        counter.textContent = `${count} / ${limit} ${unit}`;
        counter.classList.toggle('ctx-counter-over', over);

        if (over) {
          // Trim: prevent typing more
          if (MASTER) {
            ta.value = raw.slice(0, CHAR_LIMIT);
            showToast(`Master Prompt limit: ${CHAR_LIMIT} characters max!`, 'warning');
          } else {
            // Trim to word limit
            const trimmed = trimToWordLimit(raw, WORD_LIMIT);
            ta.value = trimmed;
            const newCount = countWords(trimmed);
            counter.textContent = `${newCount} / ${limit} ${unit}`;
            counter.classList.remove('ctx-counter-over');
            showToast(`Limit: ${WORD_LIMIT} words max!`, 'warning');
          }
        }

        // Debounced auto-save
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          const el = state.scenes.flatMap(s => s.elements).find(el => el.id === elem.id);
          if (el) { el.text = ta.value; save(); }
        }, 600);
      });

      // Paste intercept for big pastes
      ta.addEventListener('paste', (e) => {
        const pasted = e.clipboardData.getData('text');
        const currentText = ta.value;
        if (MASTER) {
          const combined = currentText + pasted;
          if (combined.length > CHAR_LIMIT) {
            e.preventDefault();
            const available = CHAR_LIMIT - currentText.length;
            if (available > 0) ta.value = currentText + pasted.slice(0, available);
            showToast(`Master Prompt limited to ${CHAR_LIMIT} characters!`, 'warning');
            // trigger input event to sync
            ta.dispatchEvent(new Event('input'));
          }
        } else {
          const combinedWords = countWords(currentText + ' ' + pasted);
          if (combinedWords > WORD_LIMIT) {
            e.preventDefault();
            const currentWords = countWords(currentText);
            const allowedExtra = WORD_LIMIT - currentWords;
            if (allowedExtra > 0) {
              const extraWords = pasted.trim().split(/\s+/).slice(0, allowedExtra).join(' ');
              ta.value = currentText ? currentText + ' ' + extraWords : extraWords;
            }
            showToast(`Exceeds ${WORD_LIMIT} word limit! Trimmed to fit.`, 'warning');
            ta.dispatchEvent(new Event('input'));
          }
        }
      });

      sceneElementsGrid.appendChild(card);
    });
  }

  inputSceneTitle.addEventListener('input', () => {
    const s = getActiveScene(); if (!s) return;
    s.title = inputSceneTitle.value; renderSidebar(); save();
  });
  inputSceneDesc.addEventListener('input', () => {
    const s = getActiveScene(); if (!s) return;
    s.description = inputSceneDesc.value; save();
  });

  /* ===================================================================
     ADD CONTENT
  =================================================================== */
  btnCanvasAddContent.addEventListener('click', () => openModal(modalContentType));
  optSelectImage.addEventListener('click', () => { closeModal(modalContentType); pendingDropImages = []; dropZonePreview.innerHTML = ''; dropZonePreview.style.display = 'none'; openModal(modalAddImage); });
  optSelectContext.addEventListener('click', () => { closeModal(modalContentType); openModal(modalAddContext); });

  /* ---- IMAGE FORM SUBMIT ---- */
  formAddImage.addEventListener('submit', async e => {
    e.preventDefault();
    const scene = getActiveScene(); if (!scene) return;
    const alt = inputImageAlt.value.trim();
    let added = 0;

    // A) Pending drop/paste images
    for (const pImg of pendingDropImages) {
      const elemId = `img_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
      rawBlobStore[elemId] = pImg.blob;
      scene.elements.push({ id: elemId, type: 'image', src: pImg.dataUrl, displaySrc: pImg.dataUrl, fileName: pImg.fileName, alt });
      added++;
    }

    // B) File upload (if no pending drops)
    if (!pendingDropImages.length && inputFileImage.files[0]) {
      const file = inputFileImage.files[0];
      if (!validateSize(file)) return;
      const result = await readFileAsDataUrl(file);
      const elemId = `img_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
      rawBlobStore[elemId] = file;
      scene.elements.push({ id: elemId, type: 'image', src: result, displaySrc: result, fileName: file.name, alt });
      added++;
    }

    // C) URL
    const url = inputUrlImage.value.trim();
    if (!added && url) {
      const elemId = `img_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
      scene.elements.push({ id: elemId, type: 'image', src: url, displaySrc: url, fileName: 'web_image.png', alt });
      added++;
    }

    if (!added) { showToast('Please add an image (drop, paste, browse, or URL)!', 'warning'); return; }

    inputFileImage.value = ''; inputUrlImage.value = ''; inputImageAlt.value = '';
    pendingDropImages = []; dropZonePreview.innerHTML = ''; dropZonePreview.style.display = 'none';
    closeModal(modalAddImage); renderActiveScene(); save();
    showToast(`${added} image${added > 1 ? 's' : ''} added!`);
  });

  /* ---- CONTEXT FORM SUBMIT — just pick category, inline edit in scene ---- */
  formAddContext.addEventListener('submit', e => {
    e.preventDefault();
    const scene = getActiveScene(); if (!scene) return;
    const category = selectContextCategory.value;
    const elemId   = `ctx_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
    scene.elements.push({ id: elemId, type: 'context', category, text: '' });
    closeModal(modalAddContext); renderActiveScene(); save();
    // Focus the new textarea so user can start typing immediately
    setTimeout(() => {
      const newTa = sceneElementsGrid.querySelector(`textarea[data-elemid='${elemId}']`);
      if (newTa) newTa.focus();
    }, 80);
    showToast(`${category} box added — type directly in the scene!`);
  });

  // Update info text in modal when category changes
  selectContextCategory.addEventListener('change', () => {
    const isMaster = selectContextCategory.value === 'Master Prompt';
    const limitText = document.getElementById('context-limit-text');
    if (limitText) {
      limitText.innerHTML = isMaster
        ? `<strong>Master Prompt</strong> — limited to <strong>3,000 characters</strong>. Text is typed directly in the scene.`
        : `Narration / Technical / Conversation — up to <strong>10,000 words</strong>. Text is typed directly in the scene.`;
    }
  });

  /* ===================================================================
     DRAG & DROP + CLIPBOARD PASTE ON DROP ZONE
  =================================================================== */
  function setupDropZone() {
    if (!imageDropZone) return;

    // Click to browse
    btnBrowseFile.addEventListener('click', () => inputFileImage.click());
    inputFileImage.addEventListener('change', () => {
      for (const file of inputFileImage.files) {
        if (!validateSize(file)) return;
        queueFileForDrop(file);
      }
    });

    // Drag events
    imageDropZone.addEventListener('dragover', e => { e.preventDefault(); imageDropZone.classList.add('drag-over'); });
    imageDropZone.addEventListener('dragleave', () => imageDropZone.classList.remove('drag-over'));
    imageDropZone.addEventListener('drop', e => {
      e.preventDefault(); imageDropZone.classList.remove('drag-over');
      const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
      const items = [...e.dataTransfer.items];
      if (files.length > 0) {
        files.forEach(f => { if (!validateSize(f)) return; queueFileForDrop(f); });
      } else {
        // Try image from items
        items.forEach(item => {
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            const f = item.getAsFile(); if (f && validateSize(f)) queueFileForDrop(f);
          }
        });
      }
    });

    // Paste from clipboard (on the modal, not the whole window, to avoid conflicts)
    modalAddImage.addEventListener('paste', e => {
      const items = [...e.clipboardData.items].filter(i => i.type.startsWith('image/'));
      if (!items.length) return;
      items.forEach(item => {
        const blob = item.getAsFile(); if (blob && validateSize(blob)) queueFileForDrop(blob, 'pasted_image.png');
      });
      e.preventDefault();
    });
  }

  async function queueFileForDrop(file, nameOverride) {
    const dataUrl = await readFileAsDataUrl(file);
    const entry = { dataUrl, blob: file, fileName: nameOverride || file.name };
    pendingDropImages.push(entry);

    // Show thumbnail preview in drop zone
    const img = document.createElement('img');
    img.src = dataUrl; img.className = 'drop-zone-preview-img'; img.title = entry.fileName;
    dropZonePreview.appendChild(img);
    dropZonePreview.style.display = 'flex';
  }

  function readFileAsDataUrl(file) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = e => res(e.target.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  function validateSize(file) {
    const MAX = 20 * 1024 * 1024; // 20 MB
    if (file.size > MAX) { showToast(`File "${file.name}" exceeds 20 MB limit!`, 'warning'); return false; }
    return true;
  }

  /* ===================================================================
     SKETCH PAD
  =================================================================== */
  function setupSketchPad() {
    if (!sketchCanvas || !ctx) return;
    const getPos = e => {
      const r = sketchCanvas.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: cx - r.left, y: cy - r.top };
    };
    const start = e => { isDrawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const draw  = e => {
      if (!isDrawing) return; e.preventDefault();
      const p = getPos(e); ctx.strokeStyle = sketchColor.value; ctx.lineWidth = sketchSize.value;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineTo(p.x, p.y); ctx.stroke();
    };
    const stop = () => { isDrawing = false; };
    sketchCanvas.addEventListener('mousedown', start); sketchCanvas.addEventListener('mousemove', draw);
    sketchCanvas.addEventListener('mouseup', stop); sketchCanvas.addEventListener('mouseleave', stop);
    sketchCanvas.addEventListener('touchstart', start); sketchCanvas.addEventListener('touchmove', draw); sketchCanvas.addEventListener('touchend', stop);

    btnClearSketch.addEventListener('click', clearSketch);
    btnOpenSketch.addEventListener('click', () => { closeModal(modalAddImage); openModal(modalSketchPad); clearSketch(); });
    btnSaveSketch.addEventListener('click', () => {
      sketchCanvas.toBlob(blob => {
        const scene = getActiveScene(); if (!scene) return;
        const elemId = `img_${Date.now()}_sketch`;
        const dataUrl = sketchCanvas.toDataURL('image/png');
        rawBlobStore[elemId] = blob;
        scene.elements.push({ id: elemId, type: 'image', src: dataUrl, displaySrc: dataUrl, fileName: 'doodle.png', alt: 'Sketch Doodle' });
        closeModal(modalSketchPad); renderActiveScene(); save(); showToast('Sketch saved!');
      }, 'image/png');
    });
  }

  function clearSketch() {
    if (ctx && sketchCanvas) { ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, sketchCanvas.width, sketchCanvas.height); }
  }

  /* ===================================================================
     GLOBAL LIVE SEARCH
  =================================================================== */
  inputGlobalSearch.addEventListener('input', () => {
    state.searchQuery = inputGlobalSearch.value.trim();
    btnClearSearch.style.display = state.searchQuery ? 'inline-block' : 'none';
    if (state.searchQuery) {
      const match = state.scenes.find(sc =>
        sc.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        (sc.description||'').toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        sc.elements.some(el => (el.text||'').toLowerCase().includes(state.searchQuery.toLowerCase()) || (el.alt||'').toLowerCase().includes(state.searchQuery.toLowerCase()))
      );
      if (match && match.id !== state.activeSceneId) state.activeSceneId = match.id;
    }
    renderSidebar(); renderActiveScene();
    if (state.viewSceneId) openSceneView(state.viewSceneId);
  });

  btnClearSearch.addEventListener('click', () => {
    inputGlobalSearch.value = ''; state.searchQuery = ''; btnClearSearch.style.display = 'none';
    renderSidebar(); renderActiveScene();
  });

  /* ===================================================================
     TRASH BIN
  =================================================================== */
  function pushToTrash(type, data, sceneId) {
    state.trash.push({ id: `trash_${Date.now()}`, type, data, sceneId, deletedAt: new Date().toLocaleTimeString() });
  }

  btnOpenTrash.addEventListener('click', () => { renderTrashItems(); openModal(modalTrashBin); });

  function renderTrashItems() {
    trashItemsContainer.innerHTML = '';
    if (!state.trash.length) {
      trashItemsContainer.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:2rem;">Trash is empty.</p>'; return;
    }
    state.trash.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'scene-item';
      const label = item.type === 'scene' ? `Scene: ${item.data.title}` : `Element (${item.data.type || item.data.category || 'image'})`;
      row.innerHTML = `
        <div class="scene-item-top">
          <span style="font-weight:600;color:#fff;font-size:.9rem;">${escHtml(label)}</span>
          <span style="font-size:.78rem;color:var(--text-dim);">${item.deletedAt}</span>
        </div>
        <div class="scene-item-actions">
          <button class="btn btn-secondary btn-sm btn-restore"><i class="fa-solid fa-rotate-left" style="color:var(--accent-emerald);"></i> Restore</button>
          <button class="btn btn-danger btn-sm btn-purge"><i class="fa-solid fa-xmark"></i> Purge</button>
        </div>`;
      row.querySelector('.btn-restore').addEventListener('click', () => {
        state.trash.splice(idx, 1);
        if (item.type === 'scene') { state.scenes.push(item.data); state.activeSceneId = item.data.id; }
        else if (item.type === 'element') {
          const sc = state.scenes.find(s => s.id === item.sceneId) || getActiveScene();
          if (sc) sc.elements.push(item.data);
        }
        renderTrashItems(); renderSidebar(); renderActiveScene(); save(); showToast('Restored from Trash');
      });
      row.querySelector('.btn-purge').addEventListener('click', () => {
        state.trash.splice(idx, 1); renderTrashItems(); save(); showToast('Permanently purged');
      });
      trashItemsContainer.appendChild(row);
    });
  }

  btnEmptyTrash.addEventListener('click', () => {
    if (!state.trash.length || !confirm('Permanently purge all trash? Cannot be undone.')) return;
    state.trash = []; renderTrashItems(); save(); showToast('Trash emptied!');
  });

  /* ===================================================================
     PRESENTATION MODE
  =================================================================== */
  btnNavPresent.addEventListener('click', () => {
    if (!state.scenes.length) { showToast('Add scenes first!', 'warning'); return; }
    state.presentIndex = 0;
    presentStoryTitle.textContent = state.storyName;
    presentTotalScenes.textContent = state.scenes.length;
    openModal(modalPresentation); renderPresentSlide();
  });

  function renderPresentSlide() {
    const scene = state.scenes[state.presentIndex]; if (!scene) return;
    presentCurrentIdx.textContent = state.presentIndex + 1;
    const imgs = scene.elements.filter(el => el.type === 'image');
    const ctxs = scene.elements.filter(el => el.type === 'context');
    let html = `<h2 style="font-family:var(--font-heading);font-size:1.8rem;color:#fff;margin-bottom:.5rem;">${escHtml(scene.title)}</h2>`;
    if (scene.description) html += `<p style="color:var(--text-muted);margin-bottom:1rem;">${escHtml(scene.description)}</p>`;
    if (imgs.length) {
      html += `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:1rem;">`;
      imgs.forEach(img => { html += `<div class="image-16-9-wrapper" style="border-radius:8px;"><img src="${img.displaySrc || img.src}" alt="${escHtml(img.alt||'')}"></div>`; });
      html += `</div>`;
    }
    ctxs.forEach(c => {
      html += `<div style="border-left:4px solid var(--primary);padding:10px 14px;background:rgba(0,0,0,.3);border-radius:0 8px 8px 0;margin-bottom:8px;">
        <small style="color:var(--accent-cyan);font-weight:700;">${escHtml(c.category)}</small>
        <p style="color:#fff;margin-top:4px;">${escHtml(c.text)}</p></div>`;
    });
    if (!imgs.length && !ctxs.length) html += `<p style="color:var(--text-dim);text-align:center;padding:2rem;">No content in this scene.</p>`;
    presentSlideContent.innerHTML = html;
  }

  btnPresentPrev.addEventListener('click', () => { if (state.presentIndex > 0) { state.presentIndex--; renderPresentSlide(); } });
  btnPresentNext.addEventListener('click', () => { if (state.presentIndex < state.scenes.length - 1) { state.presentIndex++; renderPresentSlide(); } });
  document.addEventListener('keydown', e => {
    if (modalPresentation.classList.contains('active')) {
      if (e.key === 'ArrowLeft') btnPresentPrev.click();
      if (e.key === 'ArrowRight') btnPresentNext.click();
      if (e.key === 'Escape') closeModal(modalPresentation);
    }
  });

  /* ===================================================================
     EXPORT
  =================================================================== */
  btnNavExportJson.addEventListener('click', () => {
    const data = JSON.stringify({ storyName: state.storyName, genre: state.genre, scenes: state.scenes }, null, 2);
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(data);
    a.download = `${state.storyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_storyboard.json`;
    a.click(); showToast('JSON exported!');
  });

  /* ===================================================================
     HELPERS
  =================================================================== */
  function openModal(m)  { if (m) m.classList.add('active'); }
  function closeModal(m) { if (m) m.classList.remove('active'); }

  function setupModalClose() {
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', e => { const ov = e.target.closest('.modal-overlay'); if (ov) closeModal(ov); });
    });
  }

  function setupEventListeners() {
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.addEventListener('click', e => { if (e.target === m) closeModal(m); });
    });
  }

  function highlightText(str) {
    if (!str) return '';
    const safe = escHtml(str);
    if (!state.searchQuery) return safe;
    const q = escHtml(state.searchQuery);
    return safe.replace(new RegExp(`(${escRegex(q)})`, 'gi'), '<mark class="search-highlight">$1</mark>');
  }

  function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
  }

  function escRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function showToast(msg, type = 'info') {
    const c = document.getElementById('toast-container'); if (!c) return;
    const t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = `<i class="fa-solid ${type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-check'}" style="color:${type === 'warning' ? 'var(--accent-amber)' : 'var(--accent-emerald)'}"></i> ${escHtml(msg)}`;
    c.appendChild(t); setTimeout(() => t.remove(), 3200);
  }

  function countWords(str) {
    if (!str || !str.trim()) return 0;
    return str.trim().split(/\s+/).length;
  }

  function trimToWordLimit(str, limit) {
    const words = str.trim().split(/\s+/);
    return words.slice(0, limit).join(' ');
  }

  init();
});
