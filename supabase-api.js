/**
 * Supabase 统一数据 API
 * 所有数据读写通过此模块，替代 localStorage
 */
(function() {
    function sb() { return window.supabaseClient || null; }

    function getUserId() {
        return (typeof currentUser !== 'undefined' && currentUser && currentUser.id) ? currentUser.id : null;
    }

    // ========== Profiles ==========
    window.supabaseApi = {
        async getProfile(userId) {
            const s = sb(); if (!s) return null;
            const { data, error } = await s.from('profiles').select('*').eq('id', userId).single();
            return error ? null : data;
        },
        async upsertProfile(userId, data) {
            const s = sb(); if (!s) return false;
            const { error } = await s.from('profiles').upsert({ id: userId, ...data, updated_at: new Date().toISOString() }, { onConflict: 'id' });
            return !error;
        },

        // ========== Life Posts (校园生活) ==========
        async getLifePosts() {
            const s = sb(); if (!s) return [];
            const { data, error } = await s.from('life_posts').select('*').order('created_at', { ascending: false });
            return error ? [] : (data || []).map(rowToLife);
        },
        async insertLifePost(post) {
            const s = sb(); if (!s) return null;
            const row = lifeToRow(post);
            const { data, error } = await s.from('life_posts').insert(row).select('id').single();
            return error ? null : (data ? { ...post, id: data.id } : null);
        },
        async updateLifePost(id, updates) {
            const s = sb(); if (!s) return false;
            const { error } = await s.from('life_posts').update(updates).eq('id', id);
            return !error;
        },
        async deleteLifePost(id) {
            const s = sb(); if (!s) return false;
            const { error } = await s.from('life_posts').delete().eq('id', id);
            return !error;
        },

        // ========== Lost Found ==========
        async getLostFoundPosts() {
            const s = sb(); if (!s) return [];
            const { data, error } = await s.from('lost_found_posts').select('*').order('created_at', { ascending: false });
            return error ? [] : (data || []).map(rowToCommunity);
        },
        async insertLostFoundPost(post) {
            const s = sb(); if (!s) return null;
            const row = communityToRow(post, 'lost_found');
            const { data, error } = await s.from('lost_found_posts').insert(row).select('id').single();
            return error ? null : (data ? { ...post, id: data.id } : null);
        },
        async updateLostFoundPost(id, updates) {
            const s = sb(); if (!s) return false;
            const { error } = await s.from('lost_found_posts').update(updates).eq('id', id);
            return !error;
        },
        async deleteLostFoundPost(id) {
            const s = sb(); if (!s) return false;
            const { error } = await s.from('lost_found_posts').delete().eq('id', id);
            return !error;
        },

        // ========== Secondhand ==========
        async getSecondhandPosts() {
            const s = sb(); if (!s) return [];
            const { data, error } = await s.from('secondhand_posts').select('*').order('created_at', { ascending: false });
            return error ? [] : (data || []).map(rowToCommunity);
        },
        async insertSecondhandPost(post) {
            const s = sb(); if (!s) return null;
            const row = communityToRow(post, 'secondhand');
            const { data, error } = await s.from('secondhand_posts').insert(row).select('id').single();
            return error ? null : (data ? { ...post, id: data.id } : null);
        },
        async updateSecondhandPost(id, updates) {
            const s = sb(); if (!s) return false;
            const { error } = await s.from('secondhand_posts').update(updates).eq('id', id);
            return !error;
        },
        async deleteSecondhandPost(id) {
            const s = sb(); if (!s) return false;
            const { error } = await s.from('secondhand_posts').delete().eq('id', id);
            return !error;
        },

        // ========== Ask Help ==========
        async getAskHelpPosts() {
            const s = sb(); if (!s) return [];
            const { data, error } = await s.from('ask_help_posts').select('*').order('created_at', { ascending: false });
            return error ? [] : (data || []).map(rowToCommunity);
        },
        async insertAskHelpPost(post) {
            const s = sb(); if (!s) return null;
            const row = communityToRow(post, 'ask_help');
            const { data, error } = await s.from('ask_help_posts').insert(row).select('id').single();
            return error ? null : (data ? { ...post, id: data.id } : null);
        },
        async updateAskHelpPost(id, updates) {
            const s = sb(); if (!s) return false;
            const { error } = await s.from('ask_help_posts').update(updates).eq('id', id);
            return !error;
        },
        async deleteAskHelpPost(id) {
            const s = sb(); if (!s) return false;
            const { error } = await s.from('ask_help_posts').delete().eq('id', id);
            return !error;
        },

        // ========== Materials ==========
        async getMaterials() {
            const s = sb(); if (!s) return [];
            const { data, error } = await s.from('materials').select('*').order('created_at', { ascending: false });
            return error ? [] : (data || []).map(r => ({
                id: r.id,
                user_id: r.user_id,
                title: r.title,
                category: r.category,
                uploader: r.uploader,
                uploadTime: (r.created_at || '').split('T')[0],
                description: r.description || '',
                fileSize: r.file_size || '',
                file_path: r.file_path
            }));
        },
        async insertMaterial(m) {
            const s = sb(); if (!s) return null;
            const row = { user_id: getUserId(), title: m.title, category: m.category, uploader: m.uploader, description: m.description || '', file_size: m.fileSize || '', file_path: m.file_path || '' };
            const { data, error } = await s.from('materials').insert(row).select('id').single();
            return error ? null : (data ? { ...m, id: data.id } : null);
        },
        async updateMaterial(id, updates) {
            const s = sb(); if (!s) return false;
            const { error } = await s.from('materials').update(updates).eq('id', id);
            return !error;
        },
        async deleteMaterial(id) {
            const s = sb(); if (!s) return false;
            const { error } = await s.from('materials').delete().eq('id', id);
            return !error;
        },

        // ========== Feedback ==========
        async getFeedback() {
            const s = sb(); if (!s) return [];
            const { data, error } = await s.from('feedback').select('*').order('created_at', { ascending: false });
            return error ? [] : (data || []).map(r => ({ id: r.id, uploader: r.uploader, content: r.content, time: r.created_at }));
        },
        async insertFeedback(f) {
            const s = sb(); if (!s) return null;
            const row = { user_id: getUserId(), uploader: f.uploader, content: f.content };
            const { data, error } = await s.from('feedback').insert(row).select('id').single();
            return error ? null : (data ? { ...f, id: data.id, time: new Date().toISOString() } : null);
        },

        // ========== Reports ==========
        async insertReport(targetType, targetId, reason) {
            const s = sb(); if (!s) return false;
            const { error } = await s.from('reports').insert({ reporter_id: getUserId(), target_type: targetType, target_id: targetId, reason: reason || '' });
            return !error;
        },

        // ========== Online Count (Realtime Presence) ==========
        getOnlineChannel() {
            const s = sb(); if (!s) return null;
            const channel = s.channel('online-count');
            return channel;
        }
    };

    function rowToLife(r) {
        return {
            id: r.id,
            user_id: r.user_id,
            uploader: r.uploader,
            avatar: r.avatar,
            content: r.content,
            image: r.image,
            time: r.created_at,
            comments: r.comments || [],
            expanded: false
        };
    }
    function lifeToRow(p) {
        return {
            user_id: getUserId(),
            uploader: p.uploader,
            avatar: p.avatar,
            content: p.content,
            image: p.image || null,
            comments: p.comments || []
        };
    }
    function rowToCommunity(r) {
        return {
            id: r.id,
            user_id: r.user_id,
            uploader: r.uploader,
            avatar: r.avatar,
            content: r.content,
            image: r.image,
            time: r.created_at,
            comments: r.comments || [],
            expanded: false,
            anonymous: r.anonymous || false
        };
    }
    function communityToRow(p, type) {
        const row = {
            user_id: getUserId(),
            uploader: p.uploader,
            avatar: p.avatar,
            content: p.content,
            image: p.image || null,
            comments: p.comments || []
        };
        if (type === 'ask_help') row.anonymous = p.anonymous || false;
        return row;
    }
})();
