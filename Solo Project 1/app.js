// The Data & State
let workouts = [];
let editingId = null;
let deleteId = null;

// The Initialization
function init() {
    loadData();
    renderWorkouts();
    updateStats();
    attachEventListeners();
    setDefaultDate();
}

// The Data Management
function loadData() {
    const stored = localStorage.getItem('workoutLogs');
    if (stored) {
        workouts = JSON.parse(stored);
    } else {
        workouts = generateSampleData();
        saveData();
    }
}
function saveData() {
    localStorage.setItem('workoutLogs', JSON.stringify(workouts));
}

// The Sample Data Generation
function generateSampleData() {
    const types = ['Cardio', 'Strength Training', 'Yoga', 'HIIT', 'Sports', 'Flexibility'];
    const intensities = ['Low', 'Medium', 'High'];
    const notes = [
        'Morning workout, felt great!',
        'Tough session but pushed through',
        'Easy recovery day',
        'New personal record!',
        'Felt tired but completed',
        'Really enjoyed this workout',
        'Challenging but rewarding',
        'Good warm-up session',
        'Focused on form today',
        'Best workout this week!'
    ];
    const sampleWorkouts = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const type = types[Math.floor(Math.random() * types.length)];
        const duration = Math.floor(Math.random() * 60) + 20; 
        const intensity = intensities[Math.floor(Math.random() * intensities.length)];
        const calories = Math.floor(duration * (Math.random() * 5 + 5)); 
        const note = notes[Math.floor(Math.random() * notes.length)];

        sampleWorkouts.push({
            id: baseId + (i * 1000),
            date: date.toISOString().split('T')[0],
            exerciseType: type,
            duration: duration,
            intensity: intensity,
            caloriesBurned: calories,
            notes: note
        });
    }
    return sampleWorkouts;
}

// The Render Functions
function renderWorkouts() {
    const tbody = document.getElementById('workoutTableBody');
    tbody.innerHTML = '';

    if (workouts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No workouts logged yet. Add your first workout!</td></tr>';
        return;
    }
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedWorkouts.forEach(workout => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(workout.date)}</td>
            <td>${workout.exerciseType}</td>
            <td>${workout.duration}</td>
            <td><span class="intensity-badge ${workout.intensity.toLowerCase()}">${workout.intensity}</span></td>
            <td>${workout.caloriesBurned}</td>
            <td>${workout.notes ? workout.notes.substring(0, 30) + (workout.notes.length > 30 ? '...' : '') : '-'}</td>
            <td>
                <button class="btn btn-success" onclick="editWorkout(${workout.id})">Edit</button>
                <button class="btn btn-danger" onclick="showDeleteConfirm(${workout.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateStats() {
    // The total workouts
    document.getElementById('totalWorkouts').textContent = workouts.length;

    // The total minutes
    const totalMinutes = workouts.reduce((sum, w) => sum + w.duration, 0);
    document.getElementById('totalMinutes').textContent = totalMinutes;

    // The total calories
    const totalCalories = workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
    document.getElementById('totalCalories').textContent = totalCalories;

    // The average duration
    const avgDuration = workouts.length > 0 ? Math.round(totalMinutes / workouts.length) : 0;
    document.getElementById('avgDuration').textContent = avgDuration;

    // The most common type
    const typeCounts = {};
    workouts.forEach(w => {
        typeCounts[w.exerciseType] = (typeCounts[w.exerciseType] || 0) + 1;
    });
    let mostCommon = 'N/A';
    let maxCount = 0;
    for (const [type, count] of Object.entries(typeCounts)) {
        if (count > maxCount) {
            maxCount = count;
            mostCommon = type;
        }
    }
    document.getElementById('mostCommonType').textContent = mostCommon;
}

// The CRUD Operations
function addWorkout(workout) {
    workout.id = Date.now();
    workouts.push(workout);
    saveData();
    renderWorkouts();
    updateStats();
}

function updateWorkout(id, updatedWorkout) {
    const index = workouts.findIndex(w => w.id === id);
    if (index !== -1) {
        workouts[index] = { ...updatedWorkout, id };
        saveData();
        renderWorkouts();
        updateStats();
    }
}

function deleteWorkout(id) {
    workouts = workouts.filter(w => w.id !== id);
    saveData();
    renderWorkouts();
    updateStats();
}

function editWorkout(id) {
    const workout = workouts.find(w => w.id === id);
    if (!workout) return;
    editingId = id;
    document.getElementById('formTitle').textContent = 'Edit Workout';
    document.getElementById('workoutId').value = id;
    document.getElementById('date').value = workout.date;
    document.getElementById('exerciseType').value = workout.exerciseType;
    document.getElementById('duration').value = workout.duration;
    document.getElementById('intensity').value = workout.intensity;
    document.getElementById('caloriesBurned').value = workout.caloriesBurned;
    document.getElementById('notes').value = workout.notes;

    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// The Delete Confirmation
function showDeleteConfirm(id) {
    deleteId = id;
    document.getElementById('deleteModal').classList.add('active');
}

function hideDeleteConfirm() {
    deleteId = null;
    document.getElementById('deleteModal').classList.remove('active');
}

function confirmDelete() {
    if (deleteId) {
        deleteWorkout(deleteId);
        hideDeleteConfirm();
    }
}

// The Form Handling
function handleFormSubmit(e) {
    e.preventDefault();

    const workout = {
        date: document.getElementById('date').value,
        exerciseType: document.getElementById('exerciseType').value,
        duration: parseInt(document.getElementById('duration').value),
        intensity: document.getElementById('intensity').value,
        caloriesBurned: parseInt(document.getElementById('caloriesBurned').value),
        notes: document.getElementById('notes').value
    };

    if (!workout.date || !workout.exerciseType || !workout.duration || !workout.intensity || !workout.caloriesBurned) {
        alert('Please fill in all required fields');
        return;
    }

    if (workout.duration < 1 || workout.duration > 480) {
        alert('Duration must be between 1 and 480 minutes');
        return;
    }

    if (workout.caloriesBurned < 0 || workout.caloriesBurned > 2000) {
        alert('Calories must be between 0 and 2000');
        return;
    }

    if (editingId) {
        updateWorkout(editingId, workout);
    } else {
        addWorkout(workout);
    }

    resetForm();
}

function resetForm() {
    document.getElementById('workoutForm').reset();
    document.getElementById('formTitle').textContent = 'Add New Workout';
    document.getElementById('workoutId').value = '';
    editingId = null;
    setDefaultDate();
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// The Event Listeners
function attachEventListeners() {
    document.getElementById('workoutForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('cancelBtn').addEventListener('click', resetForm);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    document.getElementById('cancelDeleteBtn').addEventListener('click', hideDeleteConfirm);
    
    document.getElementById('deleteModal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideDeleteConfirm();
        }
    });
}

// The Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// The Application Start
document.addEventListener('DOMContentLoaded', init);
