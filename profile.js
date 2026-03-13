// 默认头像颜色方案
const avatarColors = [
    { bg: 'from-red-400 to-red-600', text: 'R' },
    { bg: 'from-orange-400 to-orange-600', text: 'O' },
    { bg: 'from-yellow-400 to-yellow-600', text: 'Y' },
    { bg: 'from-green-400 to-green-600', text: 'G' },
    { bg: 'from-teal-400 to-teal-600', text: 'T' },
    { bg: 'from-blue-400 to-blue-600', text: 'B' },
    { bg: 'from-indigo-400 to-indigo-600', text: 'I' },
    { bg: 'from-purple-400 to-purple-600', text: 'P' },
    { bg: 'from-pink-400 to-pink-600', text: 'K' },
    { bg: 'from-rose-400 to-rose-600', text: 'S' },
    { bg: 'from-cyan-400 to-cyan-600', text: 'C' },
    { bg: 'from-lime-400 to-lime-600', text: 'L' }
];

// 初始化个人资料页面
function initProfilePage() {
    renderAvatarGrid();
    loadProfileData();
    setupProfileEvents();
}

// 渲染头像选择网格
function renderAvatarGrid() {
    const avatarGrid = document.getElementById('avatarGrid');
    if (!avatarGrid) return;
    
    avatarGrid.innerHTML = '';
    
    avatarColors.forEach((avatar, index) => {
        const avatarDiv = document.createElement('div');
        avatarDiv.className = `w-16 h-16 rounded-full bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-white font-bold text-xl cursor-pointer hover:scale-110 transition-transform avatar-option`;
        avatarDiv.textContent = (currentUser.nickname || currentUser.email).charAt(0).toUpperCase();
        avatarDiv.setAttribute('data-avatar', index);
        
        // 如果是当前选中的头像，添加边框
        if (currentUser.avatar === index) {
            avatarDiv.classList.add('ring-4', 'ring-blue-500');
        }
        
        avatarDiv.addEventListener('click', () => {
            document.querySelectorAll('.avatar-option').forEach(el => {
                el.classList.remove('ring-4', 'ring-blue-500');
            });
            avatarDiv.classList.add('ring-4', 'ring-blue-500');
            currentUser.avatar = index;
        });
        
        avatarGrid.appendChild(avatarDiv);
    });
}

// 加载个人资料数据
function loadProfileData() {
    if (!currentUser) return;
    
    document.getElementById('profileNickname').value = currentUser.nickname || '';
    document.getElementById('profileGender').value = currentUser.gender || '';
    document.getElementById('profileBirthday').value = currentUser.birthday || '';
    document.getElementById('profileSchool').value = currentUser.school || '';
    document.getElementById('profileCollege').value = currentUser.college || '';
    document.getElementById('profileMajor').value = currentUser.major || '';
    document.getElementById('profileBio').value = currentUser.bio || '';
}

// 设置个人资料页面事件
function setupProfileEvents() {
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cancelProfileBtn = document.getElementById('cancelProfileBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            if (!currentUser) return;
            
            const nickname = document.getElementById('profileNickname').value.trim();
            const gender = document.getElementById('profileGender').value;
            const birthday = document.getElementById('profileBirthday').value;
            const school = document.getElementById('profileSchool').value.trim();
            const college = document.getElementById('profileCollege').value.trim();
            const major = document.getElementById('profileMajor').value.trim();
            const bio = document.getElementById('profileBio').value.trim();
            
            if (!nickname) {
                alert('请输入昵称');
                return;
            }

            // 个人资料敏感词过滤（管理员除外）
            const fieldsToCheck = [
                { value: nickname, type: 'profile' },
                { value: school, type: 'profile' },
                { value: college, type: 'profile' },
                { value: major, type: 'profile' },
                { value: bio, type: 'profile' }
            ];
            for (const field of fieldsToCheck) {
                if (field.value) {
                    const check = validateProfile(field.value);
                    if (!check.valid) {
                        alert(check.message);
                        return;
                    }
                }
            }
            
            // 更新当前用户信息
            currentUser.nickname = nickname;
            currentUser.gender = gender;
            currentUser.birthday = birthday;
            currentUser.school = school;
            currentUser.college = college;
            currentUser.major = major;
            currentUser.bio = bio;
            
            // 保存到 Supabase 或本地
            const sb = window.supabaseClient;
            if (sb && window.supabaseApi) {
                const ok = await window.supabaseApi.upsertProfile(currentUser.id, {
                    nickname, gender, birthday: birthday || null, school, college, major, bio,
                    avatar: currentUser.avatar
                });
                if (!ok) {
                    alert('保存失败，请稍后重试');
                    return;
                }
            } else {
                // 本地模式：保存到 localStorage users
                const USERS_KEY = 'mysanda_users';
                const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
                const u = users[currentUser.email];
                if (u) {
                    u.nickname = nickname;
                    users[currentUser.email] = u;
                    localStorage.setItem(USERS_KEY, JSON.stringify(users));
                    currentUser.nickname = nickname;
                    currentUser.gender = gender;
                    currentUser.birthday = birthday;
                    currentUser.school = school;
                    currentUser.college = college;
                    currentUser.major = major;
                    currentUser.bio = bio;
                }
            }
            
            // 更新导航栏显示
            updateNavBar();
            
            alert('保存成功！');
            showPage('homePage');
        });
    }
    
    if (cancelProfileBtn) {
        cancelProfileBtn.addEventListener('click', () => {
            showPage('homePage');
        });
    }
    
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            showPage('changePasswordPage');
            setupChangePasswordEvents();
        });
    }
}

