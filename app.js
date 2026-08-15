/**
 * Storyboard Studio — app.js
 * Features: Multi-story management gallery with scrollbar, View & Story Edit modes,
 *           Landing page ADD STORY & STORIES navigation, Back buttons,
 *           Image with Prompt & Video with Prompt (3,000 char prompt cap, 1 GB media limit),
 *           Top & Bottom dual copy buttons for context & prompt boxes,
 *           full-page Scene View, 4-per-row 16:9 images, 3-per-row 16:9 videos,
 *           drag & drop + paste upload, trash bin, live search.
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ===================================================================
     STATE
  =================================================================== */
  const state = {
    stories: [],              // Array of all saved storyboards: [{id, storyName, genre, scenes: [], trash: [], updatedAt}]
    activeStoryId: null,      // Current active story ID
    storyName: 'Untitled Storyboard',
    genre: '',
    scenes: [],
    trash: [],
    activeSceneId: null,
    viewSceneId: null,        // which scene we are currently viewing
    viewModeSource: 'editor', // 'editor' or 'stories'
    presentIndex: 0,
    searchQuery: '',
    storiesSearchQuery: '',
    promptMode: false,        // whether current media modal was opened in Prompt mode
    tasks: [],                // Array of tasks: [{id, text, completed}]
    notes: ''                 // Free-text notes
  };

  // Raw Blob store — keyed by element id — never serialised to localStorage
  const rawBlobStore = {};

  /* ===================================================================
     DOM REFERENCES
  =================================================================== */
  const landingScreen          = document.getElementById('landing-screen');
  const storiesScreen          = document.getElementById('stories-screen');
  const appScreen              = document.getElementById('app-screen');
  const workspaceEditMode      = document.getElementById('workspace-edit-mode');
  const sceneViewScreen        = document.getElementById('scene-view-screen');
  const btnBackFromView        = document.getElementById('btn-back-from-view');
  const btnEditFromView        = document.getElementById('btn-edit-from-view');
  const sceneViewBreadcrumb    = document.getElementById('scene-view-breadcrumb');
  const sceneViewBody          = document.getElementById('scene-view-body');

  const btnHeroAddStory        = document.getElementById('btn-hero-add-story');
  const btnHeroStories         = document.getElementById('btn-hero-stories');
  const landingStoriesCount    = document.getElementById('landing-stories-count');
  const btnBackToHomeFromStories= document.getElementById('btn-back-to-home-from-stories');
  const btnStoriesAddNew       = document.getElementById('btn-stories-add-new');
  const inputStoriesSearch     = document.getElementById('input-stories-search');
  const storiesGridContainer   = document.getElementById('stories-grid-container');
  const storiesTotalBadge      = document.getElementById('stories-total-badge');
  const btnNavStoriesList      = document.getElementById('btn-nav-stories-list');

  const displayStoryName       = document.getElementById('display-story-name');
  const inputGlobalSearch      = document.getElementById('input-global-search');
  const btnClearSearch         = document.getElementById('btn-clear-search');
  const btnOpenTrash           = document.getElementById('btn-open-trash');
  const trashCount             = document.getElementById('trash-count');

  const sidebarSceneList       = document.getElementById('sidebar-scene-list');
  const sceneCountBadge        = document.getElementById('scene-count-badge');
  const btnSidebarAddScene     = document.getElementById('btn-sidebar-add-scene');

  const inputSceneTitle        = document.getElementById('input-scene-title');
  const inputSceneDesc         = document.getElementById('input-scene-desc');
  const storyboardFrame        = document.getElementById('storyboard-frame');
  const emptyCanvasView        = document.getElementById('empty-canvas-view');
  const sceneElementsGrid      = document.getElementById('scene-elements-grid');
  const btnCanvasAddContent    = document.getElementById('btn-canvas-add-content');

  // Modals
  const modalStorySetup        = document.getElementById('modal-story-setup');
  const formStorySetup         = document.getElementById('form-story-setup');
  const inputStoryName         = document.getElementById('input-story-name');
  const inputStoryGenre        = document.getElementById('input-story-genre');

  const modalAddScene          = document.getElementById('modal-add-scene');
  const formAddScene           = document.getElementById('form-add-scene');
  const inputNewSceneName      = document.getElementById('input-new-scene-name');

  const modalContentType       = document.getElementById('modal-content-type');
  const optSelectImage         = document.getElementById('opt-select-image');
  const optSelectVideo         = document.getElementById('opt-select-video');
  const optSelectContext       = document.getElementById('opt-select-context');
  const optSelectImagePrompt   = document.getElementById('opt-select-image-prompt');
  const optSelectVideoPrompt   = document.getElementById('opt-select-video-prompt');

  const modalAddImage          = document.getElementById('modal-add-image');
  const modalImageTitle        = document.getElementById('modal-image-title');
  const formAddImage           = document.getElementById('form-add-image');
  const inputImageAlt          = document.getElementById('input-image-alt');
  const inputFileImage         = document.getElementById('input-file-image');
  const inputUrlImage          = document.getElementById('input-url-image');
  const btnBrowseFile          = document.getElementById('btn-browse-file');
  const btnOpenSketch          = document.getElementById('btn-open-sketch');
  const imageDropZone          = document.getElementById('image-drop-zone');
  const dropZonePreview        = document.getElementById('drop-zone-preview');
  const groupImagePrompt       = document.getElementById('group-image-prompt');
  const inputImagePrompt       = document.getElementById('input-image-prompt');
  const promptImgCharCount     = document.getElementById('prompt-img-char-count');

  const modalAddVideo          = document.getElementById('modal-add-video');
  const modalVideoTitle        = document.getElementById('modal-video-title');
  const formAddVideo           = document.getElementById('form-add-video');
  const inputVideoAlt          = document.getElementById('input-video-alt');
  const inputFileVideo         = document.getElementById('input-file-video');
  const inputUrlVideo          = document.getElementById('input-url-video');
  const btnBrowseVideoFile     = document.getElementById('btn-browse-video-file');
  const videoDropZone          = document.getElementById('video-drop-zone');
  const videoDropZonePreview    = document.getElementById('video-drop-zone-preview');
  const groupVideoPrompt       = document.getElementById('group-video-prompt');
  const inputVideoPrompt       = document.getElementById('input-video-prompt');
  const promptVideoCharCount   = document.getElementById('prompt-video-char-count');

  const modalAddContext        = document.getElementById('modal-add-context');
  const formAddContext         = document.getElementById('form-add-context');
  const selectContextCategory  = document.getElementById('select-context-category');

  const modalSketchPad         = document.getElementById('modal-sketch-pad');
  const sketchCanvas           = document.getElementById('sketch-canvas');
  const sketchColor            = document.getElementById('sketch-color');
  const sketchSize             = document.getElementById('sketch-size');
  const btnClearSketch         = document.getElementById('btn-clear-sketch');
  const btnSaveSketch          = document.getElementById('btn-save-sketch');
  let   isDrawing              = false;
  const ctx                    = sketchCanvas ? sketchCanvas.getContext('2d') : null;

  const modalTrashBin          = document.getElementById('modal-trash-bin');
  const trashItemsContainer    = document.getElementById('trash-items-container');
  const btnEmptyTrash          = document.getElementById('btn-empty-trash');

  const modalExpandText        = document.getElementById('modal-expand-text');
  const modalExpandTitle       = document.getElementById('modal-expand-title');
  const modalExpandContent     = document.getElementById('modal-expand-content');
  const modalExpandMeta        = document.getElementById('modal-expand-meta');
  const btnModalExpandCopy     = document.getElementById('btn-modal-expand-copy');
  let   activeExpandText       = '';

  const modalPresentation      = document.getElementById('modal-presentation');
  const btnNavPresent          = document.getElementById('btn-nav-present');
  const presentStoryTitle      = document.getElementById('present-story-title');
  const presentCurrentIdx      = document.getElementById('present-current-index');
  const presentTotalScenes     = document.getElementById('present-total-scenes');
  const presentSlideContent    = document.getElementById('present-slide-content');
  const btnPresentPrev         = document.getElementById('btn-present-prev');
  const btnPresentNext         = document.getElementById('btn-present-next');

  const btnNavExportJson       = document.getElementById('btn-nav-export-json');
  const btnNavNew              = document.getElementById('btn-nav-new');

  // Pending images/videos queued in drop zone before form submit
  let pendingDropImages        = [];
  let pendingDropVideos        = [];

  /* ===================================================================
     INIT & STORAGE MANAGEMENT
  =================================================================== */
  function init() {
    setupModalClose();
    setupSketchPad();
    setupDropZone();
    setupVideoDropZone();
    setupEventListeners();
    setupPromptCharacterCounters();
    setupTasksNotes();

    loadAllStories();
  }

  async function loadAllStories() {
    // 1. Load local cache first for instant UI response
    const rawAll = localStorage.getItem('storyboard_studio_all_stories');
    let loaded = [];
    if (rawAll) {
      try { loaded = JSON.parse(rawAll) || []; } catch(e) { console.error(e); }
    }

    // Migration check: legacy single storyboard key
    const legacy = localStorage.getItem('storyboard_studio_data');
    if (legacy && loaded.length === 0) {
      try {
        const parsed = JSON.parse(legacy);
        if (parsed && parsed.scenes && parsed.scenes.length > 0) {
          const legacyStory = {
            id: `story_${Date.now()}`,
            storyName: parsed.storyName || 'Saved Storyboard',
            genre: parsed.genre || '',
            scenes: parsed.scenes,
            trash: parsed.trash || [],
            updatedAt: new Date().toISOString()
          };
          loaded.push(legacyStory);
        }
      } catch(e) { console.error(e); }
    }

    state.stories = loaded;
    updateLandingBadges();

    // 2. Fetch cloud server persistent stories from promptee.site (api.php)
    try {
      const res = await fetch('api.php?t=' + Date.now()); // Prevent GET caching across devices
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.stories)) {
          if (data.stories.length > 0) {
            // Server is the Single Source of Truth for all devices!
            state.stories = data.stories;
          } else if (state.stories.length > 0) {
            // First time setup: if server is empty but local has stories, push local stories to server
            await syncStoriesToServer();
          }

          localStorage.setItem('storyboard_studio_all_stories', JSON.stringify(state.stories));
          updateLandingBadges();

          // Refresh current views if active
          if (storiesScreen && storiesScreen.classList.contains('active')) {
            renderStoriesList();
          }
          if (state.activeStoryId) {
            const found = state.stories.find(s => s.id === state.activeStoryId);
            if (found) {
              loadStoryToState(state.activeStoryId);
              if (appScreen && appScreen.classList.contains('active')) {
                renderActiveScene();
              }
            } else {
              state.activeStoryId = null;
            }
          }
        }
      }
    } catch (err) {
      console.log('Server cloud persistence sync offline or fallback.', err);
    }
  }

  function updateLandingBadges() {
    if (landingStoriesCount) landingStoriesCount.textContent = state.stories.length;
    if (storiesTotalBadge) storiesTotalBadge.textContent = state.stories.length;
  }

  let serverSaveDebounce = null;
  const cloudSaveStatus = document.getElementById('cloud-save-status');

  function updateCloudStatus(statusText, type) {
    if (!cloudSaveStatus) return;
    if (type === 'saving') {
      cloudSaveStatus.className = 'cloud-save-badge saving';
      cloudSaveStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    } else if (type === 'offline') {
      cloudSaveStatus.className = 'cloud-save-badge offline';
      cloudSaveStatus.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Saved Locally';
    } else {
      cloudSaveStatus.className = 'cloud-save-badge';
      cloudSaveStatus.innerHTML = '<i class="fa-solid fa-cloud-check"></i> Auto-Saved';
    }
  }

  function save() {
    if (!state.activeStoryId) {
      state.activeStoryId = `story_${Date.now()}`;
    }

    let current = state.stories.find(s => s.id === state.activeStoryId);
    if (!current) {
      current = {
        id: state.activeStoryId,
        storyName: state.storyName,
        genre: state.genre,
        scenes: state.scenes,
        trash: state.trash,
        tasks: state.tasks,
        notes: state.notes,
        updatedAt: new Date().toISOString()
      };
      state.stories.push(current);
    } else {
      current.storyName = state.storyName;
      current.genre = state.genre;
      current.scenes = state.scenes;
      current.trash = state.trash;
      current.tasks = state.tasks;
      current.notes = state.notes;
      current.updatedAt = new Date().toISOString();
    }

    // Protect against LocalStorage QuotaExceededError crashes
    try {
      localStorage.setItem('storyboard_studio_all_stories', JSON.stringify(state.stories));
      localStorage.setItem('storyboard_studio_data', JSON.stringify({ storyName: state.storyName, genre: state.genre, scenes: state.scenes, trash: state.trash }));
    } catch (quotaErr) {
      console.warn('LocalStorage quota limit reached — server persistence handles storage.', quotaErr);
    }

    updateTrashBadge();
    updateLandingBadges();
    updateCloudStatus('Saving...', 'saving');

    // Debounced async push to promptee.site cloud hosting server
    clearTimeout(serverSaveDebounce);
    serverSaveDebounce = setTimeout(() => {
      syncStoriesToServer();
    }, 300);
  }

  async function syncStoriesToServer() {
    try {
      const res = await fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_all', stories: state.stories })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          updateCloudStatus('Auto-Saved', 'saved');
        } else {
          updateCloudStatus('Saved Locally', 'offline');
        }
      } else {
        updateCloudStatus('Saved Locally', 'offline');
      }
    } catch (e) {
      console.warn('Server cloud save warning:', e);
      updateCloudStatus('Saved Locally', 'offline');
    }
  }

  window.addEventListener('beforeunload', () => { save(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });

  function loadStoryToState(storyId) {
    const s = state.stories.find(item => item.id === storyId);
    if (!s) return false;
    state.activeStoryId = s.id;
    state.storyName = s.storyName || 'Untitled Storyboard';
    state.genre = s.genre || '';
    state.scenes = s.scenes || [];
    state.trash = s.trash || [];
    state.tasks = s.tasks || [];
    state.notes = s.notes || '';
    state.activeSceneId = s.scenes && s.scenes.length > 0 ? s.scenes[0].id : null;
    return true;
  }

  function updateTrashBadge() { if (trashCount) trashCount.textContent = state.trash.length; }

  /* ===================================================================
     SCREEN NAVIGATION CONTROLLERS
  =================================================================== */
  function hideAllScreens() {
    landingScreen.classList.remove('active');
    storiesScreen.classList.remove('active');
    appScreen.classList.remove('active');
  }

  function openStoriesGallery() {
    hideAllScreens();
    storiesScreen.classList.add('active');
    renderStoriesList();
  }

  function openWorkspace() {
    hideAllScreens();
    appScreen.classList.add('active');
    showEditMode();
    displayStoryName.textContent = state.storyName;
    renderSidebar();
    renderActiveScene();
  }

  /* ===================================================================
     LANDING & STORIES GALLERY EVENT LISTENERS
  =================================================================== */
  // Legacy alias + new ADD STORY button
  const btnHeroStart = document.getElementById('btn-hero-start');
  if (btnHeroStart) {
    btnHeroStart.addEventListener('click', () => {
      inputStoryName.value = '';
      inputStoryGenre.value = '';
      openModal(modalStorySetup);
      inputStoryName.focus();
    });
  }

  if (btnHeroAddStory) {
    btnHeroAddStory.addEventListener('click', () => {
      inputStoryName.value = '';
      inputStoryGenre.value = '';
      openModal(modalStorySetup);
      inputStoryName.focus();
    });
  }

  if (btnHeroStories) {
    btnHeroStories.addEventListener('click', () => openStoriesGallery());
  }

  if (btnBackToHomeFromStories) {
    btnBackToHomeFromStories.addEventListener('click', () => {
      hideAllScreens();
      landingScreen.classList.add('active');
    });
  }

  if (btnStoriesAddNew) {
    btnStoriesAddNew.addEventListener('click', () => {
      inputStoryName.value = '';
      inputStoryGenre.value = '';
      openModal(modalStorySetup);
      inputStoryName.focus();
    });
  }

  if (btnNavStoriesList) {
    btnNavStoriesList.addEventListener('click', () => openStoriesGallery());
  }

  if (inputStoriesSearch) {
    inputStoriesSearch.addEventListener('input', () => {
      state.storiesSearchQuery = inputStoriesSearch.value.trim();
      renderStoriesList();
    });
  }

  if (formStorySetup) {
    formStorySetup.addEventListener('submit', e => {
      e.preventDefault();
      const name = inputStoryName.value.trim(); if (!name) return;

      state.activeStoryId = `story_${Date.now()}`;
      state.storyName = name;
      state.genre = inputStoryGenre.value.trim();
      state.scenes = [];
      state.trash = [];
      state.tasks = [];
      state.notes = '';

      const initialScene = makeScene('Scene 1 — Establishing Shot');
      state.scenes.push(initialScene);
      state.activeSceneId = initialScene.id;

      closeModal(modalStorySetup);
      save();
      openWorkspace();
      showToast(`Storyboard "${state.storyName}" created!`);
    });
  }

  /* ===================================================================
     STORIES GALLERY LIST RENDERER
  =================================================================== */
  function renderStoriesList() {
    storiesGridContainer.innerHTML = '';
    const query = (state.storiesSearchQuery || '').toLowerCase();
    const filtered = state.stories.filter(s =>
      (s.storyName || '').toLowerCase().includes(query) ||
      (s.genre || '').toLowerCase().includes(query)
    );

    updateLandingBadges();

    if (filtered.length === 0) {
      storiesGridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-dim);">
          <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; color: var(--accent-cyan);"></i>
          <h3 style="color: var(--text-muted); font-family: var(--font-heading); margin-bottom: 0.5rem;">No Stories Found</h3>
          <p style="font-size: 0.9rem;">${state.stories.length === 0 ? 'You have not created any storyboards yet.' : 'No saved stories match your search criteria.'}</p>
          <button class="btn btn-primary" id="btn-empty-create-story" style="margin-top: 1.25rem;">
            <i class="fa-solid fa-plus-circle"></i> Create Story
          </button>
        </div>`;
      const emptyBtn = document.getElementById('btn-empty-create-story');
      if (emptyBtn) emptyBtn.addEventListener('click', () => openModal(modalStorySetup));
      return;
    }

    filtered.forEach(story => {
      const card = document.createElement('div');
      card.className = 'story-card';
      const dateStr = story.updatedAt
        ? new Date(story.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Recently';
      const sceneCount = story.scenes ? story.scenes.length : 0;

      card.innerHTML = `
        <div>
          <div class="story-card-header">
            <div class="story-card-title">${escHtml(story.storyName || 'Untitled Story')}</div>
          </div>
          ${story.genre ? `<span class="story-card-genre">${escHtml(story.genre)}</span>` : ''}
          <div class="story-card-stats" style="margin-top: 12px;">
            <span><i class="fa-solid fa-clapperboard" style="color: var(--accent-cyan);"></i> ${sceneCount} Scene${sceneCount !== 1 ? 's' : ''}</span>
            <span><i class="fa-solid fa-clock" style="color: var(--text-dim);"></i> ${dateStr}</span>
          </div>
        </div>
        <div class="story-card-actions">
          <button class="btn btn-secondary btn-sm btn-story-view" style="flex: 1;"><i class="fa-solid fa-eye" style="color: var(--accent-cyan);"></i> VIEW</button>
          <button class="btn btn-primary btn-sm btn-story-edit" style="flex: 1;"><i class="fa-solid fa-pen-to-square"></i> STORY EDIT</button>
          <button class="btn btn-danger btn-icon btn-sm btn-story-delete" title="Delete Story"><i class="fa-solid fa-trash-can" style="font-size: .75rem;"></i></button>
        </div>`;

      // VIEW button: opens in full Scene View mode
      card.querySelector('.btn-story-view').addEventListener('click', () => {
        loadStoryToState(story.id);
        if (state.scenes.length > 0) {
          openSceneView(state.scenes[0].id, 'stories');
        } else {
          showToast('This story has no scenes yet!', 'warning');
        }
      });

      // STORY EDIT button: opens directly in workspace editor
      card.querySelector('.btn-story-edit').addEventListener('click', () => {
        loadStoryToState(story.id);
        openWorkspace();
      });

      // DELETE button
      card.querySelector('.btn-story-delete').addEventListener('click', async () => {
        if (!confirm(`Delete story "${story.storyName}" permanently?`)) return;
        state.stories = state.stories.filter(s => s.id !== story.id);
        if (state.activeStoryId === story.id) state.activeStoryId = null;
        localStorage.setItem('storyboard_studio_all_stories', JSON.stringify(state.stories));
        renderStoriesList();
        showToast('Story deleted');
        try {
          await fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_story', id: story.id })
          });
        } catch(e) {}
      });

      storiesGridContainer.appendChild(card);
    });
  }

  btnNavNew.addEventListener('click', () => {
    if (!confirm('Start a new story? Your existing work is saved in Stories.')) return;
    inputStoryName.value = '';
    inputStoryGenre.value = '';
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

      item.querySelector('.btn-view-scene').addEventListener('click', e => { e.stopPropagation(); openSceneView(scene.id, 'editor'); });
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
     FULL-PAGE SCENE VIEW (WITH DUAL COPY BUTTONS & PROMPT SUPPORT)
  =================================================================== */
  function openSceneView(sceneId, source = 'editor') {
    state.viewSceneId = sceneId;
    state.viewModeSource = source;
    const scene = state.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    workspaceEditMode.style.display = 'none';
    appScreen.classList.add('active');
    sceneViewScreen.style.display = 'flex';
    sceneViewBreadcrumb.textContent = `${state.storyName} — ${scene.title}`;

    const images = scene.elements.filter(el => el.type === 'image');
    const videos = scene.elements.filter(el => el.type === 'video');
    const contexts = scene.elements.filter(el => el.type === 'context');

    let html = `
      <div style="margin-bottom:1.5rem;">
        <h1 style="font-family:var(--font-heading);font-size:2rem;font-weight:800;color:#fff;margin-bottom:0.4rem;">${highlightText(scene.title)}</h1>
        ${scene.description ? `<p style="color:var(--text-muted);font-size:1rem;">${highlightText(scene.description)}</p>` : ''}
      </div>`;

    if (images.length > 0) {
      html += `<div class="scene-view-images-grid">`;
      images.forEach(img => {
        html += `
          <div class="scene-view-image-card">
            <div class="image-16-9-wrapper">
              <img src="${img.displaySrc || img.src}" alt="${escHtml(img.alt || '')}">
            </div>
            <div class="image-alt-caption"><i class="fa-solid fa-info-circle"></i> ${img.alt ? highlightText(img.alt) : (img.fileName ? escHtml(img.fileName) : 'Image Frame')}</div>
            <div style="display:flex;gap:6px;padding:6px 8px;background:rgba(0,0,0,0.3);">
              <button class="btn btn-secondary btn-sm btn-view-copy-img" data-elemid="${img.id}" data-src="${img.src}" title="Copy Image to Clipboard">
                <i class="fa-solid fa-copy"></i> Copy
              </button>
              <button class="btn-download-media btn-view-download" data-elemid="${img.id}" data-src="${img.src}" data-filename="${escHtml(img.fileName || 'image.png')}" title="Download original">
                <i class="fa-solid fa-download"></i> Download
              </button>
            </div>
            ${img.prompt ? renderPromptBoxHTML(img.id, img.prompt) : ''}
          </div>`;
      });
      html += `</div>`;
    }

    if (videos.length > 0) {
      html += `<div class="scene-view-videos-grid">`;
      videos.forEach(vid => {
        html += `
          <div class="scene-view-video-card">
            <div class="video-21-9-wrapper">
              <video src="${vid.displaySrc || vid.src}" controls preload="metadata"></video>
            </div>
            <div class="video-alt-caption"><i class="fa-solid fa-info-circle"></i> ${vid.alt ? highlightText(vid.alt) : (vid.fileName ? escHtml(vid.fileName) : 'Video Clip')}</div>
            <div style="display:flex;gap:6px;padding:6px 8px;background:rgba(0,0,0,0.3);">
              <button class="btn-download-media btn-view-download" data-elemid="${vid.id}" data-src="${vid.src}" data-filename="${escHtml(vid.fileName || 'video.mp4')}" title="Download original">
                <i class="fa-solid fa-download"></i> Download
              </button>
            </div>
            ${vid.prompt ? renderPromptBoxHTML(vid.id, vid.prompt) : ''}
          </div>`;
      });
      html += `</div>`;
    }

    if (contexts.length > 0) {
      html += `<div class="scene-view-contexts">`;
      contexts.forEach(ctxElem => {
        const cls = ctxElem.category === 'Technical Aspects' ? 'cat-technical' : ctxElem.category === 'Conversation' ? 'cat-conversation' : ctxElem.category === 'Master Prompt' ? 'cat-master' : 'cat-narration';
        const safeCtxText = escHtml(ctxElem.text || '');
        html += `
          <div class="scene-view-context-card">
            <div class="context-box-render" style="position: relative;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span class="category-badge ${cls}">${escHtml(ctxElem.category)}</span>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <button class="copy-icon-btn btn-copy-text" data-text="${safeCtxText}" title="Copy Text">
                    <i class="fa-solid fa-copy"></i> Copy
                  </button>
                  <button class="expand-icon-btn btn-expand-text" data-text="${safeCtxText}" data-title="${escHtml(ctxElem.category)}" title="Expand Full View">
                    <i class="fa-solid fa-expand"></i> Expand
                  </button>
                </div>
              </div>
              <div class="context-text-display">${highlightText(ctxElem.text)}</div>
              <div class="bottom-copy-bar" style="margin-top: 8px;">
                <button class="expand-icon-btn btn-expand-text" data-text="${safeCtxText}" data-title="${escHtml(ctxElem.category)}" title="Expand Full View">
                  <i class="fa-solid fa-expand"></i> Expand
                </button>
                <button class="copy-icon-btn btn-copy-text" data-text="${safeCtxText}" title="Copy Text">
                  <i class="fa-solid fa-copy"></i> Copy
                </button>
              </div>
            </div>
          </div>`;
      });
      html += `</div>`;
    }

    if (!images.length && !videos.length && !contexts.length) {
      html += `<p style="color:var(--text-dim);text-align:center;padding:3rem;">No content in this scene yet.</p>`;
    }

    sceneViewBody.innerHTML = html;

    sceneViewBody.querySelectorAll('.btn-view-download').forEach(btn => {
      btn.addEventListener('click', () => downloadOriginal(btn.dataset.elemid, btn.dataset.src, btn.dataset.filename));
    });
    sceneViewBody.querySelectorAll('.btn-view-copy-img').forEach(btn => {
      btn.addEventListener('click', () => window.copyImgToClipboard(btn.dataset.elemid, btn.dataset.src));
    });
    sceneViewBody.querySelectorAll('.btn-copy-text').forEach(btn => {
      btn.addEventListener('click', () => copyTextToClipboard(btn.dataset.text));
    });
  }

  function renderPromptBoxHTML(elemId, promptText) {
    const safeText = escHtml(promptText || '');
    return `
      <div class="prompt-compact-bar" style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid rgba(6,182,212,0.25); background: rgba(6,182,212,0.06);">
        <span style="font-size: 0.8rem; font-weight: 600; color: var(--accent-cyan); display: flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-terminal"></i> Prompt Attached
        </span>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button class="btn btn-secondary btn-sm btn-copy-text" data-text="${safeText}" title="Copy Prompt" style="padding: 4px 8px; font-size: 0.78rem;">
            <i class="fa-solid fa-copy"></i> Copy
          </button>
          <button class="btn btn-primary btn-sm btn-expand-text" data-text="${safeText}" data-title="Prompt Text" title="Expand Full View" style="padding: 4px 10px; font-size: 0.78rem; background: linear-gradient(135deg, var(--accent-cyan), #0891b2); border: none;">
            <i class="fa-solid fa-expand"></i> Expand Prompt
          </button>
        </div>
      </div>`;
  }

  function openExpandTextModal(title, text) {
    activeExpandText = text || '';
    if (modalExpandTitle) {
      modalExpandTitle.innerHTML = `<i class="fa-solid fa-up-right-and-down-left-from-center" style="color: var(--accent-cyan);"></i> ${escHtml(title || 'Full View')}`;
    }
    if (modalExpandContent) {
      modalExpandContent.textContent = activeExpandText;
    }
    if (modalExpandMeta) {
      const charCount = activeExpandText.length;
      const wordCount = countWords(activeExpandText);
      modalExpandMeta.textContent = `${wordCount} words | ${charCount} characters`;
    }
    openModal(modalExpandText);
  }

  function copyTextToClipboard(text) {
    if (!text) { showToast('No text to copy!', 'warning'); return; }
    navigator.clipboard.writeText(text).then(() => {
      showToast('Text copied to clipboard!');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Text copied to clipboard!');
    });
  }

  window.copyImgToClipboard = function(imgId, fallbackSrc) {
    const blob = rawBlobStore[imgId];
    if (blob) {
      navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
        .then(() => showToast('Original image copied to clipboard!'))
        .catch(() => copyFromSrc(fallbackSrc));
    } else {
      copyFromSrc(fallbackSrc);
    }
  };

  function downloadOriginal(elemId, fallbackSrc, fileName) {
    const blob = rawBlobStore[elemId];
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName || 'download'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`Downloading: ${fileName}`);
    } else {
      const a = document.createElement('a');
      a.href = fallbackSrc; a.download = fileName || 'download'; a.target = '_blank'; a.click();
      showToast(`Downloading: ${fileName}`);
    }
  }

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

  btnBackFromView.addEventListener('click', () => {
    if (state.viewModeSource === 'stories') {
      openStoriesGallery();
    } else {
      showEditMode();
    }
  });

  btnEditFromView.addEventListener('click', () => {
    if (state.viewSceneId) state.activeSceneId = state.viewSceneId;
    showEditMode(); renderSidebar(); renderActiveScene();
  });

  /* ===================================================================
     CANVAS EDIT PAD (WITH DUAL COPY BUTTONS FOR ALL BOXES)
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

    const images = scene.elements.filter(el => el.type === 'image');
    const videos = scene.elements.filter(el => el.type === 'video');
    const contexts = scene.elements.filter(el => el.type === 'context');

    images.forEach((elem) => {
      const card = document.createElement('div');
      card.className = 'content-card image-card';
      card.innerHTML = `
        <div class="content-card-header">
          <span class="content-type-tag tag-image"><i class="fa-solid fa-image"></i> IMG</span>
          <div class="content-card-actions">
            <button class="btn btn-secondary btn-sm btn-copy-img" title="Copy Image to Clipboard" data-imgid="${elem.id}" data-src="${elem.src}">
              <i class="fa-solid fa-copy"></i>
            </button>
            <button class="btn-download-media btn-dl" data-elemid="${elem.id}" data-src="${elem.src}" data-filename="${escHtml(elem.fileName || 'image.png')}" title="Download original">
              <i class="fa-solid fa-download"></i>
            </button>
            <button class="btn btn-danger btn-icon btn-sm btn-remove-elem" title="Trash">
              <i class="fa-solid fa-trash-can" style="font-size:.7rem;"></i>
            </button>
          </div>
        </div>
        <div class="content-card-body">
          <div class="image-16-9-wrapper">
            <img src="${elem.displaySrc || elem.src}" alt="${escHtml(elem.alt || 'Scene Frame')}">
          </div>
          <div class="image-alt-caption"><i class="fa-solid fa-info-circle"></i> ${elem.alt ? highlightText(elem.alt) : (elem.fileName ? escHtml(elem.fileName) : 'Image Frame')}</div>
          ${elem.prompt ? renderPromptBoxHTML(elem.id, elem.prompt) : ''}
        </div>`;

      card.querySelector('.btn-copy-img').addEventListener('click', () => window.copyImgToClipboard(elem.id, elem.src));
      card.querySelector('.btn-dl').addEventListener('click', () => downloadOriginal(elem.id, elem.src, elem.fileName || 'image.png'));
      card.querySelector('.btn-remove-elem').addEventListener('click', () => {
        const idx = scene.elements.findIndex(el => el.id === elem.id);
        if (idx !== -1) { const removed = scene.elements.splice(idx, 1)[0]; pushToTrash('element', removed, scene.id); }
        renderActiveScene(); save();
      });
      card.querySelectorAll('.btn-copy-text').forEach(btn => {
        btn.addEventListener('click', () => copyTextToClipboard(btn.dataset.text));
      });

      sceneElementsGrid.appendChild(card);
    });

    videos.forEach((elem) => {
      const card = document.createElement('div');
      card.className = 'content-card video-card';
      card.innerHTML = `
        <div class="content-card-header">
          <span class="content-type-tag tag-video"><i class="fa-solid fa-video"></i> VID</span>
          <div class="content-card-actions">
            <button class="btn-download-media btn-dl" data-elemid="${elem.id}" data-src="${elem.src}" data-filename="${escHtml(elem.fileName || 'video.mp4')}" title="Download original">
              <i class="fa-solid fa-download"></i>
            </button>
            <button class="btn btn-danger btn-icon btn-sm btn-remove-elem" title="Trash">
              <i class="fa-solid fa-trash-can" style="font-size:.7rem;"></i>
            </button>
          </div>
        </div>
        <div class="content-card-body">
          <div class="video-21-9-wrapper">
            <video src="${elem.displaySrc || elem.src}" controls preload="metadata"></video>
          </div>
          <div class="video-alt-caption"><i class="fa-solid fa-info-circle"></i> ${elem.alt ? highlightText(elem.alt) : (elem.fileName ? escHtml(elem.fileName) : 'Video Clip')}</div>
          ${elem.prompt ? renderPromptBoxHTML(elem.id, elem.prompt) : ''}
        </div>`;

      card.querySelector('.btn-dl').addEventListener('click', () => downloadOriginal(elem.id, elem.src, elem.fileName || 'video.mp4'));
      card.querySelector('.btn-remove-elem').addEventListener('click', () => {
        const idx = scene.elements.findIndex(el => el.id === elem.id);
        if (idx !== -1) { const removed = scene.elements.splice(idx, 1)[0]; pushToTrash('element', removed, scene.id); }
        renderActiveScene(); save();
      });
      card.querySelectorAll('.btn-copy-text').forEach(btn => {
        btn.addEventListener('click', () => copyTextToClipboard(btn.dataset.text));
      });

      sceneElementsGrid.appendChild(card);
    });

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
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="ctx-counter ${overLimit ? 'ctx-counter-over' : ''}" data-elemid="${elem.id}">${currentCount} / ${limit} ${unit}</span>
            <button class="copy-icon-btn btn-copy-top-ctx" title="Copy Top"><i class="fa-solid fa-copy"></i> Copy</button>
            <button class="expand-icon-btn btn-expand-top-ctx" title="Expand Full View"><i class="fa-solid fa-expand"></i> Expand</button>
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
        </div>
        <div class="bottom-copy-bar">
          <button class="expand-icon-btn btn-expand-bottom-ctx" title="Expand Full View"><i class="fa-solid fa-expand"></i> Expand</button>
          <button class="copy-icon-btn btn-copy-bottom-ctx" title="Copy Bottom"><i class="fa-solid fa-copy"></i> Copy</button>
        </div>`;

      const ta = card.querySelector('.ctx-inline-textarea');
      card.querySelector('.btn-copy-top-ctx').addEventListener('click', () => copyTextToClipboard(ta.value));
      card.querySelector('.btn-copy-bottom-ctx').addEventListener('click', () => copyTextToClipboard(ta.value));
      card.querySelector('.btn-expand-top-ctx').addEventListener('click', () => openExpandTextModal(elem.category, ta.value));
      card.querySelector('.btn-expand-bottom-ctx').addEventListener('click', () => openExpandTextModal(elem.category, ta.value));

      card.querySelector('.btn-remove-elem').addEventListener('click', () => {
        const idx = scene.elements.findIndex(el => el.id === elem.id);
        if (idx !== -1) { const removed = scene.elements.splice(idx, 1)[0]; pushToTrash('element', removed, scene.id); }
        renderActiveScene(); save();
      });

      const counter = card.querySelector('.ctx-counter');
      let saveTimer = null;

      ta.addEventListener('input', () => {
        const raw = ta.value;
        const count = MASTER ? raw.length : countWords(raw);
        const over  = count > limit;

        counter.textContent = `${count} / ${limit} ${unit}`;
        counter.classList.toggle('ctx-counter-over', over);

        if (over) {
          if (MASTER) {
            ta.value = raw.slice(0, CHAR_LIMIT);
            showToast(`Master Prompt limit: ${CHAR_LIMIT} characters max!`, 'warning');
          } else {
            const trimmed = trimToWordLimit(raw, WORD_LIMIT);
            ta.value = trimmed;
            const newCount = countWords(trimmed);
            counter.textContent = `${newCount} / ${limit} ${unit}`;
            counter.classList.remove('ctx-counter-over');
            showToast(`Limit: ${WORD_LIMIT} words max!`, 'warning');
          }
        }

        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          const el = state.scenes.flatMap(s => s.elements).find(el => el.id === elem.id);
          if (el) { el.text = ta.value; save(); }
        }, 600);
      });

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

  if (inputSceneTitle) {
    inputSceneTitle.addEventListener('input', () => {
      const s = getActiveScene(); if (!s) return;
      s.title = inputSceneTitle.value; renderSidebar(); save();
    });
  }
  if (inputSceneDesc) {
    inputSceneDesc.addEventListener('input', () => {
      const s = getActiveScene(); if (!s) return;
      s.description = inputSceneDesc.value; save();
    });
  }

  /* ===================================================================
     ADD CONTENT OPTIONS & PROMPT ENHANCEMENTS
  =================================================================== */
  if (btnCanvasAddContent) {
    btnCanvasAddContent.addEventListener('click', () => openModal(modalContentType));
  }

  if (optSelectImage) {
    optSelectImage.addEventListener('click', () => {
      closeModal(modalContentType);
      state.promptMode = false;
      if (groupImagePrompt) groupImagePrompt.style.display = 'none';
      if (inputImagePrompt) inputImagePrompt.value = '';
      if (modalImageTitle) modalImageTitle.innerHTML = `<i class="fa-solid fa-file-image" style="color: var(--accent-cyan);"></i> Insert Image (max 1 GB)`;
      pendingDropImages = []; if (dropZonePreview) { dropZonePreview.innerHTML = ''; dropZonePreview.style.display = 'none'; }
      openModal(modalAddImage);
    });
  }

  if (optSelectVideo) {
    optSelectVideo.addEventListener('click', () => {
      closeModal(modalContentType);
      state.promptMode = false;
      if (groupVideoPrompt) groupVideoPrompt.style.display = 'none';
      if (inputVideoPrompt) inputVideoPrompt.value = '';
      if (modalVideoTitle) modalVideoTitle.innerHTML = `<i class="fa-solid fa-video" style="color: #a78bfa;"></i> Insert Video (max 1 GB)`;
      pendingDropVideos = []; if (videoDropZonePreview) { videoDropZonePreview.innerHTML = ''; videoDropZonePreview.style.display = 'none'; }
      openModal(modalAddVideo);
    });
  }

  if (optSelectContext) {
    optSelectContext.addEventListener('click', () => {
      closeModal(modalContentType);
      openModal(modalAddContext);
    });
  }

  if (optSelectImagePrompt) {
    optSelectImagePrompt.addEventListener('click', () => {
      closeModal(modalContentType);
      state.promptMode = true;
      if (groupImagePrompt) groupImagePrompt.style.display = 'block';
      if (inputImagePrompt) inputImagePrompt.value = '';
      if (promptImgCharCount) promptImgCharCount.textContent = '0 / 100,000 chars';
      if (modalImageTitle) modalImageTitle.innerHTML = `<i class="fa-solid fa-file-image" style="color: var(--accent-cyan);"></i> Insert Image with Prompt (max 1 GB)`;
      pendingDropImages = []; if (dropZonePreview) { dropZonePreview.innerHTML = ''; dropZonePreview.style.display = 'none'; }
      openModal(modalAddImage);
    });
  }

  if (optSelectVideoPrompt) {
    optSelectVideoPrompt.addEventListener('click', () => {
      closeModal(modalContentType);
      state.promptMode = true;
      if (groupVideoPrompt) groupVideoPrompt.style.display = 'block';
      if (inputVideoPrompt) inputVideoPrompt.value = '';
      if (promptVideoCharCount) promptVideoCharCount.textContent = '0 / 100,000 chars';
      if (modalVideoTitle) modalVideoTitle.innerHTML = `<i class="fa-solid fa-film" style="color: #a78bfa;"></i> Insert Video with Prompt (max 1 GB)`;
      pendingDropVideos = []; if (videoDropZonePreview) { videoDropZonePreview.innerHTML = ''; videoDropZonePreview.style.display = 'none'; }
      openModal(modalAddVideo);
    });
  }

  function setupPromptCharacterCounters() {
    const PROMPT_MAX = 100000;
    if (inputImagePrompt) {
      inputImagePrompt.addEventListener('input', () => {
        if (inputImagePrompt.value.length > PROMPT_MAX) {
          inputImagePrompt.value = inputImagePrompt.value.slice(0, PROMPT_MAX);
          showToast('Prompt character limit: 100,000 max (1 Lakh)!', 'warning');
        }
        if (promptImgCharCount) promptImgCharCount.textContent = `${inputImagePrompt.value.length.toLocaleString()} / 100,000 chars`;
      });
    }
    if (inputVideoPrompt) {
      inputVideoPrompt.addEventListener('input', () => {
        if (inputVideoPrompt.value.length > PROMPT_MAX) {
          inputVideoPrompt.value = inputVideoPrompt.value.slice(0, PROMPT_MAX);
          showToast('Prompt character limit: 100,000 max (1 Lakh)!', 'warning');
        }
        if (promptVideoCharCount) promptVideoCharCount.textContent = `${inputVideoPrompt.value.length.toLocaleString()} / 100,000 chars`;
      });
    }
  }

  /* ---- IMAGE FORM SUBMIT ---- */
  if (formAddImage) {
    formAddImage.addEventListener('submit', async e => {
      e.preventDefault();
      const scene = getActiveScene(); if (!scene) return;
      const alt = inputImageAlt ? inputImageAlt.value.trim() : '';
      const prompt = (groupImagePrompt && groupImagePrompt.style.display !== 'none' && inputImagePrompt) ? inputImagePrompt.value.trim() : '';
      let added = 0;

      for (const pImg of pendingDropImages) {
        const elemId = `img_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
        rawBlobStore[elemId] = pImg.blob;
        scene.elements.push({ id: elemId, type: 'image', src: pImg.dataUrl, displaySrc: pImg.dataUrl, fileName: pImg.fileName, alt, prompt });
        added++;
      }

      if (!pendingDropImages.length && inputFileImage && inputFileImage.files && inputFileImage.files.length) {
        const files = Array.from(inputFileImage.files).slice(0, 10);
        for (const file of files) {
          if (!validateSize(file)) continue;
          const result = await readFileAsDataUrl(file);
          const elemId = `img_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
          rawBlobStore[elemId] = file;
          scene.elements.push({ id: elemId, type: 'image', src: result, displaySrc: result, fileName: file.name, alt, prompt });
          added++;
        }
      }

      const url = inputUrlImage ? inputUrlImage.value.trim() : '';
      if (!added && url) {
        const elemId = `img_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
        scene.elements.push({ id: elemId, type: 'image', src: url, displaySrc: url, fileName: 'web_image.png', alt, prompt });
        added++;
      }

      if (!added) { showToast('Please add an image (drop, paste, browse, or URL)!', 'warning'); return; }

      if (inputFileImage) inputFileImage.value = '';
      if (inputUrlImage) inputUrlImage.value = '';
      if (inputImageAlt) inputImageAlt.value = '';
      if (inputImagePrompt) inputImagePrompt.value = '';
      pendingDropImages = []; if (dropZonePreview) { dropZonePreview.innerHTML = ''; dropZonePreview.style.display = 'none'; }
      closeModal(modalAddImage); renderActiveScene(); save();
      showToast(`${added} image${added > 1 ? 's' : ''} added!`);
    });
  }

  /* ---- VIDEO FORM SUBMIT ---- */
  if (formAddVideo) {
    formAddVideo.addEventListener('submit', async e => {
      e.preventDefault();
      const scene = getActiveScene(); if (!scene) return;
      const alt = inputVideoAlt ? inputVideoAlt.value.trim() : '';
      const prompt = (groupVideoPrompt && groupVideoPrompt.style.display !== 'none' && inputVideoPrompt) ? inputVideoPrompt.value.trim() : '';
      let added = 0;

      for (const pVid of pendingDropVideos) {
        const elemId = `vid_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
        rawBlobStore[elemId] = pVid.blob;
        scene.elements.push({ id: elemId, type: 'video', src: pVid.dataUrl, displaySrc: pVid.dataUrl, fileName: pVid.fileName, alt, prompt });
        added++;
      }

      if (!pendingDropVideos.length && inputFileVideo && inputFileVideo.files && inputFileVideo.files.length) {
        const files = Array.from(inputFileVideo.files).slice(0, 10);
        for (const file of files) {
          if (!validateSize(file)) continue;
          const result = await readFileAsDataUrl(file);
          const elemId = `vid_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
          rawBlobStore[elemId] = file;
          scene.elements.push({ id: elemId, type: 'video', src: result, displaySrc: result, fileName: file.name, alt, prompt });
          added++;
        }
      }

      const url = inputUrlVideo ? inputUrlVideo.value.trim() : '';
      if (!added && url) {
        const elemId = `vid_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
        scene.elements.push({ id: elemId, type: 'video', src: url, displaySrc: url, fileName: 'web_video.mp4', alt, prompt });
        added++;
      }

      if (!added) { showToast('Please add a video (drop, browse, or URL)!', 'warning'); return; }

      if (inputFileVideo) inputFileVideo.value = '';
      if (inputUrlVideo) inputUrlVideo.value = '';
      if (inputVideoAlt) inputVideoAlt.value = '';
      if (inputVideoPrompt) inputVideoPrompt.value = '';
      pendingDropVideos = []; if (videoDropZonePreview) { videoDropZonePreview.innerHTML = ''; videoDropZonePreview.style.display = 'none'; }
      closeModal(modalAddVideo); renderActiveScene(); save();
      showToast(`${added} video${added > 1 ? 's' : ''} added!`);
    });
  }

  /* ---- CONTEXT FORM SUBMIT ---- */
  if (formAddContext) {
    formAddContext.addEventListener('submit', e => {
      e.preventDefault();
      const scene = getActiveScene(); if (!scene) return;
      const category = selectContextCategory ? selectContextCategory.value : 'Narration';
      const elemId   = `ctx_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
      scene.elements.push({ id: elemId, type: 'context', category, text: '' });
      closeModal(modalAddContext); renderActiveScene(); save();
      setTimeout(() => {
        const newTa = sceneElementsGrid.querySelector(`textarea[data-elemid='${elemId}']`);
        if (newTa) newTa.focus();
      }, 80);
      showToast(`${category} box added — type directly in the scene!`);
    });
  }

  if (selectContextCategory) {
    selectContextCategory.addEventListener('change', () => {
      const isMaster = selectContextCategory.value === 'Master Prompt';
      const limitText = document.getElementById('context-limit-text');
      if (limitText) {
        limitText.innerHTML = isMaster
          ? `<strong>Master Prompt</strong> — limited to <strong>3,000 characters</strong>. Text is typed directly in the scene.`
          : `Narration / Technical / Conversation — up to <strong>10,000 words</strong>. Text is typed directly in the scene.`;
      }
    });
  }

  /* ===================================================================
     DRAG & DROP + CLIPBOARD PASTE ON DROP ZONE
  =================================================================== */
  function setupDropZone() {
    if (!imageDropZone) return;

    if (btnBrowseFile) btnBrowseFile.addEventListener('click', () => inputFileImage.click());
    if (inputFileImage) {
      inputFileImage.addEventListener('change', () => {
        const files = Array.from(inputFileImage.files);
        for (const file of files) {
          if (pendingDropImages.length >= 10) {
            showToast('Maximum 10 images can be selected at a time!', 'warning');
            break;
          }
          if (!validateSize(file)) continue;
          queueFileForDrop(file);
        }
      });
    }

    imageDropZone.addEventListener('dragover', e => { e.preventDefault(); imageDropZone.classList.add('drag-over'); });
    imageDropZone.addEventListener('dragleave', () => imageDropZone.classList.remove('drag-over'));
    imageDropZone.addEventListener('drop', e => {
      e.preventDefault(); imageDropZone.classList.remove('drag-over');
      let files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
      if (files.length === 0 && e.dataTransfer.items) {
        files = [...e.dataTransfer.items]
          .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
          .map(item => item.getAsFile())
          .filter(f => f !== null);
      }
      for (const f of files) {
        if (pendingDropImages.length >= 10) {
          showToast('Maximum 10 images can be selected at a time!', 'warning');
          break;
        }
        if (!validateSize(f)) continue;
        queueFileForDrop(f);
      }
    });

    if (modalAddImage) {
      modalAddImage.addEventListener('paste', e => {
        const items = [...e.clipboardData.items].filter(i => i.type.startsWith('image/'));
        if (!items.length) return;
        for (const item of items) {
          if (pendingDropImages.length >= 10) {
            showToast('Maximum 10 images can be selected at a time!', 'warning');
            break;
          }
          const blob = item.getAsFile();
          if (blob && validateSize(blob)) queueFileForDrop(blob, 'pasted_image.png');
        }
        e.preventDefault();
      });
    }
  }

  function setupVideoDropZone() {
    if (!videoDropZone) return;

    if (btnBrowseVideoFile) btnBrowseVideoFile.addEventListener('click', () => inputFileVideo.click());
    if (inputFileVideo) {
      inputFileVideo.addEventListener('change', () => {
        const files = Array.from(inputFileVideo.files);
        for (const file of files) {
          if (pendingDropVideos.length >= 10) {
            showToast('Maximum 10 videos can be selected at a time!', 'warning');
            break;
          }
          if (!validateSize(file)) continue;
          queueVideoForDrop(file);
        }
      });
    }

    videoDropZone.addEventListener('dragover', e => { e.preventDefault(); videoDropZone.classList.add('drag-over'); });
    videoDropZone.addEventListener('dragleave', () => videoDropZone.classList.remove('drag-over'));
    videoDropZone.addEventListener('drop', e => {
      e.preventDefault(); videoDropZone.classList.remove('drag-over');
      const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('video/'));
      for (const f of files) {
        if (pendingDropVideos.length >= 10) {
          showToast('Maximum 10 videos can be selected at a time!', 'warning');
          break;
        }
        if (!validateSize(f)) continue;
        queueVideoForDrop(f);
      }
    });
  }

  async function queueVideoForDrop(file, nameOverride) {
    const dataUrl = await readFileAsDataUrl(file);
    const entry = { dataUrl, blob: file, fileName: nameOverride || file.name };
    pendingDropVideos.push(entry);

    if (videoDropZonePreview) {
      const vid = document.createElement('video');
      vid.src = dataUrl; vid.className = 'drop-zone-preview-video'; vid.title = entry.fileName;
      vid.muted = true;
      vid.addEventListener('loadeddata', () => { vid.currentTime = 1; });
      videoDropZonePreview.appendChild(vid);
      videoDropZonePreview.style.display = 'flex';
    }
  }

  async function queueFileForDrop(file, nameOverride) {
    const dataUrl = await readFileAsDataUrl(file);
    const entry = { dataUrl, blob: file, fileName: nameOverride || file.name };
    pendingDropImages.push(entry);

    if (dropZonePreview) {
      const img = document.createElement('img');
      img.src = dataUrl; img.className = 'drop-zone-preview-img'; img.title = entry.fileName;
      dropZonePreview.appendChild(img);
      dropZonePreview.style.display = 'flex';
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise((res, rej) => {
      if (!file) return rej('No file provided');
      if (file.type && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
          const img = new Image();
          img.onload = () => {
            let width = img.width;
            let height = img.height;
            const maxWidth = 1920;
            const maxHeight = 1080;
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            res(compressed);
          };
          img.onerror = () => res(e.target.result);
          img.src = e.target.result;
        };
        reader.onerror = rej;
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = e => res(e.target.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      }
    });
  }

  function validateSize(file, customMaxMB) {
    const maxMB = customMaxMB || 1024;
    const MAX = maxMB * 1024 * 1024;
    if (file.size > MAX) {
      const limitStr = maxMB >= 1024 ? `${(maxMB / 1024).toFixed(0)} GB` : `${maxMB} MB`;
      showToast(`File "${file.name}" exceeds ${limitStr} limit!`, 'warning');
      return false;
    }
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

    if (btnClearSketch) btnClearSketch.addEventListener('click', clearSketch);
    if (btnOpenSketch) btnOpenSketch.addEventListener('click', () => { closeModal(modalAddImage); openModal(modalSketchPad); clearSketch(); });
    if (btnSaveSketch) {
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
  }

  function clearSketch() {
    if (ctx && sketchCanvas) { ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, sketchCanvas.width, sketchCanvas.height); }
  }

  /* ===================================================================
     GLOBAL LIVE SEARCH & TRASH
  =================================================================== */
  if (inputGlobalSearch) {
    inputGlobalSearch.addEventListener('input', () => {
      state.searchQuery = inputGlobalSearch.value.trim();
      if (btnClearSearch) btnClearSearch.style.display = state.searchQuery ? 'inline-block' : 'none';
      if (state.searchQuery) {
        const match = state.scenes.find(sc =>
          sc.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          (sc.description||'').toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          sc.elements.some(el => (el.text||'').toLowerCase().includes(state.searchQuery.toLowerCase()) || (el.alt||'').toLowerCase().includes(state.searchQuery.toLowerCase()) || (el.prompt||'').toLowerCase().includes(state.searchQuery.toLowerCase()))
        );
        if (match && match.id !== state.activeSceneId) state.activeSceneId = match.id;
      }
      renderSidebar(); renderActiveScene();
      if (state.viewSceneId) openSceneView(state.viewSceneId, state.viewModeSource);
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      if (inputGlobalSearch) inputGlobalSearch.value = '';
      state.searchQuery = ''; btnClearSearch.style.display = 'none';
      renderSidebar(); renderActiveScene();
    });
  }

  function pushToTrash(type, data, sceneId) {
    state.trash.push({ id: `trash_${Date.now()}`, type, data, sceneId, deletedAt: new Date().toLocaleTimeString() });
  }

  if (btnOpenTrash) {
    btnOpenTrash.addEventListener('click', () => { renderTrashItems(); openModal(modalTrashBin); });
  }

  function renderTrashItems() {
    if (!trashItemsContainer) return;
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

  if (btnEmptyTrash) {
    btnEmptyTrash.addEventListener('click', () => {
      if (!state.trash.length || !confirm('Permanently purge all trash? Cannot be undone.')) return;
      state.trash = []; renderTrashItems(); save(); showToast('Trash emptied!');
    });
  }

  /* ===================================================================
     PRESENTATION MODE & EXPORT
  =================================================================== */
  if (btnNavPresent) {
    btnNavPresent.addEventListener('click', () => {
      if (!state.scenes.length) { showToast('Add scenes first!', 'warning'); return; }
      state.presentIndex = 0;
      if (presentStoryTitle) presentStoryTitle.textContent = state.storyName;
      if (presentTotalScenes) presentTotalScenes.textContent = state.scenes.length;
      openModal(modalPresentation); renderPresentSlide();
    });
  }

  function renderPresentSlide() {
    const scene = state.scenes[state.presentIndex]; if (!scene || !presentSlideContent) return;
    if (presentCurrentIdx) presentCurrentIdx.textContent = state.presentIndex + 1;
    const imgs = scene.elements.filter(el => el.type === 'image');
    const vids = scene.elements.filter(el => el.type === 'video');
    const ctxs = scene.elements.filter(el => el.type === 'context');
    let html = `<h2 style="font-family:var(--font-heading);font-size:1.8rem;color:#fff;margin-bottom:.5rem;">${escHtml(scene.title)}</h2>`;
    if (scene.description) html += `<p style="color:var(--text-muted);margin-bottom:1rem;">${escHtml(scene.description)}</p>`;
    if (imgs.length) {
      html += `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:1rem;">`;
      imgs.forEach(img => {
        html += `<div class="image-16-9-wrapper" style="border-radius:8px;"><img src="${img.displaySrc || img.src}" alt="${escHtml(img.alt||'')}"></div>`;
      });
      html += `</div>`;
    }
    if (vids.length) {
      html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:1rem;">`;
      vids.forEach(vid => {
        html += `<div class="video-16-9-wrapper" style="border-radius:8px;"><video src="${vid.displaySrc || vid.src}" controls preload="metadata"></video></div>`;
      });
      html += `</div>`;
    }
    ctxs.forEach(c => {
      html += `<div style="border-left:4px solid var(--primary);padding:10px 14px;background:rgba(0,0,0,.3);border-radius:0 8px 8px 0;margin-bottom:8px;">
        <small style="color:var(--accent-cyan);font-weight:700;">${escHtml(c.category)}</small>
        <p style="color:#fff;margin-top:4px;">${escHtml(c.text)}</p></div>`;
    });
    if (!imgs.length && !vids.length && !ctxs.length) html += `<p style="color:var(--text-dim);text-align:center;padding:2rem;">No content in this scene.</p>`;
    presentSlideContent.innerHTML = html;
  }

  if (btnPresentPrev) btnPresentPrev.addEventListener('click', () => { if (state.presentIndex > 0) { state.presentIndex--; renderPresentSlide(); } });
  if (btnPresentNext) btnPresentNext.addEventListener('click', () => { if (state.presentIndex < state.scenes.length - 1) { state.presentIndex++; renderPresentSlide(); } });

  if (btnNavExportJson) {
    btnNavExportJson.addEventListener('click', () => {
      const data = JSON.stringify({ storyName: state.storyName, genre: state.genre, scenes: state.scenes }, null, 2);
      const a = document.createElement('a');
      a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(data);
      a.download = `${state.storyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_storyboard.json`;
      a.click(); showToast('JSON exported!');
    });
  }

  /* ===================================================================
     TASKS & NOTES FEATURE
  =================================================================== */
  function setupTasksNotes() {
    const btnTasksNotes      = document.getElementById('btn-tasks-notes');
    const modalTasksNotes    = document.getElementById('modal-tasks-notes');
    const tnTabTasks         = document.getElementById('tn-tab-tasks');
    const tnTabNotes         = document.getElementById('tn-tab-notes');
    const tnPanelTasks       = document.getElementById('tn-panel-tasks');
    const tnPanelNotes       = document.getElementById('tn-panel-notes');
    const tnTasksList        = document.getElementById('tn-tasks-list');
    const tnTaskInput        = document.getElementById('tn-task-input');
    const tnTasksEmpty       = document.getElementById('tn-tasks-empty');
    const tnNotesTextarea    = document.getElementById('tn-notes-textarea');
    const btnTnExpand        = document.getElementById('btn-tn-expand');
    const tnModalBox         = modalTasksNotes ? modalTasksNotes.querySelector('.tasks-notes-modal-box') : null;

    if (!btnTasksNotes || !modalTasksNotes) return;

    // Expand/Collapse toggle
    let isExpanded = false;
    btnTnExpand.addEventListener('click', () => {
      isExpanded = !isExpanded;
      tnModalBox.classList.toggle('tn-expanded', isExpanded);
      btnTnExpand.innerHTML = isExpanded
        ? '<i class="fa-solid fa-compress"></i>'
        : '<i class="fa-solid fa-expand"></i>';
      btnTnExpand.title = isExpanded ? 'Collapse' : 'Expand';
    });

    // Reset expand state when modal closes
    const resetExpand = () => {
      isExpanded = false;
      tnModalBox.classList.remove('tn-expanded');
      btnTnExpand.innerHTML = '<i class="fa-solid fa-expand"></i>';
      btnTnExpand.title = 'Expand';
    };

    // Listen for modal close (clicking overlay or close button)
    modalTasksNotes.addEventListener('click', (e) => {
      if (e.target === modalTasksNotes) resetExpand();
    });
    modalTasksNotes.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => resetExpand());
    });

    // Open modal
    btnTasksNotes.addEventListener('click', () => {
      openModal(modalTasksNotes);
      renderTasksList();
      tnNotesTextarea.value = state.notes || '';
      tnTaskInput.focus();
    });

    // Tab switching
    function switchTab(tab) {
      tnTabTasks.classList.toggle('active', tab === 'tasks');
      tnTabNotes.classList.toggle('active', tab === 'notes');
      tnPanelTasks.classList.toggle('active', tab === 'tasks');
      tnPanelNotes.classList.toggle('active', tab === 'notes');
      if (tab === 'tasks') tnTaskInput.focus();
      if (tab === 'notes') tnNotesTextarea.focus();
    }

    tnTabTasks.addEventListener('click', () => switchTab('tasks'));
    tnTabNotes.addEventListener('click', () => switchTab('notes'));

    // Add task on Enter
    tnTaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const text = tnTaskInput.value.trim();
        if (!text) return;
        const task = {
          id: `task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
          text: text,
          completed: false
        };
        state.tasks.push(task);
        tnTaskInput.value = '';
        renderTasksList();
        save();
      }
    });

    // Render tasks
    function renderTasksList() {
      tnTasksList.innerHTML = '';
      const hasTasks = state.tasks.length > 0;
      tnTasksEmpty.style.display = hasTasks ? 'none' : 'flex';

      state.tasks.forEach((task) => {
        const item = document.createElement('div');
        item.className = `tn-task-item ${task.completed ? 'completed' : ''}`;
        item.innerHTML = `
          <div class="tn-checkbox ${task.completed ? 'checked' : ''}" data-taskid="${task.id}"></div>
          <span class="tn-task-text">${escHtml(task.text)}</span>
          <button class="tn-task-delete" data-taskid="${task.id}" title="Delete task">
            <i class="fa-solid fa-xmark"></i>
          </button>`;

        // Toggle checkbox
        item.querySelector('.tn-checkbox').addEventListener('click', () => {
          task.completed = !task.completed;
          renderTasksList();
          save();
        });

        // Delete task
        item.querySelector('.tn-task-delete').addEventListener('click', () => {
          state.tasks = state.tasks.filter(t => t.id !== task.id);
          renderTasksList();
          save();
        });

        tnTasksList.appendChild(item);
      });

      // Auto-scroll to bottom
      tnTasksList.scrollTop = tnTasksList.scrollHeight;
    }

    // Notes auto-save on input
    let notesDebounce = null;
    tnNotesTextarea.addEventListener('input', () => {
      clearTimeout(notesDebounce);
      notesDebounce = setTimeout(() => {
        state.notes = tnNotesTextarea.value;
        save();
      }, 400);
    });
  }

  /* ===================================================================
     HELPERS & UTILITIES
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

  if (btnModalExpandCopy) {
    btnModalExpandCopy.addEventListener('click', () => {
      copyTextToClipboard(activeExpandText);
    });
  }

  document.addEventListener('click', (e) => {
    const expandBtn = e.target.closest('.btn-expand-prompt, .btn-expand-text');
    if (expandBtn) {
      const text = expandBtn.dataset.text || '';
      const title = expandBtn.dataset.title || 'Full View';
      openExpandTextModal(title, text);
    }
  });

  init();
});
