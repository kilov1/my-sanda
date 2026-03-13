// 当前用户（Supabase Auth 或本地 localStorage 模式）
let currentUser = null;
const USERS_KEY = 'mysanda_users';
const SESSION_KEY = 'mysanda_session';

// 页面历史栈（用于返回上一页）
let pageHistory = [];

// 是否使用 Supabase（有有效连接时）
function useSupabase() {
    return window.supabaseClient && typeof window.supabaseClient.auth !== 'undefined';
}

// 从 Supabase 加载当前用户（含 profile）
async function loadCurrentUserFromSupabase() {
    const sb = window.supabaseClient;
    if (!sb) return null;
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) return null;
    const u = session.user;
    let nickname = u.email?.split('@')[0] || '用户';
    let avatar = 5;
    if (window.supabaseApi) {
        const profile = await window.supabaseApi.getProfile(u.id);
        if (profile) {
            nickname = profile.nickname || nickname;
            avatar = profile.avatar ?? 5;
        }
    }
    return { id: u.id, email: u.email, nickname, avatar };
}

// 初始化（Supabase 或纯前端本地）
async function initLocal() {
    if (useSupabase()) {
        const sb = window.supabaseClient;
        currentUser = await loadCurrentUserFromSupabase();
        sb.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                showPage('resetPasswordPage');
                return;
            }
            currentUser = session?.user ? await loadCurrentUserFromSupabase() : null;
            await checkAuthStatus();
        });
    } else {
        const session = localStorage.getItem(SESSION_KEY);
        if (session) {
            try {
                const { email } = JSON.parse(session);
                const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
                const u = users[email];
                if (u) {
                    currentUser = { id: email, email, nickname: u.nickname || email.split('@')[0], avatar: 5 };
                } else {
                    localStorage.removeItem(SESSION_KEY);
                }
            } catch (e) {
                localStorage.removeItem(SESSION_KEY);
            }
        }
    }
    await checkAuthStatus();
}

// 检查认证状态
async function checkAuthStatus() {
    updateNavBar();
    if (typeof updateNavBarUserInfo === 'function') updateNavBarUserInfo();
}

// 更新导航栏
function updateNavBar() {
    const loginBtn = document.getElementById('navLoginBtn');
    const registerBtn = document.getElementById('navRegisterBtn');
    const logoutBtn = document.getElementById('navLogoutBtn');

    if (currentUser) {
        loginBtn.classList.add('hidden');
        registerBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        updateNavBarUserInfo();
    } else {
        loginBtn.classList.remove('hidden');
        registerBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.classList.add('hidden');
            userInfo.classList.remove('flex');
        }
    }
}

// 页面导航（支持历史栈返回上一页）
function showPage(pageId, skipHistory) {
    const activePage = document.querySelector('.page.active');
    if (activePage && activePage.id && !skipHistory && activePage.id !== pageId) {
        pageHistory.push(activePage.id);
    }
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
    
    if (pageId === 'homePage') {
        toggleNavBackButton(false);
        pageHistory = [];
    } else {
        toggleNavBackButton(true);
    }
    if (pageId === 'studyMaterialsPage' && typeof initStudyMaterials === 'function') initStudyMaterials();
    if (pageId === 'campusLifePage' && typeof initCampusLife === 'function') initCampusLife();
    if (pageId === 'lostFoundPage' && typeof initLostFound === 'function') initLostFound();
    if (pageId === 'secondhandPage' && typeof initSecondhand === 'function') initSecondhand();
    if (pageId === 'askHelpPage' && typeof initAskHelp === 'function') initAskHelp();
    if (pageId === 'feedbackPage' && typeof initFeedback === 'function') initFeedback();
    if (pageId === 'profilePage' && typeof initProfilePage === 'function' && currentUser) initProfilePage();
}

// 返回上一页
function goBack() {
    if (pageHistory.length > 0) {
        const prev = pageHistory.pop();
        const catBtn = document.querySelector('.category-btn[data-page="' + prev + '"]');
        if (catBtn) {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            catBtn.classList.add('active');
        }
        showPage(prev, true);
    } else {
        showPage('homePage');
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        const homeBtn = document.querySelector('.category-btn[data-page="homePage"]');
        if (homeBtn) homeBtn.classList.add('active');
    }
}

// 密码强度检查
function checkPasswordStrength(password) {
    if (!password) return 'none';
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    if (strength <= 1) return 'weak';
    if (strength <= 2) return 'medium';
    return 'strong';
}

