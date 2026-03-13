/**
 * 纯前端本地数据 API：示例数据 + localStorage 持久化
 * 不连接任何后端，用于 GitHub Pages 等静态托管
 */
(function() {
    const STORAGE_KEYS = {
        users: 'mysanda_users',
        lifePosts: 'mysanda_life_posts',
        materials: 'mysanda_materials',
        lostFound: 'mysanda_lost_found',
        secondhand: 'mysanda_secondhand',
        askHelp: 'mysanda_ask_help',
        feedback: 'mysanda_feedback'
    };

    function getUserId() {
        return (typeof currentUser !== 'undefined' && currentUser && currentUser.id) ? currentUser.id : null;
    }

    function load(key, defaultVal) {
        try {
            const s = localStorage.getItem(key);
            return s ? JSON.parse(s) : defaultVal;
        } catch (e) {
            return defaultVal;
        }
    }
    function save(key, val) {
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch (e) {}
    }

    // 示例数据
    const SAMPLE_LIFE = [
        { id: 1, user_id: 'demo', uploader: '校园小记者', avatar: '记', content: '今天图书馆前的樱花开了，很多同学在拍照留念。春天真的来了！', image: null, time: '2026-03-12T10:30:00', comments: [{ commenter: '小明', text: '好美啊，明天我也去看看', time: '2026-03-12T11:00:00' }], expanded: false },
        { id: 2, user_id: 'demo', uploader: '快乐学习', avatar: '快', content: '分享一个复习小技巧：用番茄工作法，25分钟专注+5分钟休息，效率很高！', image: null, time: '2026-03-11T14:20:00', comments: [], expanded: false },
        { id: 3, user_id: 'demo', uploader: '运动达人', avatar: '运', content: '傍晚操场跑了一圈，空气很好。有一起跑步的同学吗？', image: null, time: '2026-03-10T18:45:00', comments: [{ commenter: '跑步爱好者', text: '我经常去，一起啊', time: '2026-03-10T19:00:00' }], expanded: false }
    ];
    const SAMPLE_MATERIALS = [
        { id: 1, user_id: 'demo', title: '高等数学期末复习提纲', category: 'exam', uploader: '学霸小明', uploadTime: '2026-03-10', description: '涵盖本学期主要考点，含典型例题解析', fileSize: '2.3MB' },
        { id: 2, user_id: 'demo', title: '计算机网络课件第七章', category: 'lecture', uploader: '热心同学', uploadTime: '2026-03-09', description: 'TCP/IP 协议栈详解', fileSize: '5.1MB' },
        { id: 3, user_id: 'demo', title: '数据结构习题答案', category: 'homework', uploader: '学习委员', uploadTime: '2026-03-08', description: '课后习题参考答案，仅供学习参考', fileSize: '0.8MB' }
    ];
    const SAMPLE_LOST = [
        { id: 1, user_id: 'demo', uploader: '拾金不昧', avatar: '拾', content: '在食堂捡到一串钥匙，上面有蓝色挂件。请失主联系认领。', image: null, time: '2026-03-12T09:00:00', comments: [], expanded: false, anonymous: false },
        { id: 2, user_id: 'demo', uploader: '寻物者', avatar: '寻', content: '遗失黑色钱包一个，内有学生证。如有捡到请与本人联系，必有酬谢。', image: null, time: '2026-03-11T16:30:00', comments: [], expanded: false, anonymous: false }
    ];
    const SAMPLE_SECONDHAND = [
        { id: 1, user_id: 'demo', uploader: '毕业学姐', avatar: '学', content: '九成新自行车出售，毕业离校带不走。原价800，现价300，可小刀。', image: null, time: '2026-03-12T11:00:00', comments: [], expanded: false, anonymous: false },
        { id: 2, user_id: 'demo', uploader: '换新', avatar: '换', content: '求购二手台灯一个，最好带usb充电。宿舍用。', image: null, time: '2026-03-11T14:00:00', comments: [], expanded: false, anonymous: false }
    ];
    const SAMPLE_ASK = [
        { id: 1, user_id: 'demo', uploader: '新生小王', avatar: '王', content: '请问选课系统什么时候开放？大一新生不太懂流程。', image: null, time: '2026-03-12T08:30:00', comments: [{ commenter: '学长', text: '一般是开学后第一周，关注教务处官网通知', time: '2026-03-12T09:00:00' }], expanded: false, anonymous: false },
        { id: 2, user_id: 'demo', uploader: '匿名用户', avatar: '?', content: '想问问大家有没有好的英语四级备考资料推荐？', image: null, time: '2026-03-11T20:00:00', comments: [], expanded: false, anonymous: true }
    ];
    const SAMPLE_FEEDBACK = [
        { id: 1, uploader: '热心用户', content: '建议增加夜间模式，晚上使用更护眼。', time: '2026-03-10T15:00:00' },
        { id: 2, uploader: '小建议', content: '校园动态可以增加分类筛选功能，方便查找。', time: '2026-03-09T10:30:00' }
    ];

    function ensureSampleData() {
        if (!load(STORAGE_KEYS.lifePosts)) save(STORAGE_KEYS.lifePosts, SAMPLE_LIFE);
        if (!load(STORAGE_KEYS.materials)) save(STORAGE_KEYS.materials, SAMPLE_MATERIALS);
        if (!load(STORAGE_KEYS.lostFound)) save(STORAGE_KEYS.lostFound, SAMPLE_LOST);
        if (!load(STORAGE_KEYS.secondhand)) save(STORAGE_KEYS.secondhand, SAMPLE_SECONDHAND);
        if (!load(STORAGE_KEYS.askHelp)) save(STORAGE_KEYS.askHelp, SAMPLE_ASK);
        if (!load(STORAGE_KEYS.feedback)) save(STORAGE_KEYS.feedback, SAMPLE_FEEDBACK);
    }
    ensureSampleData();

    window.localApi = {
        getLifePosts: () => load(STORAGE_KEYS.lifePosts, SAMPLE_LIFE),
        setLifePosts: (arr) => save(STORAGE_KEYS.lifePosts, arr),
        getMaterials: () => load(STORAGE_KEYS.materials, SAMPLE_MATERIALS),
        setMaterials: (arr) => save(STORAGE_KEYS.materials, arr),
        getLostFound: () => load(STORAGE_KEYS.lostFound, SAMPLE_LOST),
        setLostFound: (arr) => save(STORAGE_KEYS.lostFound, arr),
        getSecondhand: () => load(STORAGE_KEYS.secondhand, SAMPLE_SECONDHAND),
        setSecondhand: (arr) => save(STORAGE_KEYS.secondhand, arr),
        getAskHelp: () => load(STORAGE_KEYS.askHelp, SAMPLE_ASK),
        setAskHelp: (arr) => save(STORAGE_KEYS.askHelp, arr),
        getFeedback: () => load(STORAGE_KEYS.feedback, SAMPLE_FEEDBACK),
        setFeedback: (arr) => save(STORAGE_KEYS.feedback, arr)
    };
})();