// 更新导航栏显示用户信息
function updateNavBarUserInfo() {
    const userInfo = document.getElementById('userInfo');
    const userAvatar = document.getElementById('userAvatar');
    const userNickname = document.getElementById('userNickname');
    
    if (currentUser) {
        const avatarIndex = currentUser.avatar || 5; // 默认蓝色
        const avatarColor = avatarColors[avatarIndex];
        
        userAvatar.className = `w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor.bg} flex items-center justify-center text-white font-bold`;
        userAvatar.textContent = (currentUser.nickname || currentUser.email).charAt(0).toUpperCase();
        userNickname.textContent = currentUser.nickname || currentUser.email.split('@')[0];
        
        userInfo.classList.remove('hidden');
        userInfo.classList.add('flex');
        
        // 点击头像或昵称进入个人资料页面
        userInfo.onclick = () => {
            showPage('profilePage');
            initProfilePage();
        };
    } else {
        userInfo.classList.add('hidden');
        userInfo.classList.remove('flex');
    }
}

// 设置导航栏返回按钮（返回上一页）
function setupNavBackButton() {
    const navBackBtn = document.querySelector('.nav-back-btn');
    if (navBackBtn) {
        navBackBtn.addEventListener('click', () => {
            if (typeof goBack === 'function') goBack();
        });
    }
}

// 显示/隐藏导航栏返回按钮
function toggleNavBackButton(show) {
    const navBackBtn = document.querySelector('.nav-back-btn');
    if (navBackBtn) {
        if (show) {
            navBackBtn.classList.remove('hidden');
        } else {
            navBackBtn.classList.add('hidden');
        }
    }
}

// 设置更改密码页面事件
function setupChangePasswordEvents() {
    const changePasswordForm = document.getElementById('changePasswordForm');
    const cancelChangePasswordBtn = document.getElementById('cancelChangePasswordBtn');
    const forgotPasswordInChangeBtn = document.getElementById('forgotPasswordInChangeBtn');
    
    // 初始化密码强度检查
    updatePasswordStrength('newPassword', 'newPasswordStrength');
    updatePasswordStrength('confirmNewPassword', 'confirmNewPasswordStrength');
    
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!currentUser) return;
            
            const oldPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;
            
            if (newPassword !== confirmNewPassword) {
                alert('两次输入的新密码不一致');
                return;
            }
            
            if (checkPasswordStrength(newPassword) === 'weak') {
                alert('密码强度过弱，请使用更复杂的密码');
                return;
            }
            
            // 使用 Supabase 更新密码（需先验证旧密码通过 reauthenticate）
            const supabase = window.supabaseClient;
            if (!supabase) { alert('服务暂不可用'); return; }
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
                alert(error.message === 'New password should be different from the old password.' ? '新密码不能与旧密码相同' : (error.message || '密码更新失败'));
                return;
            }
            
            alert('密码修改成功！');
            changePasswordForm.reset();
            showPage('profilePage');
        });
    }
    
    if (cancelChangePasswordBtn) {
        cancelChangePasswordBtn.addEventListener('click', () => {
            document.getElementById('changePasswordForm').reset();
            showPage('profilePage');
        });
    }
    
    if (forgotPasswordInChangeBtn) {
        forgotPasswordInChangeBtn.addEventListener('click', () => {
            showPage('resetPasswordFromProfilePage');
            setupResetPasswordFromProfileEvents();
        });
    }
}

// 设置从个人资料重置密码页面事件
function setupResetPasswordFromProfileEvents() {
    const resetPasswordFromProfileForm = document.getElementById('resetPasswordFromProfileForm');
    const cancelResetPasswordBtn = document.getElementById('cancelResetPasswordBtn');
    const currentEmailDisplay = document.getElementById('currentEmailDisplay');
    
    // 显示当前邮箱
    if (currentEmailDisplay && currentUser) {
        currentEmailDisplay.textContent = currentUser.email;
    }
    
    // 初始化密码强度检查
    updatePasswordStrength('resetNewPassword', 'resetNewPasswordStrength');
    updatePasswordStrength('resetConfirmNewPassword', 'resetConfirmNewPasswordStrength');
    
    if (resetPasswordFromProfileForm) {
        resetPasswordFromProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!currentUser) return;
            
            const newPassword = document.getElementById('resetNewPassword').value;
            const confirmNewPassword = document.getElementById('resetConfirmNewPassword').value;
            
            if (newPassword !== confirmNewPassword) {
                alert('两次输入的新密码不一致');
                return;
            }
            
            if (checkPasswordStrength(newPassword) === 'weak') {
                alert('密码强度过弱，请使用更复杂的密码');
                return;
            }
            
            const supabase = window.supabaseClient;
            if (!supabase) { alert('服务暂不可用'); return; }
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
                alert(error.message || '密码重置失败');
                return;
            }
            
            alert('密码重置成功！');
            resetPasswordFromProfileForm.reset();
            showPage('profilePage');
        });
    }
    
    if (cancelResetPasswordBtn) {
        cancelResetPasswordBtn.addEventListener('click', () => {
            document.getElementById('resetPasswordFromProfileForm').reset();
            showPage('changePasswordPage');
        });
    }
}
