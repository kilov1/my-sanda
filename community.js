// 通用渲染函数
function renderCommunityList(data, listId, dataKey) {
    const list = document.getElementById(listId);
    if (!list) return;
    
    // 「我的发布」模式
    const typeMap = { 'lostFound': 'lostFound', 'secondhand': 'secondhand', 'askHelp': 'askHelp' };
    if (isMyPostsMode(typeMap[dataKey] || dataKey)) {
        const renderFn = () => renderCommunityList(data, listId, dataKey);
        renderMyPostsList(data, dataKey, listId, renderFn);
        return;
    }
    
    list.innerHTML = '';
    const sorted = [...data].sort((a, b) => new Date(b.time) - new Date(a.time));
    
    if (sorted.length === 0) {
        list.innerHTML = '<div class="text-center text-gray-500 py-12">暂无内容，快来发布吧！</div>';
        return;
    }
    
    sorted.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 rounded-lg p-4 md:p-6 border border-gray-200 hover:border-blue-300 transition-colors';
        
        const timeStr = new Date(item.time).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        let imageHtml = '';
        if (item.image) {
            imageHtml = `<img src="${item.image}" alt="图片" class="w-full rounded-lg mt-4 max-h-80 object-cover">`;
        }
        
        const commentsHtml = item.expanded ? `
            <div class="mt-4 space-y-3 bg-white rounded-lg p-4">
                ${item.comments && item.comments.length > 0 ? item.comments.map(comment => `
                    <div class="border-b border-gray-200 pb-3 last:border-b-0">
                        <p class="text-sm font-medium text-gray-800">${comment.commenter}</p>
                        <p class="text-sm text-gray-600 mt-1">${comment.text}</p>
                        <p class="text-xs text-gray-400 mt-1">${new Date(comment.time).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                `).join('') : '<p class="text-sm text-gray-500">暂无评论</p>'}
                <div class="flex gap-2 mt-3">
                    <input type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none comment-input" placeholder="写评论..." data-id="${item.id}" data-key="${dataKey}">
                    <button class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors comment-btn" data-id="${item.id}" data-key="${dataKey}">评论</button>
                </div>
            </div>
        ` : '';
        
        card.innerHTML = `
            <div class="flex gap-4">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    ${item.avatar}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <p class="font-semibold text-gray-800">${item.uploader}</p>
                        <p class="text-xs text-gray-500">${timeStr}</p>
                    </div>
                    <p class="text-gray-700 leading-relaxed mt-2 break-words">${item.content}</p>
                    ${imageHtml}
                    <div class="mt-4 flex gap-4">
                        <button class="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1 toggle-comments-btn" data-id="${item.id}" data-key="${dataKey}">
                            <span>💬</span>
                            <span>${item.comments ? item.comments.length : 0}</span>
                        </button>
                    </div>
                    ${commentsHtml}
                </div>
            </div>
        `;
        
        list.appendChild(card);
    });
    
    // 绑定评论展开/折叠按钮
    document.querySelectorAll('.toggle-comments-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            const key = e.currentTarget.getAttribute('data-key');
            const dataArray = key === 'lostFound' ? lostFoundData : key === 'secondhand' ? secondhandData : askHelpData;
            const item = dataArray.find(d => d.id === id);
            if (item) {
                item.expanded = !item.expanded;
                renderCommunityList(dataArray, listId, key);
            }
        });
    });
    
    // 绑定评论提交按钮
    document.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.target.getAttribute('data-id'), 10);
            const key = e.target.getAttribute('data-key');
            const input = document.querySelector(`.comment-input[data-id="${id}"][data-key="${key}"]`);
            const text = (input && input.value || '').trim();
            
            if (!text) {
                alert('请输入评论内容');
                return;
            }

            const commentCheck = validateContent(text);
            if (!commentCheck.valid) {
                alert(commentCheck.message);
                return;
            }
            
            const dataArray = key === 'lostFound' ? lostFoundData : key === 'secondhand' ? secondhandData : askHelpData;
            const item = dataArray.find(d => d.id === id);
            if (!item) return;
            if (!item.comments) item.comments = [];
            
            item.comments.push({
                commenter: currentUser.nickname || currentUser.email,
                text: text,
                time: new Date().toISOString()
            });
            
            const api = window.supabaseApi;
            const updateFn = key === 'lostFound' ? api?.updateLostFoundPost : key === 'secondhand' ? api?.updateSecondhandPost : api?.updateAskHelpPost;
            if (api && updateFn && await updateFn(id, { comments: item.comments })) {
                renderCommunityList(dataArray, listId, key);
            } else {
                item.comments.pop();
                alert('评论失败，请重试');
            }
        });
    });
}

// 通用发布函数（Supabase）
async function publishCommunityPost(type, content, image, anonymous) {
    const api = window.supabaseApi;
    if (!api) { alert('服务暂不可用'); return null; }
    
    const newPost = {
        uploader: anonymous ? '匿名用户' : (currentUser.nickname || currentUser.email),
        avatar: anonymous ? '?' : (currentUser.nickname || currentUser.email).charAt(0).toUpperCase(),
        content: content,
        image: image,
        comments: [],
        anonymous: anonymous || false
    };
    
    let inserted = null;
    if (type === 'lostFound') inserted = await api.insertLostFoundPost(newPost);
    else if (type === 'secondhand') inserted = await api.insertSecondhandPost(newPost);
    else if (type === 'askHelp') inserted = await api.insertAskHelpPost(newPost);
    
    if (inserted) {
        const dataArray = type === 'lostFound' ? lostFoundData : type === 'secondhand' ? secondhandData : askHelpData;
        dataArray.unshift({ ...newPost, id: inserted.id, time: new Date().toISOString(), expanded: false });
        alert('发布成功！');
        return inserted;
    }
    return null;
}

