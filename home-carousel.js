/**
 * 首页走马灯轮播：建议改进、日期时间、校园日历、天气、当前在线
 * 支持点击切换、滑动切换，中间卡片突出，两侧若隐若现
 */
(function() {
    const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    // 假数据：天气
    function getFakeWeather() {
        return { city: '上海', type: '晴', temp: 18, icon: '☀️' };
    }
    const fakeWeather = getFakeWeather();

    function initDateTime() {
        const el = document.getElementById('datetimeDisplay');
        if (!el) return;
        function update() {
            const now = new Date();
            const y = now.getFullYear();
            const m = now.getMonth() + 1;
            const d = now.getDate();
            const w = WEEKDAYS[now.getDay()];
            const h = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            const sec = String(now.getSeconds()).padStart(2, '0');
            el.innerHTML = `
                <p class="text-xl md:text-2xl font-bold text-gray-800">${y}年${m}月${d}日</p>
                <p class="text-base text-blue-600 font-medium mt-1">${w}</p>
                <p class="text-2xl md:text-3xl font-bold text-blue-600 mt-2 font-mono">${h}:${min}:${sec}</p>
            `;
        }
        update();
        setInterval(update, 1000);
    }

    function initCalendar() {
        const el = document.getElementById('miniCalendar');
        if (!el) return;
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let html = '';
        ['日','一','二','三','四','五','六'].forEach(day => {
            html += `<span class="text-gray-500 font-medium">${day}</span>`;
        });
        for (let i = 0; i < firstDay; i++) {
            html += '<span></span>';
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === today;
            html += `<span class="rounded leading-8 ${isToday ? 'bg-blue-500 text-white font-bold' : 'text-gray-700'}">${d}</span>`;
        }
        el.innerHTML = html;
    }

    function initWeather() {
        const iconEl = document.getElementById('weatherIcon');
        const textEl = document.getElementById('weatherDisplay');
        if (iconEl) iconEl.textContent = fakeWeather.icon;
        if (textEl) textEl.innerHTML = `<span class="font-bold text-gray-800">${fakeWeather.temp}°C</span><br><span class="text-blue-600">${fakeWeather.city} · ${fakeWeather.type}</span>`;
    }

    // 当前在线人数：Supabase Realtime Presence，每 30 秒刷新显示
    function initOnlineCount() {
        const el = document.getElementById('onlineCountDisplay');
        if (!el) return;
        const sb = typeof window !== 'undefined' && window.supabaseClient;
        if (!sb) {
            el.innerHTML = '当前网站在线人数：<span class="font-bold text-gray-800">1</span> 人';
            return;
        }
        el.innerHTML = '当前网站在线人数：<span class="font-bold text-gray-800">--</span> 人';
        const channel = sb.channel('online-count');
        channel.on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const count = Object.keys(state).reduce((n, k) => n + (state[k]?.length || 0), 0);
            el.innerHTML = `当前网站在线人数：<span class="font-bold text-gray-800">${count}</span> 人`;
        });
        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({ user: 'u-' + Math.random().toString(36).slice(2), at: Date.now() });
            }
        });
        setInterval(() => {
            const state = channel.presenceState();
            const count = Object.keys(state).reduce((n, k) => n + (state[k]?.length || 0), 0);
            el.innerHTML = `当前网站在线人数：<span class="font-bold text-gray-800">${count}</span> 人`;
        }, 30000);
    }

    function initCarousel() {
        const wrapper = document.querySelector('.home-carousel-wrapper');
        if (!wrapper) return;

        const carousel = wrapper.querySelector('.home-carousel');
        const track = wrapper.querySelector('.carousel-track');
        const cards = wrapper.querySelectorAll('.carousel-card');
        const prevBtn = wrapper.querySelector('.carousel-prev');
        const nextBtn = wrapper.querySelector('.carousel-next');
        if (!track || !cards.length) return;

        let currentIndex = 0;
        const total = cards.length;
        const CARD_GAP = 10; /* 5 张卡片，间距紧凑，确保两侧完整显示 */

        function updateCarousel() {
            cards.forEach((card, i) => {
                let offset = i - currentIndex;
                if (offset > total / 2) offset -= total;
                if (offset < -total / 2) offset += total;
                const isCenter = offset === 0;
                const scale = isCenter ? 1 : 0.85;
                const opacity = isCenter ? 1 : 0.65;
                const zIndex = isCenter ? 10 : 1;
                const translateX = offset * (100 + CARD_GAP);
                card.style.cssText = `transform: translateX(${translateX}%) scale(${scale}); opacity: ${opacity}; z-index: ${zIndex};`;
                card.classList.toggle('carousel-center', isCenter);
            });
        }

        function goTo(index) {
            currentIndex = ((index % total) + total) % total;
            updateCarousel();
        }

        prevBtn?.addEventListener('click', () => goTo(currentIndex - 1));
        nextBtn?.addEventListener('click', () => goTo(currentIndex + 1));

        let startX = 0;
        wrapper.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
        wrapper.addEventListener('touchend', (e) => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) goTo(currentIndex + (diff > 0 ? 1 : -1));
        }, { passive: true });

        // 天气卡片点击 -> 天气详情页
        document.getElementById('weatherCard')?.addEventListener('click', () => {
            if (typeof showPage === 'function') showPage('weatherDetailPage');
        });
        // 校园日历卡片点击 -> 校园日历详情页
        document.getElementById('calendarCard')?.addEventListener('click', () => {
            if (typeof showPage === 'function') {
                showPage('calendarDetailPage');
                initCalendarDetailPage();
            }
        });

        updateCarousel();
    }

    // 校园日历详情页：整月日历 + 点击日期显示当天活动（假数据）
    function initCalendarDetailPage() {
        const grid = document.getElementById('calendarDetailGrid');
        const titleEl = document.getElementById('calendarMonthTitle');
        const prevBtn = document.getElementById('calendarPrevMonth');
        const nextBtn = document.getElementById('calendarNextMonth');
        const dayTitle = document.getElementById('calendarDayTitle');
        const dayHint = document.getElementById('calendarDayHint');
        const activitiesList = document.getElementById('calendarActivitiesList');
        if (!grid || !titleEl) return;

        let viewYear = new Date().getFullYear();
        let viewMonth = new Date().getMonth();

        const FAKE_ACTIVITIES = {
            '3-13': [{ title: '图书馆自习室开放', time: '8:00-22:00', loc: '图书馆B座' }, { title: '学生会例会', time: '14:00', loc: '行政楼301' }],
            '3-14': [{ title: '春季运动会报名截止', time: '全天', loc: '体育部' }],
            '3-15': [{ title: '春季运动会', time: '8:00-17:00', loc: '运动场' }, { title: '社团招新', time: '9:00-16:00', loc: '中心广场' }],
            '3-20': [{ title: '学术讲座：人工智能前沿', time: '15:00', loc: '报告厅' }],
        };

        function renderCalendarDetail() {
            const firstDay = new Date(viewYear, viewMonth, 1).getDay();
            const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
            const today = new Date();
            const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

            titleEl.textContent = `${viewYear}年${viewMonth + 1}月`;
            let html = '';
            ['日','一','二','三','四','五','六'].forEach(d => {
                html += `<span class="text-gray-500 font-medium py-2">${d}</span>`;
            });
            for (let i = 0; i < firstDay; i++) html += '<span class="p-2"></span>';
            for (let d = 1; d <= daysInMonth; d++) {
                const isToday = isCurrentMonth && d === today.getDate();
                const key = `${viewMonth + 1}-${d}`;
                const hasActivity = FAKE_ACTIVITIES[key];
                const cls = isToday ? 'bg-blue-500 text-white font-bold rounded-lg py-2 cursor-pointer hover:bg-blue-600' : 'text-gray-700 py-2 cursor-pointer hover:bg-blue-50 rounded-lg' + (hasActivity ? ' text-blue-600 font-medium' : '');
                html += `<span class="${cls}" data-day="${d}" data-key="${key}">${d}</span>`;
            }
            grid.innerHTML = html;

            grid.querySelectorAll('[data-day]').forEach(span => {
                span.addEventListener('click', () => {
                    const key = span.getAttribute('data-key');
                    const day = span.getAttribute('data-day');
                    dayTitle.textContent = `${viewYear}年${viewMonth + 1}月${day}日 校园活动`;
                    dayHint.classList.add('hidden');
                    activitiesList.classList.remove('hidden');
                    const activities = FAKE_ACTIVITIES[key] || [];
                    if (activities.length === 0) {
                        activitiesList.innerHTML = '<p class="text-gray-500">当日暂无活动安排</p>';
                    } else {
                        activitiesList.innerHTML = activities.map(a =>
                            `<div class="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <div class="flex-1">
                                    <p class="font-bold text-gray-800">${a.title}</p>
                                    <p class="text-sm text-gray-600 mt-1">${a.time} · ${a.loc}</p>
                                </div>
                            </div>`
                        ).join('');
                    }
                });
            });
        }

        if (prevBtn && !prevBtn.dataset.bound) {
            prevBtn.dataset.bound = '1';
            prevBtn.addEventListener('click', () => {
                viewMonth--;
                if (viewMonth < 0) { viewMonth = 11; viewYear--; }
                renderCalendarDetail();
            });
        }
        if (nextBtn && !nextBtn.dataset.bound) {
            nextBtn.dataset.bound = '1';
            nextBtn.addEventListener('click', () => {
                viewMonth++;
                if (viewMonth > 11) { viewMonth = 0; viewYear++; }
                renderCalendarDetail();
            });
        }

        renderCalendarDetail();
    }

    document.addEventListener('DOMContentLoaded', () => {
        initDateTime();
        initCalendar();
        initWeather();
        initOnlineCount();
        initCarousel();
    });
})();
