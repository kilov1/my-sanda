/**
 * Supabase 统一数据 API
 * 无 Supabase 时使用本地 localStorage + 示例数据
 */
(function() {
    function sb() { return window.supabaseClient || null; }
    function local() { return window.localApi || null; }

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
            const s = sb();
            if (!s) {
                const la = local();
                return la ? (la.getLifePosts() || []).sort((a,b)=>new Date(b.time)-new Date(a.time)) : [];
            }
            const { data, error } = await s.from('life_posts').select('*').order('created_at', { ascending: false });
            return error ? [] : (data || []).map(rowToLife);
        },
        async insertLifePost(post) {
            const s = sb();
            if (!s) {
                const la = local();
                if (!la) return null;
                const arr = la.getLifePosts() || [];
                const id = Math.max(0, ...arr.map(x=>x.id)) + 1;
                const newItem = { ...post, id, time: new Date().toISOString(), comments: post.comments || [] };
                la.setLifePosts([newItem, ...arr]);
                return newItem;
            }
            const row = lifeToRow(post);
            const { data, error } = await s.from('life_posts').insert(row).select('id').single();
            return error ? null : (data ? { ...post, id: data.id } : null);
        },
        async updateLifePost(id, updates) {
            const s = sb();
            if (!s) {
                const la = local();
                if (!la) return false;
                const arr = la.getLifePosts() || [];
                const i = arr.findIndex(x=>x.id===id);
                if (i>=0) { arr[i]={...arr[i],...updates}; la.setLifePosts(arr); return true; }
                return false;
            }
            const { error } = await s.from('life_posts').update(updates).eq('id', id);
            return !error;
        },
        async deleteLifePost(id) {
            const s = sb();
            if (!s) {
                const la = local();
                if (!la) return false;
                const arr = (la.getLifePosts() || []).filter(x=>x.id!==id);
                la.setLifePosts(arr);
                return true;
            }
            const { error } = await s.from('life_posts').delete().eq('id', id);
            return !error;
        },

        // ========== Lost Found ==========
        async getLostFoundPosts() {
            const s = sb();
            if (!s) { const loc = local(); return Promise.resolve(loc ? loc.getLostFound() : []); }
            const { data, error } = await s.from('lost_found_posts').select('*').order('created_at', { ascending: false });
            return error ? [] : (data || []).map(rowToCommunity);
        },
        async insertLostFoundPost(post) {
            const s = sb();
            if (!s) {
                const loc = local();
                if (!loc) return null;
                const arr = loc.getLostFound();
                const newId = Math.max(0, ...arr.map(x => x.id)) + 1;
                const newPost = { ...post, id: newId, time: new Date().toISOString(), user_id: getUserId() || 'local' };
                arr.unshift(newPost);
                loc.setLostFound(arr);
                return newPost;
            }
            const row = communityToRow(post, 'lost_found');
            const { data, error } = await s.from('lost_found_posts').insert(row).select('id').single();
            return error ? null : (data ? { ...post, id: data.id } : null);
        },
        async updateLostFoundPost(id, updates) {
            const s = sb();
            if (!s) {
                const loc = local();
                if (!loc) return false;
                const arr = loc.getLostFound();
                const idx = arr.findIndex(x => x.id === id);
                if (idx < 0) return false;
                Object.assign(arr[idx], updates);
                loc.setLostFound(arr);
                return true;
            }
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
            const s = sb();
            if (!s) { const loc = local(); return Promise.resolve(loc ? loc.getSecondhand() : []); }
            const { data, error } = await s.from('secondhand_posts').select('*').order('created_at', { ascending: false });
            return error ? [] : (data || []).map(rowToCommunity);
        },
        async insertSecondhandPost(post) {
            const s = sb();
            if (!s) {
                const loc = local();
                if (!loc) return null;
                const arr = loc.getSecondhand();
                const newId = Math.max(0, ...arr.map(x => x.id)) + 1;
                const newPost = { ...post, id: newId, time: new Date().toISOString(), user_id: getUserId() || 'local' };
                arr.unshift(newPost);
                loc.setSecondhand(arr);
                return newPost;
            }
            const row = communityToRow(post, 'secondhand');
            const { data, error } = await s.from('secondhand_posts').insert(row).select('id').single();
            return error ? null : (data ? { ...post, id: data.id } : null);
        },
        async updateSecondhandPost(id, updates) {
            const s = sb();
            if (!s) {
                const loc = local();
                if (!loc) return false;
                const arr = loc.getSecondhand();
                const idx = arr.findIndex(x => x.id === id);
                if (idx < 0) return false;
                Object.assign(arr[idx], updates);
                loc.setSecondhand(arr);
                return true;
            }
            const { error } = await s.from('secondhand_posts').update(updates).eq('id', id);
            return !error;
        },
        async deleteSecondhandPost(id) {
            const s = sb();
            if (!s) {
                const loc = local();
                if (!loc) return false;
                loc.setSecondhand(loc.getSecondhand().filter(x => x.id !== id));
                return true;
            }
            const { error } = await s.from('secondhand_posts').delete().eq('id', id);
            return !error;
        },

        // ========== Ask Help ==========
        async getAskHelpPosts() {
            const s = sb();
            if (!s) { const loc = local(); return Promise.resolve(loc ? loc.getAskHelp() : []); }
            const { data, error } = await s.from('ask_help_posts').select('*').order('created_at', { ascending: false });
            return error ? [] : (data || []).map(rowToCommunity);
        },
        async insertAskHelpPost(post) {
            const s = sb();
            if (!s) {
                const loc = local();
                if (!loc) return null;
                const arr = loc.getAskHelp();
                const newId = Math.max(0, ...arr.map(x => x.id)) + 1;
                const newPost = { ...post, id: newId, time: new Date().toISOString(), user_id: getUserId() || 'local' };
                arr.unshift(newPost);
                loc.setAskHelp(arr);
                return newPost;
            }
            const row = communityToRow(post, 'ask_help');
            const { data, error } = await s.from('ask_help_posts').insert(row).select('id').single();
            return error ? null : (data ? { ...post, id: data.id } : null);
        },
        async updateAskHelpPost(id, updates) {
            const s = sb();
            if (!s) {
                const loc = local();
                if (!loc) return false;
                const arr = loc.getAskHelp();
                const idx = arr.findIndex(x => x.id === id);
                if (idx < 0) return false;
                Object.assign(arr[idx], updates);
                loc.setAskHelp(arr);
                return true;
            }
            const { error } = await s.from('ask_help_posts').update(updates).eq('id', id);
            return !error;
        },
        async deleteAskHelpPost(id) {
            const s = sb();
            if (!s) {
                const loc = local();
                if (!loc) return false;
                loc.setAskHelp(loc.getAskHelp().filter(x => x.id !== id));
                return true;
            }
            const { error } = await s.from('ask_help_posts').delete().eq('id', id);
            return !error;
        },

        // ========== Materials ==========
        async getMaterials() {
            const s = sb();
            if (!s) { const loc = local(); return Promise.resolve(loc ? loc.getMaterials() : []); }
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
            const s = sb();
            if (!s) {
                const loc = local();
                if (!loc) return null;
                const arr = loc.getMaterials();
                const newId = Math.max(0, ...arr.map(x => x.id)) + 1;
                const newMat = { ...m, id: newId, user_id: getUserId() || 'local', uploadTime: (m.uploadTime || new Date().toISOString().split('T')[0]) };
                arr.unshift(newMat);
                loc.setMaterials(arr);
                return newMat;
            }
            const row = { user_id: getUserId(), title: m.title, category: m.category, uploader: m.uploader, description: m.description || '', file_size: m.fileSize || '', file_path: m.file_path || '' };
            const { data, error } = await s.from('materials').insert(row).select('id').single();
            return error ? null : (data ? { ...m, id: data.id } : null);
        },
        async updateMaterial(id, updates) {
            const s = sb();
            if (!s) {
                const loc = local();
                if (!loc) return false;
                const arr = loc.getMaterials();
                const idx = arr.findIndex(x => x.id === id);
                if (idx < 0) return false;
                Object.assign(arr[idx], updates);
                loc.setMaterials(arr);
                return true;
            }
            const { error } = await s.from('materials').update(updates).eq('id', id);
            return !error;
        },
        async deleteMaterial(id) {
            const s = sb();
            if (!s) {
                const loc = local();
                if (!loc) return false;
                loc.setMaterials(loc.getMaterials().filter(x => x.id !== id));
                return true;
            }
            const { error } = await s.from('materials').delete().eq('id', id);
            return !error;
        },

        // ========== Feedback ==========
        async getFeedback() {
            const s = sb();
            if (!s) { const loc = local(); return Promise.resolve(loc ? loc.getFeedback() : []); }
            const { data, error } = await s.from('feedback').select('*').order('created_at', { ascending: false });
            return error ? [] : (data || []).map(r => ({ id: r.id, uploader: r.uploader, content: r.content, time: r.created_at }));
        },
        async insertFeedback(f) {
            const s = sb();
            if (!s) {
                const loc = local();
                if (!loc) return null;
                const arr = loc.getFeedback();
                const newId = Math.max(0, ...arr.map(x => x.id)) + 1;
                const newF = { ...f, id: newId, time: new Date().toISOString() };
                arr.unshift(newF);
                loc.setFeedback(arr);
                return newF;
            }
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
