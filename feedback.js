// 建议反馈 - 数据从 Supabase 加载
let feedbackData = [];

// 从 Supabase 加载反馈数据
async function loadFeedbackData() {
    const api = window.supabaseApi;
    if (!api) { feedbackData = []; return; }
    feedbackData = await api.getFeedback() || [];
}

// 初始化建议改进页面
async function initFeedback() {
    await loadFeedbackData();
    renderFeedbackList();
    setupFeedbackEvents();
}

// 渲染建议列表
function renderFeedbackList() {
    const feedbackList = document.getElementById('feedbackList');
    if (!feedbackList) return;
    
    feedbackList.innerHTML = '';
    
    // 按时间倒序排列
    const sorted = [...feedbackData].sort((a, b) => new Date(b.time) - new Date(a.time));
    
    if (sorted.length === 0) {
        feedbackList.innerHTML = '<div class="text-center text-gray-500 py-12">暂无建议，欢迎提出您的宝贵意见！</div>';
        return;
    }
    
    sorted.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 rounded-lg p-4 md:p-6 border border-gray-200';
        
        const timeStr = new Date(item.time).toLocaleString('zh-CN', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        card.innerHTML = `
            <div class="flex gap-4">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    ${item.uploader.charAt(0).toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <p class="font-semibold text-gray-800">${item.uploader}</p>
                        <p class="text-xs text-gray-500">${timeStr}</p>
                    </div>
                    <p class="text-gray-700 leading-relaxed mt-2 break-words">${item.content}</p>
                </div>
            </div>
        `;
        
        feedbackList.appendChild(card);
    });
}

// 设置建议改进页面事件
function setupFeedbackEvents() {
    const publishBtn = document.getElementById('publishFeedbackBtn');
    const publishModal = document.getElementById('publishFeedbackModal');
    const closePublishBtn = document.getElementById('closeFeedbackPublishBtn');
    const publishForm = document.getElementById('feedbackPublishForm');
    
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
        });
    }
    
    publishModal?.addEventListener('click', (e) => {
        if (e.target === publishModal) {
            publishModal.classList.add('hidden');
            publishForm.reset();
        }
    });
    
    // 发布表单提交
    if (publishForm) {
        publishForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!currentUser) {
                alert('请先登录');
                return;
            }
            
            const content = document.getElementById('feedbackContent').value.trim();
            
            if (!content) {
                alert('请输入建议内容');
                return;
            }

            const contentCheck = validateContent(content);
            if (!contentCheck.valid) {
                alert(contentCheck.message);
                return;
            }
            
            await publishFeedback(content);
        });
    }
}

// 发布建议（Supabase）
async function publishFeedback(content) {
    const api = window.supabaseApi;
    if (!api) { alert('服务暂不可用'); return; }
    
    const newFeedback = {
        uploader: currentUser.nickname || currentUser.email,
        content: content
    };
    const inserted = await api.insertFeedback(newFeedback);
    if (inserted) {
        feedbackData.unshift({ ...newFeedback, id: inserted.id, time: inserted.time });
        alert('感谢您的建议！');
        document.getElementById('publishFeedbackModal').classList.add('hidden');
        document.getElementById('feedbackPublishForm').reset();
        renderFeedbackList();
    } else {
        alert('提交失败，请重试');
    }
}

// 建议改进页面权限检查
function checkFeedbackAccess() {
    const feedbackCard = document.getElementById('feedbackCard');
    if (feedbackCard) {
        feedbackCard.addEventListener('click', () => {
            showPage('feedbackPage');
            initFeedback();
        });
    }
}
