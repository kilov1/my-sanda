// 当前用户（从 Supabase Auth + profiles 同步）
let currentUser = null;

// 初始化
async function initSupabase() {
    const sb = window.supabaseClient;
    if (sb) {
        sb.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                showPage('resetPasswordPage');
                if (window.history.replaceState) {
                    window.history.replaceState(null, '', window.location.pathname || '/');
                }
            }
        });
    }
    const hash = (window.location.hash || '').toLowerCase();
    if (hash.includes('type=recovery')) {
        showPage('resetPasswordPage');
        if (window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname || '/');
        }
    }
    await checkAuthStatus();
}

// 检查认证状态（Supabase Auth + profiles）
async function checkAuthStatus() {
    const sb = window.supabaseClient;
    if (!sb) {
        updateNavBar();
        return;
    }
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) {
        const profile = await (window.supabaseApi?.getProfile(session.user.id) || Promise.resolve(null));
        currentUser = {
            id: session.user.id,
            email: session.user.email,
            nickname: profile?.nickname || session.user.email?.split('@')[0],
            avatar: profile?.avatar ?? 5,
            gender: profile?.gender,
            birthday: profile?.birthday,
            school: profile?.school,
            college: profile?.college,
            major: profile?.major,
            bio: profile?.bio,
            isAdmin: profile?.is_admin || false
        };
    } else {
        currentUser = null;
    }
    updateNavBar();
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

// 页面导航
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
    
    // 显示/隐藏导航栏返回按钮
    if (pageId === 'homePage') {
        toggleNavBackButton(false);
    } else {
        toggleNavBackButton(true);
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
    
    const email = document.getElementById('registerEmail').value;
    const nickname = document.getElementById('registerNickname').value;
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

    // 必须勾选同意用户协议、免责声明、隐私政策
    const agreeTerms = document.getElementById('agreeTerms');
    if (!agreeTerms || !agreeTerms.checked) {
        alert('请先阅读并勾选同意用户协议、免责声明、隐私政策');
        return;
    }

    // 昵称敏感词过滤
    const nicknameCheck = validateNickname(nickname);
    if (!nicknameCheck.valid) {
        alert(nicknameCheck.message);
        return;
    }
    
    const sb = window.supabaseClient;
    if (!sb) { alert('服务暂不可用'); return; }
    
    try {
        const { data, error } = await sb.auth.signUp({
            email,
            password,
            options: { data: { nickname } }
        });
        if (error) {
            alert(error.message === 'User already registered' ? '该邮箱已注册' : (error.message || '注册失败'));
            return;
        }
        alert('注册成功！请查收验证邮件，验证邮箱后才能登录');
        showPage('loginPage');
        document.getElementById('registerForm').reset();
    } catch (error) {
        alert('注册失败：' + (error.message || '未知错误'));
    }
});

// 登录表单处理
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const sb = window.supabaseClient;
    if (!sb) { alert('服务暂不可用'); return; }
    
    try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) {
            const msg = (error.message || '').toLowerCase();
            if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
                alert('邮箱尚未验证，请查收验证邮件并点击链接完成验证后再登录');
            } else {
                alert('邮箱或密码错误');
            }
            return;
        }
        await checkAuthStatus();
        showPage('homePage');
        document.getElementById('loginForm').reset();
    } catch (error) {
        const msg = (error?.message || '').toLowerCase();
        if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
            alert('邮箱尚未验证，请查收验证邮件并点击链接完成验证后再登录');
        } else {
            alert('登录失败：' + (error?.message || '未知错误'));
        }
    }
});

