// 我的发布功能模块
// 当前各页面的筛选状态
const myPostsFilter = {
    campusLife: false,
    lostFound: false,
    secondhand: false,
    askHelp: false
};

// 为校园生活页面添加「我的发布」按钮
function setupMyPostsButtons() {
    setupMyPostsBtn('campusLife', 'lifeList', () => lifeData, 'life', renderLifeList);
    setupMyPostsBtn('lostFound', 'lostFoundList', () => lostFoundData, 'lostFound', () => renderCommunityList(lostFoundData, 'lostFoundList', 'lostFound'));
    setupMyPostsBtn('secondhand', 'secondhandList', () => secondhandData, 'secondhand', () => renderCommunityList(secondhandData, 'secondhandList', 'secondhand'));
    setupMyPostsBtn('askHelp', 'askHelpList', () => askHelpData, 'askHelp', () => renderCommunityList(askHelpData, 'askHelpList', 'askHelp'));
}

// 为单个页面设置我的发布按钮
function setupMyPostsBtn(type, listId, getDataFn, postType, renderFn) {
    const btnId = `myPosts${type.charAt(0).toUpperCase() + type.slice(1)}Btn`;
    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.addEventListener('click', () => {
        if (!currentUser) {
            alert('请先登录');
            showPage('loginPage');
            return;
        }
        myPostsFilter[type] = !myPostsFilter[type];
        btn.classList.toggle('active-my-posts', myPostsFilter[type]);
        renderFn();
    });
}

// 根据 postType 调用对应的 Supabase API
async function updatePostByType(postType, id, updates) {
    const api = window.supabaseApi;
    if (!api) return false;
    if (postType === 'life') return api.updateLifePost(id, updates);
    if (postType === 'lostFound') return api.updateLostFoundPost(id, updates);
    if (postType === 'secondhand') return api.updateSecondhandPost(id, updates);
    if (postType === 'askHelp') return api.updateAskHelpPost(id, updates);
    return false;
}
async function deletePostByType(postType, id) {
    const api = window.supabaseApi;
    if (!api) return false;
    if (postType === 'life') return api.deleteLifePost(id);
    if (postType === 'lostFound') return api.deleteLostFoundPost(id);
    if (postType === 'secondhand') return api.deleteSecondhandPost(id);
    if (postType === 'askHelp') return api.deleteAskHelpPost(id);
    return false;
}

// 渲染「我的」帖子卡片（带编辑/删除按钮）
function renderMyPostCard(item, dataArray, postType, listId, renderFn) {
    const card = document.createElement('div');
    card.className = 'bg-gray-50 rounded-lg p-4 md:p-6 border border-blue-200 hover:border-blue-400 transition-colors';

    const timeStr = new Date(item.time).toLocaleString('zh-CN', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let imageHtml = '';
    if (item.image) {
        imageHtml = `<img src="${item.image}" alt="图片" class="w-full rounded-lg mt-4 max-h-80 object-cover">`;
    }

    card.innerHTML = `
        <div class="flex gap-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                ${item.avatar || (item.uploader || '?').charAt(0).toUpperCase()}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                    <p class="font-semibold text-gray-800">${item.uploader || '匿名'}</p>
                    <p class="text-xs text-gray-500">${timeStr}</p>
                </div>
                <p class="text-gray-700 leading-relaxed mt-2 break-words">${item.content}</p>
                ${imageHtml}
                <div class="mt-4 flex gap-2">
                    <button class="my-edit-btn bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-600 transition-colors" data-id="${item.id}">编辑</button>
                    <button class="my-delete-btn bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-red-600 transition-colors" data-id="${item.id}">撤回/删除</button>
                </div>
            </div>
        </div>
    `;

    // 编辑按钮
    card.querySelector('.my-edit-btn').addEventListener('click', async () => {
        const newContent = prompt('编辑内容：', item.content);
        if (newContent !== null && newContent.trim()) {
            const check = validateContent(newContent.trim());
            if (!check.valid) {
                alert(check.message);
                return;
            }
            const ok = await updatePostByType(postType, item.id, { content: newContent.trim() });
            if (ok) {
                item.content = newContent.trim();
                renderFn();
                alert('编辑成功！');
            } else {
                alert('编辑失败，请重试');
            }
        }
    });

    // 删除按钮
    card.querySelector('.my-delete-btn').addEventListener('click', async () => {
        if (confirm('确定要撤回/删除这条发布吗？')) {
            const ok = await deletePostByType(postType, item.id);
            if (ok) {
                const index = dataArray.findIndex(d => d.id === item.id);
                if (index !== -1) dataArray.splice(index, 1);
                renderFn();
                alert('已撤回/删除！');
            } else {
                alert('删除失败，请重试');
            }
        }
    });

    return card;
}

// 渲染「我的发布」列表（按 user_id 筛选，支持匿名帖）
function renderMyPostsList(dataArray, postType, listId, renderFn) {
    const list = document.getElementById(listId);
    if (!list) return;

    list.innerHTML = '';

    if (!currentUser) {
        list.innerHTML = '<div class="text-center text-gray-500 py-12">请先登录</div>';
        return;
    }

    const mine = [...dataArray]
        .filter(d => d.user_id === currentUser.id)
        .sort((a, b) => new Date(b.time) - new Date(a.time));

    if (mine.length === 0) {
        list.innerHTML = '<div class="text-center text-gray-500 py-12">你还没有发布过内容</div>';
        return;
    }

    mine.forEach(item => {
        list.appendChild(renderMyPostCard(item, dataArray, postType, listId, renderFn));
    });
}

// 判断某页面是否处于「我的发布」模式，供 render 函数调用
function isMyPostsMode(type) {
    return myPostsFilter[type];
}
