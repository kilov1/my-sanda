// Supabase 初始化配置
// 请按照以下步骤配置：

// 1. 访问 https://supabase.com 创建账户
// 2. 创建新项目
// 3. 在项目设置中找到 API URL 和 anon key
// 4. 将下面的值替换为你的实际值

export const supabaseConfig = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key'
};

// 5. 在 Supabase 控制面板中：
//    - 进入 Authentication > Providers
//    - 禁用 Email Confirmations（关闭邮箱验证）
//    - 保存设置

// 6. 创建 users 表（可选，用于存储用户昵称等额外信息）
//    SQL:
//    CREATE TABLE users (
//        id UUID PRIMARY KEY REFERENCES auth.users(id),
//        nickname VARCHAR(255),
//        created_at TIMESTAMP DEFAULT NOW()
//    );
