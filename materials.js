// 学习资料 - 数据从 Supabase 加载
let materialsData = [];

const categoryMap = {
    'all': '全部资料',
    'exam': '考试资料',
    'review': '复习资料',
    'lecture': '课件讲义',
    'homework': '习题作业',
    'experiment': '实验资料',
    'other': '其他'
};

let currentCategory = 'all';
let currentSearchText = '';
let currentSortType = 'time';

// 从 Supabase 加载学习资料
async function loadMaterialsData() {
    const api = window.supabaseApi;
    if (!api) { materialsData = []; return; }
    materialsData = await api.getMaterials() || [];
}

// 初始化学习资料页面
async function initStudyMaterials() {
    await loadMaterialsData();
    renderCategoryList();
    renderMaterialsList();
    setupStudyMaterialsEvents();
}

// 渲染分类列表
function renderCategoryList() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;
    
    categoryList.innerHTML = '';
    
    const categories = ['all', 'exam', 'review', 'lecture', 'homework', 'experiment', 'other', 'mine'];
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `category-filter w-full text-left px-4 py-3 rounded-lg transition-colors ${cat === 'all' ? 'active bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`;
        btn.textContent = cat === 'mine' ? '我的' : categoryMap[cat];
        btn.setAttribute('data-category', cat);
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-filter').forEach(b => b.classList.remove('active', 'bg-blue-50', 'text-blue-700', 'font-medium'));
            btn.classList.add('active', 'bg-blue-50', 'text-blue-700', 'font-medium');
            currentCategory = cat;
            currentSearchText = '';
            document.getElementById('searchInput').value = '';
            renderMaterialsList();
        });
        
        categoryList.appendChild(btn);
    });
}