// 更新密码强度条
function updatePasswordStrength(inputId, strengthId) {
    const input = document.getElementById(inputId);
    const strengthBar = document.getElementById(strengthId);
    if (!input || !strengthBar) return;
    input.addEventListener('input', () => {
        const strength = checkPasswordStrength(input.value);
        strengthBar.className = 'password-strength';
        if (strength !== 'none') {
            strengthBar.classList.add(strength);
        }
    });
}

// 注册表单处理
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value.trim();
    const nickname = document.getElementById('registerNickname').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }
    if (checkPasswordStrength(password) === 'weak') {
        alert('密码强度过弱，请使用更复杂的密码');
        return;
    }

    const agreeTerms = document.getElementById('agreeTerms');
    if (!agreeTerms || !agreeTerms.checked) {
        alert('请先阅读并勾选同意用户政策、免责声明、隐私政策');
        return;
    }

    const nicknameCheck = validateNickname(nickname);
    if (!nicknameCheck.valid) {
        alert(nicknameCheck.message);
        return;
    }
    
    if (useSupabase()) {
        if (!email || !email.includes('@')) {
            alert('Supabase 模式需要填写真实邮箱格式');
            return;
        }
        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email,
                password,
                options: { data: { nickname } }
            });
            if (error) throw error;
            if (data?.user?.identities?.length === 0) {
                alert('该邮箱已注册，请直接登录');
                return;
            }
            alert('注册成功！请查收邮箱验证链接，验证后可登录');
            showPage('loginPage');
            document.getElementById('registerForm').reset();
        } catch (err) {
            alert(err.message || '注册失败');
        }
        return;
    }
    
    const emailLike = (v) => v && (v.includes('@') || v.trim().length >= 2);
    if (!emailLike(email)) {
        alert('请填写格式像邮箱的内容（如 xxx@xxx 或任意标识）');
        return;
    }
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    if (users[email]) {
        alert('该账号已注册，请直接登录');
        return;
    }
    users[email] = { password, nickname };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    alert('注册成功！请登录');
    showPage('loginPage');
    document.getElementById('registerForm').reset();
});

// 登录表单处理
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) {
        alert('请填写账号和密码');
        return;
    }
    if (useSupabase()) {
        try {
            const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            currentUser = await loadCurrentUserFromSupabase();
            await checkAuthStatus();
            showPage('homePage');
            document.getElementById('loginForm').reset();
        } catch (err) {
            alert(err.message || '登录失败');
        }
        return;
    }
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    const u = users[email];
    if (!u || u.password !== password) {
        alert('账号或密码错误');
        return;
    }
    currentUser = { id: email, email, nickname: u.nickname || email.split('@')[0], avatar: 5 };
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
    await checkAuthStatus();
    showPage('homePage');
    document.getElementById('loginForm').reset();
});

// 忘记密码
document.getElementById('forgotPasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    if (useSupabase()) {
        if (!email || !email.includes('@')) {
            alert('请输入注册时的邮箱');
            return;
        }
        try {
            const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + window.location.pathname
            });
            if (error) throw error;
            alert('重置链接已发送到您的邮箱，请查收');
        } catch (err) {
            alert(err.message || '发送失败');
        }
        return;
    }
    sessionStorage.setItem('mysanda_reset_email', email || 'reset@local');
    showPage('resetPasswordPage');
});

// 重置密码
document.getElementById('resetPasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('resetPassword').value;
    const confirmPassword = document.getElementById('resetConfirmPassword').value;
    if (newPassword !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }
    if (checkPasswordStrength(newPassword) === 'weak') {
        alert('密码强度过弱，请使用更复杂的密码');
        return;
    }
    if (useSupabase()) {
        try {
            const { error } = await window.supabaseClient.auth.updateUser({ password: newPassword });
            if (error) throw error;
            alert('密码重置成功，请使用新密码登录');
            currentUser = await loadCurrentUserFromSupabase();
            await checkAuthStatus();
            document.getElementById('resetPasswordForm').reset();
            showPage('homePage');
        } catch (err) {
            alert(err.message || '重置失败');
        }
        return;
    }
    const email = sessionStorage.getItem('mysanda_reset_email') || '';
    sessionStorage.removeItem('mysanda_reset_email');
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    if (users[email]) {
        users[email].password = newPassword;
    } else {
        users[email] = { password: newPassword, nickname: (email.split('@')[0] || '用户') };
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    alert('密码重置成功，请使用该账号登录');
    currentUser = null;
    localStorage.removeItem(SESSION_KEY);
    checkAuthStatus();
    showPage('loginPage');
    document.getElementById('resetPasswordForm').reset();
});