// 忘记密码表单处理（Supabase 邮件重置）
document.getElementById('forgotPasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value.trim();
    if (!email) { alert('请输入邮箱'); return; }
    
    const sb = window.supabaseClient;
    if (!sb) { alert('服务暂不可用'); return; }
    
    try {
        let redirectTo = null;
        if (window.location.href && window.location.href.startsWith('http')) {
            redirectTo = window.location.href.split('?')[0].split('#')[0];
            if (redirectTo.endsWith('/') && redirectTo.length > 1) redirectTo = redirectTo.slice(0, -1);
        }
        if (!redirectTo || !redirectTo.startsWith('http')) {
            alert('找回密码需要在网站环境下使用。请通过 http://localhost 或 https://你的域名 访问后重试。');
            return;
        }
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) {
            alert(error.message || '发送失败');
            return;
        }
        alert('已发送重置密码链接到您的邮箱，请查收邮件并点击链接设置新密码');
        showPage('loginPage');
    } catch (error) {
        alert('错误：' + (error?.message || '未知错误'));
    }
});

// 重置密码表单处理（用于从邮件链接进入后的新密码设置）
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
    
    const sb = window.supabaseClient;
    if (!sb) { alert('服务暂不可用'); return; }
    
    try {
        const { error } = await sb.auth.updateUser({ password: newPassword });
        if (error) {
            alert(error.message || '密码重置失败');
            return;
        }
        alert('密码重置成功，请重新登录');
        await sb.auth.signOut();
        await checkAuthStatus();
        showPage('loginPage');
        document.getElementById('resetPasswordForm').reset();
    } catch (error) {
        alert('密码重置失败：' + (error?.message || '未知错误'));
    }
});

// 退出登录
document.getElementById('navLogoutBtn')?.addEventListener('click', async () => {
    try {
        const sb = window.supabaseClient;
        if (sb) await sb.auth.signOut();
        currentUser = null;
        await checkAuthStatus();
        showPage('homePage');
    } catch (error) {
        alert('退出登录失败：' + (error.message || '未知错误'));
    }
});

// 页面导航事件
document.getElementById('navLoginBtn')?.addEventListener('click', () => showPage('loginPage'));
document.getElementById('navRegisterBtn')?.addEventListener('click', () => showPage('registerPage'));
document.getElementById('goToRegister')?.addEventListener('click', () => showPage('registerPage'));
document.getElementById('goToLogin')?.addEventListener('click', () => showPage('loginPage'));
document.getElementById('forgotPasswordLink')?.addEventListener('click', () => showPage('forgotPasswordPage'));
document.getElementById('backToLogin')?.addEventListener('click', () => showPage('loginPage'));
document.getElementById('backToLoginFromReset')?.addEventListener('click', () => showPage('loginPage'));

// 底部链接：用户协议、免责声明、隐私政策（页脚与注册页共用逻辑）
['linkUserAgreement', 'linkUserAgreementFooter'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('userAgreementPage');
    });
});
['linkDisclaimer', 'linkDisclaimerFooter'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('disclaimerPage');
    });
});
['linkPrivacyPolicy', 'linkPrivacyPolicyFooter'].forEach(id => {
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

// 返回按钮事件 - 所有返回按钮都返回首页
function setupBackButtons() {
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('homePage');
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.category-btn[data-page="homePage"]').classList.add('active');
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

// 学习资料页面权限检查
const studyMaterialsBtn = document.querySelector('[data-page="studyMaterialsPage"]');
if (studyMaterialsBtn) {
    studyMaterialsBtn.addEventListener('click', () => {
        if (!currentUser) {
            alert('请先登录');
            showPage('loginPage');
            return;
        }
        showPage('studyMaterialsPage');
    });
}

// 初始化密码强度检查
updatePasswordStrength('registerPassword', 'passwordStrength');
updatePasswordStrength('registerConfirmPassword', 'confirmPasswordStrength');
updatePasswordStrength('resetPassword', 'resetPasswordStrength');
updatePasswordStrength('resetConfirmPassword', 'resetConfirmPasswordStrength');

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
    setupBackButtons();
    setupNavBackButton();
    checkStudyMaterialsAccess();
    checkCampusLifeAccess();
    checkCommunityAccess();
    checkFeedbackAccess();
    setupMyPostsButtons();
});
