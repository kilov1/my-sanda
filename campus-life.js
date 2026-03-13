// 校园生活 - 数据从 Supabase 加载，不再使用 localStorage
let lifeData = [];

// 初始化校园生活页面
async function initCampusLife() {
    await loadLifeData();
    renderLifeList();
    setupCampusLifeEvents();
}

// 从 Supabase 加载校园生活数据
async function loadLifeData() {
    const api = window.supabaseApi;
    if (!api) { lifeData = []; return; }
    lifeData = await api.getLifePosts() || [];
}

// 渲染动态列表
async function renderLifeList() {
    const lifeList = document.getElementById('lifeList');
    if (!lifeList) return;
    
    // 「我的发布」模式
    if (isMyPostsMode('campusLife')) {
        renderMyPostsList(lifeData, 'life', 'lifeList', () => renderLifeList());
        return;
    }
    
    lifeList.innerHTML = '';
    
    // 按时间倒序排列
    const sorted = [...lifeData].sort((a, b) => new Date(b.time) - new Date(a.time));
    
    if (sorted.length === 0) {
        lifeList.innerHTML = '<div class="text-center text-gray-500 py-12">暂无动态，快来分享你的校园生活吧！</div>';
        return;
    }
    
    sorted.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 rounded-lg p-4 md:p-6 border border-gray-200 hover:border-blue-300 transition-colors';
        
        const timeStr = new Date(item.time).toLocaleString('zh-CN', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        let imageHtml = '';
        if (item.image) {
            imageHtml = `<img src="${item.image}" alt="动态图片" class="w-full rounded-lg mt-4 max-h-80 object-cover">`;
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
                    <input type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none comment-input" placeholder="写评论..." data-id="${item.id}">
                    <button class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors comment-btn" data-id="${item.id}">评论</button>
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
                        <button class="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1 toggle-comments-btn" data-id="${item.id}">
                            <span>💬</span>
                            <span>${item.comments ? item.comments.length : 0}</span>
                        </button>
                    </div>
                    ${commentsHtml}
                </div>
            </div>
        `;
        
        lifeList.appendChild(card);
    });
    
    // 绑定评论展开/折叠按钮
    document.querySelectorAll('.toggle-comments-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
            const item = lifeData.find(d => d.id === id);
            if (item) {
                item.expanded = !item.expanded;
                renderLifeList();
            }
        });
    });
    
    // 绑定评论提交按钮
    document.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.target.getAttribute('data-id'), 10);
            const input = document.querySelector(`.comment-input[data-id="${id}"]`);
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
            
            const item = lifeData.find(d => d.id === id);
            if (!item) return;
            if (!item.comments) item.comments = [];
            
            item.comments.push({
                commenter: currentUser.nickname || currentUser.email,
                text: text,
                time: new Date().toISOString()
            });
            
            const api = window.supabaseApi;
            if (api && await api.updateLifePost(id, { comments: item.comments })) {
                renderLifeList();
            } else {
                item.comments.pop();
                alert('评论失败，请重试');
            }
        });
    });
}

// 图片压缩函数
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            if (width > 1200) {
                height = (height * 1200) / width;
                width = 1200;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onload = (e) => {
                    callback(e.target.result);
                };
            }, 'image/jpeg', 0.7);
        };
    };
}

// 设置校园生活页面事件
function setupCampusLifeEvents() {
    const publishBtn = document.getElementById('publishBtn');
    const publishModal = document.getElementById('publishModal');
    const closePublishBtn = document.getElementById('closePublishBtn');
    const publishForm = document.getElementById('publishForm');
    const lifeImage = document.getElementById('lifeImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
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
            imagePreview.classList.add('hidden');
        });
    }
    
    publishModal?.addEventListener('click', (e) => {
        if (e.target === publishModal) {
            publishModal.classList.add('hidden');
            publishForm.reset();
            imagePreview.classList.add('hidden');
        }
    });
    
    if (lifeImage) {
        lifeImage.addEventListener('change', (e) => {
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
    
    if (publishForm) {
        publishForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!currentUser) {
                alert('请先登录');
                return;
            }
            
            const content = document.getElementById('lifeContent').value.trim();
            const imageFile = document.getElementById('lifeImage').files[0];
            
            if (!content) {
                alert('请输入动态内容');
                return;
            }

            const contentCheck = validateContent(content);
            if (!contentCheck.valid) {
                alert(contentCheck.message);
                return;
            }
            
            if (imageFile) {
                compressImage(imageFile, (compressedImage) => {
                    publishLife(content, compressedImage);
                });
            } else {
                publishLife(content, null);
            }
        });
    }
}

// 发布动态（Supabase）
async function publishLife(content, image) {
    const api = window.supabaseApi;
    if (!api) {
        alert('服务暂不可用');
        return;
    }
    
    const newLife = {
        uploader: currentUser.nickname || currentUser.email,
        avatar: (currentUser.nickname || currentUser.email).charAt(0).toUpperCase(),
        content: content,
        image: image,
        comments: []
    };
    
    const inserted = await api.insertLifePost(newLife);
    if (inserted) {
        lifeData.unshift({ ...newLife, id: inserted.id, time: new Date().toISOString() });
        alert('发布成功！');
        document.getElementById('publishModal').classList.add('hidden');
        document.getElementById('publishForm').reset();
        document.getElementById('imagePreview').classList.add('hidden');
        renderLifeList();
    } else {
        alert('发布失败，请重试');
    }
}

// 校园生活页面权限检查
function checkCampusLifeAccess() {
    const campusLifeBtn = document.querySelector('[data-page="campusLifePage"]');
    if (campusLifeBtn) {
        campusLifeBtn.addEventListener('click', () => {
            if (!currentUser) {
                alert('请先登录');
                showPage('loginPage');
                return;
            }
            showPage('campusLifePage');
            initCampusLife();
        });
    }
}