// 从 Supabase 加载社区数据
async function loadCommunityData(type) {
    const api = window.supabaseApi;
    if (!api) return;
    if (type === 'lostFound') lostFoundData = await api.getLostFoundPosts() || [];
    else if (type === 'secondhand') secondhandData = await api.getSecondhandPosts() || [];
    else if (type === 'askHelp') askHelpData = await api.getAskHelpPosts() || [];
}

// 初始化失物招领页面
async function initLostFound() {
    await loadCommunityData('lostFound');
    renderCommunityList(lostFoundData, 'lostFoundList', 'lostFound');
    setupCommunityPublish('lostFound', true);
}

// 初始化二手闲置页面
async function initSecondhand() {
    await loadCommunityData('secondhand');
    renderCommunityList(secondhandData, 'secondhandList', 'secondhand');
    setupCommunityPublish('secondhand', true);
}

// 初始化提问求助页面
async function initAskHelp() {
    await loadCommunityData('askHelp');
    renderCommunityList(askHelpData, 'askHelpList', 'askHelp');
    setupCommunityPublish('askHelp', false);
}

// 通用发布设置
function setupCommunityPublish(type, hasImage) {
    const publishBtn = document.getElementById(`publish${type.charAt(0).toUpperCase() + type.slice(1)}Btn`);
    const publishModal = document.getElementById(`publish${type.charAt(0).toUpperCase() + type.slice(1)}Modal`);
    const closePublishBtn = document.getElementById(`close${type.charAt(0).toUpperCase() + type.slice(1)}PublishBtn`);
    const publishForm = document.getElementById(`${type}PublishForm`);
    
    if (publishBtn) {
        publishBtn.addEventListener('click', () => {
            if (!currentUser) {
                alert('请先登录');
                showPage('loginPage');
                return;
            }
            publishModal.classList.remove('hidden');
        });
    }
    
    if (closePublishBtn) {
        closePublishBtn.addEventListener('click', () => {
            publishModal.classList.add('hidden');
            publishForm.reset();
            if (hasImage) {
                document.getElementById(`${type}ImagePreview`).classList.add('hidden');
            }
        });
    }
    
    publishModal?.addEventListener('click', (e) => {
        if (e.target === publishModal) {
            publishModal.classList.add('hidden');
            publishForm.reset();
            if (hasImage) {
                document.getElementById(`${type}ImagePreview`).classList.add('hidden');
            }
        }
    });
    
    // 图片预览
    if (hasImage) {
        const imageInput = document.getElementById(`${type}Image`);
        const imagePreview = document.getElementById(`${type}ImagePreview`);
        const previewImg = document.getElementById(`${type}PreviewImg`);
        
        if (imageInput) {
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = (e) => {
                        previewImg.src = e.target.result;
                        imagePreview.classList.remove('hidden');
                    };
                }
            });
        }
    }
    
    // 发布表单提交
    if (publishForm) {
        publishForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!currentUser) {
                alert('请先登录');
                return;
            }
            
            const content = document.getElementById(`${type}Content`).value.trim();
            const anonymous = type === 'askHelp' ? document.getElementById('askHelpAnonymous').checked : false;
            
            if (!content) {
                alert('请输入内容');
                return;
            }

            const contentCheck = validateContent(content);
            if (!contentCheck.valid) {
                alert(contentCheck.message);
                return;
            }
            
            const listId = type === 'lostFound' ? 'lostFoundList' : type === 'secondhand' ? 'secondhandList' : 'askHelpList';
            const dataArray = type === 'lostFound' ? lostFoundData : type === 'secondhand' ? secondhandData : askHelpData;
            
            async function doPublish(img) {
                const ok = await publishCommunityPost(type, content, img, anonymous);
                if (ok) {
                    publishModal.classList.add('hidden');
                    publishForm.reset();
                    if (hasImage) document.getElementById(`${type}ImagePreview`).classList.add('hidden');
                    renderCommunityList(dataArray, listId, type);
                } else {
                    alert('发布失败，请重试');
                }
            }
            
            if (hasImage) {
                const imageFile = document.getElementById(`${type}Image`).files[0];
                if (imageFile) {
                    compressImage(imageFile, (compressedImage) => { doPublish(compressedImage); });
                } else {
                    doPublish(null);
                }
            } else {
                doPublish(null);
            }
        });
    }
}

// 页面权限检查
function checkCommunityAccess() {
    const lostFoundBtn = document.querySelector('[data-page="lostFoundPage"]');
    if (lostFoundBtn) {
        lostFoundBtn.addEventListener('click', () => {
            if (!currentUser) {
                alert('请先登录');
                showPage('loginPage');
                return;
            }
            showPage('lostFoundPage');
            initLostFound();
        });
    }
    
    const secondhandBtn = document.querySelector('[data-page="secondhandPage"]');
    if (secondhandBtn) {
        secondhandBtn.addEventListener('click', () => {
            if (!currentUser) {
                alert('请先登录');
                showPage('loginPage');
                return;
            }
            showPage('secondhandPage');
            initSecondhand();
        });
    }
    
    const askHelpBtn = document.querySelector('[data-page="askHelpPage"]');
    if (askHelpBtn) {
        askHelpBtn.addEventListener('click', () => {
            if (!currentUser) {
                alert('请先登录');
                showPage('loginPage');
                return;
            }
            showPage('askHelpPage');
            initAskHelp();
        });
    }
}