// 渲染资料列表
function renderMaterialsList() {
    const materialsList = document.getElementById('materialsList');
    if (!materialsList) return;
    
    let filtered = materialsData;
    
    // 按分类过滤
    if (currentCategory === 'mine') {
        if (!currentUser) {
            materialsList.innerHTML = '<div class="bg-white rounded-lg p-8 shadow-sm text-center text-gray-500">请先登录查看我的资料</div>';
            return;
        }
        filtered = filtered.filter(m => m.user_id === currentUser.id || m.uploader === (currentUser.nickname || currentUser.email));
    } else if (currentCategory !== 'all') {
        filtered = filtered.filter(m => m.category === currentCategory);
    }
    
    // 按搜索词过滤
    if (currentSearchText) {
        filtered = filtered.filter(m => m.title.toLowerCase().includes(currentSearchText.toLowerCase()));
    }
    
    // 排序
    if (currentSortType === 'time') {
        filtered.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
    } else if (currentSortType === 'name') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    materialsList.innerHTML = '';
    
    if (filtered.length === 0) {
        materialsList.innerHTML = '<div class="bg-white rounded-lg p-8 shadow-sm text-center text-gray-500">暂无资料</div>';
        return;
    }
    
    filtered.forEach(material => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all cursor-pointer material-card';
        card.setAttribute('data-id', material.id);
        
        const isOwner = currentUser && (material.user_id === currentUser.id || material.uploader === (currentUser.nickname || currentUser.email));
        const actionButtons = isOwner ? `
            <button class="edit-material-btn bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm mr-2">编辑</button>
            <button class="delete-material-btn bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm mr-2">删除</button>
        ` : '';
        
        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-800">${material.title}</h3>
                    <p class="text-sm text-gray-500 mt-2">分类：${categoryMap[material.category]} | 上传人：${material.uploader} | ${material.uploadTime}</p>
                </div>
                <div class="flex items-center ml-4">
                    ${actionButtons}
                    <button class="download-btn bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap">下载</button>
                </div>
            </div>
        `;
        
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('download-btn') && 
                !e.target.classList.contains('edit-material-btn') && 
                !e.target.classList.contains('delete-material-btn')) {
                showMaterialDetail(material.id);
            }
        });
        
        const downloadBtn = card.querySelector('.download-btn');
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!currentUser) {
                alert('请先登录');
                showPage('loginPage');
                return;
            }
            alert('下载功能已准备好，后续对接 Supabase');
        });
        
        if (isOwner) {
            const editBtn = card.querySelector('.edit-material-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editMaterial(material.id);
            });
            
            const deleteBtn = card.querySelector('.delete-material-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteMaterial(material.id);
            });
        }
        
        materialsList.appendChild(card);
    });
}

// 编辑资料
function editMaterial(materialId) {
    const material = materialsData.find(m => m.id === materialId);
    if (!material) return;
    
    const newTitle = prompt('修改文件名：', material.title);
    if (newTitle && newTitle.trim()) {
        const check = validateContent(newTitle.trim());
        if (!check.valid) {
            alert(check.message);
            return;
        }
        material.title = newTitle.trim();
        localStorage.setItem('materials', JSON.stringify(materialsData));
        renderMaterialsList();
        alert('修改成功！');
    }
}

// 删除资料
function deleteMaterial(materialId) {
    if (confirm('确定要删除这条资料吗？')) {
        const index = materialsData.findIndex(m => m.id === materialId);
        if (index !== -1) {
            materialsData.splice(index, 1);
            localStorage.setItem('materials', JSON.stringify(materialsData));
            renderMaterialsList();
            alert('删除成功！');
        }
    }
}

// 显示资料详情
function showMaterialDetail(materialId) {
    if (!currentUser) {
        alert('请先登录');
        showPage('loginPage');
        return;
    }
    
    const material = materialsData.find(m => m.id === materialId);
    if (!material) return;
    
    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = `
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-800 mb-4">${material.title}</h1>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-blue-50 rounded-lg p-4">
                    <p class="text-sm text-gray-600">分类</p>
                    <p class="text-lg font-bold text-gray-800">${categoryMap[material.category]}</p>
                </div>
                <div class="bg-blue-50 rounded-lg p-4">
                    <p class="text-sm text-gray-600">上传人</p>
                    <p class="text-lg font-bold text-gray-800">${material.uploader}</p>
                </div>
                <div class="bg-blue-50 rounded-lg p-4">
                    <p class="text-sm text-gray-600">上传时间</p>
                    <p class="text-lg font-bold text-gray-800">${material.uploadTime}</p>
                </div>
                <div class="bg-blue-50 rounded-lg p-4">
                    <p class="text-sm text-gray-600">文件大小</p>
                    <p class="text-lg font-bold text-gray-800">${material.fileSize}</p>
                </div>
            </div>
        </div>
        
        <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-800 mb-3">文件介绍</h2>
            <p class="text-gray-600 leading-relaxed">${material.description}</p>
        </div>
        
        <div class="flex gap-4">
            <button id="detailDownloadBtn" class="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors">下载文件</button>
            <button id="detailBackBtn" class="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">返回列表</button>
        </div>
    `;
    
    document.getElementById('detailDownloadBtn').addEventListener('click', () => {
        alert('下载功能已准备好，后续对接 Supabase');
    });
    
    document.getElementById('detailBackBtn').addEventListener('click', () => {
        showPage('studyMaterialsPage');
    });
    
    showPage('materialDetailPage');
}

// 设置学习资料页面事件
function setupStudyMaterialsEvents() {
    const uploadFileBtn = document.getElementById('uploadFileBtn');
    const uploadModal = document.getElementById('uploadModal');
    const closeUploadBtn = document.getElementById('closeUploadBtn');
    const uploadForm = document.getElementById('uploadForm');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const sortSelect = document.getElementById('sortSelect');
    
    if (uploadFileBtn) {
        uploadFileBtn.addEventListener('click', () => {
            if (!currentUser) {
                alert('请先登录');
                showPage('loginPage');
                return;
            }
            uploadModal.classList.remove('hidden');
        });
    }
    
    if (closeUploadBtn) {
        closeUploadBtn.addEventListener('click', () => {
            uploadModal.classList.add('hidden');
            uploadForm.reset();
        });
    }
    
    uploadModal?.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            uploadModal.classList.add('hidden');
            uploadForm.reset();
        }
    });
    
    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!currentUser) {
                alert('请先登录');
                return;
            }
            
            const fileName = document.getElementById('fileName').value;
            const fileDescription = document.getElementById('fileDescription').value;
            const category = document.getElementById('categorySelect').value;
            const fileInput = document.getElementById('fileInput');
            
            if (!fileInput.files[0] || !fileName || !category) {
                alert('请填写所有必填字段');
                return;
            }

            const titleCheck = validateContent(fileName);
            if (!titleCheck.valid) {
                alert(titleCheck.message);
                return;
            }
            const descCheck = validateContent(fileDescription);
            if (!descCheck.valid) {
                alert(descCheck.message);
                return;
            }
            
            // 创建新资料对象
            const newMaterial = {
                id: Math.max(...materialsData.map(m => m.id), 0) + 1,
                title: fileName,
                category: category,
                uploader: currentUser.nickname || currentUser.email,
                uploadTime: new Date().toISOString().split('T')[0],
                description: fileDescription || '暂无介绍',
                fileSize: (fileInput.files[0].size / 1024 / 1024).toFixed(2) + 'MB'
            };
            
            materialsData.push(newMaterial);
            localStorage.setItem('materials', JSON.stringify(materialsData));
            
            alert('上传成功！');
            uploadModal.classList.add('hidden');
            uploadForm.reset();
            renderMaterialsList();
        });
    }
    
    // 搜索按钮事件
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            currentSearchText = searchInput.value;
            renderMaterialsList();
        });
    }
    
    // 回车键搜索
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentSearchText = searchInput.value;
                renderMaterialsList();
            }
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSortType = e.target.value;
            renderMaterialsList();
        });
    }
}

// 学习资料页面权限检查
function checkStudyMaterialsAccess() {
    const studyMaterialsBtn = document.querySelector('[data-page="studyMaterialsPage"]');
    if (studyMaterialsBtn) {
        studyMaterialsBtn.addEventListener('click', () => {
            if (!currentUser) {
                alert('请先登录');
                showPage('loginPage');
                return;
            }
            showPage('studyMaterialsPage');
            initStudyMaterials();
        });
    }
}