// 退出登录
document.getElementById('navLogoutBtn')?.addEventListener('click', async () => {
    if (useSupabase()) {
        await window.supabaseClient.auth.signOut();
    } else {
        localStorage.removeItem(SESSION_KEY);
    }
    currentUser = null;
    checkAuthStatus();
    showPage('homePage');
});

// 页面导航事件
document.getElementById('navLoginBtn')?.addEventListener('click', () => showPage('loginPage'));
document.getElementById('navRegisterBtn')?.addEventListener('click', () => showPage('registerPage'));
document.getElementById('goToRegister')?.addEventListener('click', () => showPage('registerPage'));
document.getElementById('goToLogin')?.addEventListener('click', () => showPage('loginPage'));
document.getElementById('forgotPasswordLink')?.addEventListener('click', () => showPage('forgotPasswordPage'));
document.getElementById('backToLogin')?.addEventListener('click', () => showPage('loginPage'));
document.getElementById('backToLoginFromReset')?.addEventListener('click', () => showPage('loginPage'));

// 底部链接及首页链接：用户协议、免责声明、隐私政策
['linkUserAgreement', 'linkUserAgreementFooter', 'linkUserAgreementHome'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('userAgreementPage');
    });
});
['linkDisclaimer', 'linkDisclaimerFooter', 'linkDisclaimerHome'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('disclaimerPage');
    });
});
['linkPrivacyPolicy', 'linkPrivacyPolicyFooter', 'linkPrivacyPolicyHome'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('privacyPolicyPage');
    });
});

// 注册页协议链接（打开对应页面）
document.getElementById('linkUserAgreementFromReg')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showPage('userAgreementPage');
});
document.getElementById('linkDisclaimerFromReg')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showPage('disclaimerPage');
});
document.getElementById('linkPrivacyFromReg')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showPage('privacyPolicyPage');
});

// 分类按钮导航
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const pageId = btn.getAttribute('data-page');
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showPage(pageId);
    });
});

// 返回按钮事件 - 返回上一页
function setupBackButtons() {
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            goBack();
        });
    });
}

// 学习资料页面设置
function setupStudyMaterialsPage() {
    // 上传文件按钮
    const uploadFileBtn = document.getElementById('uploadFileBtn');
    const uploadModal = document.getElementById('uploadModal');
    const closeUploadBtn = document.getElementById('closeUploadBtn');
    const uploadForm = document.getElementById('uploadForm');
    
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
    
    // 点击弹窗外部关闭
    uploadModal?.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            uploadModal.classList.add('hidden');
            uploadForm.reset();
        }
    });
    
    // 上传表单提交
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!currentUser) {
                alert('请先登录');
                return;
            }
            
            const fileInput = document.getElementById('fileInput');
            const fileName = document.getElementById('fileName').value;
            const category = document.getElementById('categorySelect').value;
            const file = fileInput.files[0];
            
            if (!file || !fileName || !category) {
                alert('请填写所有字段');
                return;
            }
            
            try {
                // 这里后续对接 Supabase Storage
                alert('文件上传功能已准备好，后续对接 Supabase');
                uploadModal.classList.add('hidden');
                uploadForm.reset();
            } catch (error) {
                alert('上传失败：' + error.message);
            }
        });
    }
    
    // 分类过滤
    const categoryFilters = document.querySelectorAll('.category-filter');
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            categoryFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            // 这里后续实现过滤逻辑
        });
    });
    
    // 搜索功能
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            // 这里后续实现搜索逻辑
        });
    }
    
    // 排序功能
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            // 这里后续实现排序逻辑
        });
    }
    
    // 下载按钮
    const downloadBtns = document.querySelectorAll('.download-btn');
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!currentUser) {
                alert('请先登录');
                showPage('loginPage');
                return;
            }
            // 这里后续对接 Supabase 下载
            alert('下载功能已准备好，后续对接 Supabase');
        });
    });
}


// 初始化密码强度检查
updatePasswordStrength('registerPassword', 'passwordStrength');
updatePasswordStrength('registerConfirmPassword', 'confirmPasswordStrength');
updatePasswordStrength('resetPassword', 'resetPasswordStrength');
updatePasswordStrength('resetConfirmPassword', 'resetConfirmPasswordStrength');

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    initLocal();
    setupBackButtons();
    setupNavBackButton();
    setupMyPostsButtons();
});
