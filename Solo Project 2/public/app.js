/* Workout Log Manager — Cloud (Solo Project 2)
All CRUD via backend API, paging 10 per page, client and server validation. */

const API_BASE = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL.replace(/\/$/, '') : '';
const PAGE_SIZE = 10;

let currentPage = 1;
let totalPages = 1;
let totalRecords = 0;
let editingId = null;
let deleteId = null;

function apiUrl(path) {
    const base = API_BASE || '';
    const p = path.startsWith('/') ? path : '/' + path;
    return base + p;
}

async function api(path, options = {}) {
    const url = apiUrl(path);
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
    const text = await res.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch (_) {}
    if (!res.ok) {
        throw { status: res.status, data, message: (data && data.error) || res.statusText };
    }
    return data;
}

function showFormError(message) {
    const el = document.getElementById('formError');
    if (!el) return;
    el.textContent = message || '';
    el.classList.toggle('visible', !!message);
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const el = document.getElementById('date');
    if (el) el.value = today;
}

function formatDate(dateString) {
    const d = new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function loadStats() {
    try {
        const stats = await api('/api/stats');
        document.getElementById('totalWorkouts').textContent = stats.totalWorkouts;
        document.getElementById('totalMinutes').textContent = stats.totalMinutes;
        document.getElementById('totalCalories').textContent = stats.totalCalories;
        document.getElementById('avgDuration').textContent = stats.avgDuration;
        document.getElementById('mostCommonType').textContent = stats.mostCommonType;
    } catch (e) {
        console.error('Stats load failed', e);
    }
}

async function loadPage(page) {
    if (page < 1) page = 1;
    try {
        const result = await api(`/api/workouts?page=${page}`);
        const workouts = result.workouts || [];
        totalRecords = result.total || 0;
        totalPages = result.totalPages || 1;
        currentPage = result.page || 1;

        const tbody = document.getElementById('workoutTableBody');
        tbody.innerHTML = '';
        if (workouts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No workouts on this page. Add one or go to another page.</td></tr>';
        } else {
            workouts.forEach(w => {
                const row = document.createElement('tr');
                const intensityClass = (w.intensity || '').toLowerCase().replace(/\s/g, '');
                row.innerHTML = `
                    <td>${formatDate(w.date)}</td>
                    <td>${w.exerciseType}</td>
                    <td>${w.duration}</td>
                    <td><span class="intensity-badge ${intensityClass}">${w.intensity}</span></td>
                    <td>${w.caloriesBurned}</td>
                    <td>${w.notes ? (w.notes.substring(0, 30) + (w.notes.length > 30 ? '...' : '')) : '-'}</td>
                    <td>
                        <button class="btn btn-success" type="button" data-edit-id="${w.id}">Edit</button>
                        <button class="btn btn-danger" type="button" data-delete-id="${w.id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const indicator = document.getElementById('pageIndicator');
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
        if (indicator) indicator.textContent = `Page ${currentPage} of ${totalPages}`;
    } catch (e) {
        console.error('List load failed', e);
        document.getElementById('workoutTableBody').innerHTML =
            '<tr><td colspan="7" style="text-align: center;">Could not load workouts. Check that the backend is running.</td></tr>';
    }
}

function resetForm() {
    document.getElementById('workoutForm').reset();
    document.getElementById('formTitle').textContent = 'Add New Workout';
    const idEl = document.getElementById('workoutId');
    if (idEl) idEl.value = '';
    editingId = null;
    showFormError('');
    setDefaultDate();
}

async function editWorkout(id) {
    try {
        const w = await api(`/api/workouts/${id}`);
        editingId = id;
        document.getElementById('formTitle').textContent = 'Edit Workout';
        document.getElementById('workoutId').value = id;
        document.getElementById('date').value = w.date;
        document.getElementById('exerciseType').value = w.exerciseType;
        document.getElementById('duration').value = w.duration;
        document.getElementById('intensity').value = w.intensity;
        document.getElementById('caloriesBurned').value = w.caloriesBurned;
        document.getElementById('notes').value = w.notes || '';
        showFormError('');
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
        showFormError(e.message || 'Could not load workout.');
    }
}

function showDeleteConfirm(id) {
    deleteId = id;
    document.getElementById('deleteModal').classList.add('active');
}

function hideDeleteConfirm() {
    deleteId = null;
    document.getElementById('deleteModal').classList.remove('active');
}

async function confirmDelete() {
    if (!deleteId) return;
    try {
        await api(`/api/workouts/${deleteId}`, { method: 'DELETE' });
        hideDeleteConfirm();
        let page = currentPage;
        if (totalRecords <= 1) page = 1;
        else if (currentPage > 1 && (currentPage - 1) * PAGE_SIZE >= totalRecords - 1) page = currentPage - 1;
        await loadPage(page);
        await loadStats();
    } catch (e) {
        showFormError(e.message || 'Delete failed.');
    }
}

function clientValidate(workout) {
    if (!workout.date) return 'Date is required.';
    if (!workout.exerciseType) return 'Exercise type is required.';
    const dur = parseInt(workout.duration, 10);
    if (isNaN(dur) || dur < 1 || dur > 480) return 'Duration must be between 1 and 480 minutes.';
    if (!workout.intensity) return 'Intensity is required.';
    const cal = parseInt(workout.caloriesBurned, 10);
    if (isNaN(cal) || cal < 0 || cal > 2000) return 'Calories must be between 0 and 2000.';
    if (workout.notes && workout.notes.length > 200) return 'Notes must be at most 200 characters.';
    return null;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    showFormError('');

    const workout = {
        date: document.getElementById('date').value,
        exerciseType: document.getElementById('exerciseType').value,
        duration: document.getElementById('duration').value,
        intensity: document.getElementById('intensity').value,
        caloriesBurned: document.getElementById('caloriesBurned').value,
        notes: document.getElementById('notes').value,
    };

    const clientErr = clientValidate(workout);
    if (clientErr) {
        showFormError(clientErr);
        return;
    }

    const payload = {
        date: workout.date,
        exerciseType: workout.exerciseType,
        duration: parseInt(workout.duration, 10),
        intensity: workout.intensity,
        caloriesBurned: parseInt(workout.caloriesBurned, 10),
        notes: workout.notes || '',
    };

    try {
        if (editingId) {
            await api(`/api/workouts/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
            await api('/api/workouts', { method: 'POST', body: JSON.stringify(payload) });
        }
        resetForm();
        const pageToLoad = editingId ? currentPage : 1;
        await loadPage(pageToLoad);
        await loadStats();
    } catch (err) {
        const msg = (err.data && err.data.error) || err.message || 'Request failed.';
        showFormError(msg);
    }
}

function attachEventListeners() {
    document.getElementById('workoutForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('cancelBtn').addEventListener('click', resetForm);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    document.getElementById('cancelDeleteBtn').addEventListener('click', hideDeleteConfirm);

    document.getElementById('prevPage').addEventListener('click', () => loadPage(currentPage - 1));
    document.getElementById('nextPage').addEventListener('click', () => loadPage(currentPage + 1));

    document.getElementById('deleteModal').addEventListener('click', function (e) {
        if (e.target === this) hideDeleteConfirm();
    });

    document.getElementById('workoutTableBody').addEventListener('click', function (e) {
        const editId = e.target.getAttribute('data-edit-id');
        const delId = e.target.getAttribute('data-delete-id');
        if (editId) editWorkout(parseInt(editId, 10));
        if (delId) showDeleteConfirm(parseInt(delId, 10));
    });
}

async function init() {
    setDefaultDate();
    attachEventListeners();
    await loadPage(1);
    await loadStats();
}

document.addEventListener('DOMContentLoaded', init);
