// App state
let currentUser = null;
const store = {
    members: [],
    issues: [],
    tasks: [],
    comments: []
};

// Initialize app
function init() {
    loadFromStorage();
    currentUser = getCurrentUser();

    if (currentUser) {
        showMainView();
        renderAll();
    } else {
        showAuthView();
    }

    setupEventListeners();
    registerServiceWorker();
}

// Storage
function loadFromStorage() {
    const data = localStorage.getItem('communityAppData');
    if (data) {
        const parsed = JSON.parse(data);
        store.members = parsed.members || [];
        store.issues = parsed.issues || [];
        store.tasks = parsed.tasks || [];
        store.comments = parsed.comments || [];
    } else {
        // Seed demo data on first visit
        seedDemoData();
    }
}

function seedDemoData() {
    const now = new Date().toISOString();

    store.members = [
        { id: 1, email: 'alice@example.com', password: 'demo', name: 'Alice', phone: '555-0001' },
        { id: 2, email: 'bob@example.com', password: 'demo', name: 'Bob', phone: '555-0002' },
        { id: 3, email: 'carol@example.com', password: 'demo', name: 'Carol', phone: '555-0003' }
    ];

    store.issues = [
        { id: 101, title: 'Website Redesign', description: 'Modernize the landing page', createdBy: 1, createdAt: now },
        { id: 102, title: 'API Documentation', description: 'Complete REST API docs', createdBy: 2, createdAt: now },
        { id: 103, title: 'Bug Fixes', description: 'Fix critical bugs reported', createdBy: 1, createdAt: now }
    ];

    store.tasks = [
        { id: 1001, issueId: 101, title: 'Design mockups', description: 'Create Figma mockups', assignedTo: 2, createdBy: 1, createdAt: now },
        { id: 1002, issueId: 101, title: 'Frontend implementation', description: 'Build React components', assignedTo: 3, createdBy: 1, createdAt: now },
        { id: 1003, issueId: 102, title: 'Write API guide', description: 'Document all endpoints', assignedTo: 1, createdBy: 2, createdAt: now },
        { id: 1004, issueId: 103, title: 'Fix login bug', description: 'Users cannot reset password', assignedTo: 2, createdBy: 1, createdAt: now }
    ];

    store.comments = [
        { id: 2001, taskId: 1001, authorId: 1, text: 'Looking good! Can we add dark mode?', createdAt: now },
        { id: 2002, taskId: 1001, authorId: 2, text: 'Sure, will include that in v2', createdAt: now },
        { id: 2003, taskId: 1004, authorId: 3, text: 'I found the issue - it\'s in the reset controller', createdAt: now }
    ];

    saveToStorage();
}

function saveToStorage() {
    localStorage.setItem('communityAppData', JSON.stringify(store));
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser'));
}

function setCurrentUser(user) {
    currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

// Auth
document.getElementById('authForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;

    let member = store.members.find(m => m.email === email);
    if (!member) {
        member = {
            id: Date.now(),
            email,
            password,
            phone: '',
            name: email.split('@')[0]
        };
        store.members.push(member);
        saveToStorage();
    } else if (member.password !== password) {
        alert('Invalid password');
        return;
    }

    setCurrentUser(member);
    showMainView();
    renderAll();
});

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    showAuthView();
    document.getElementById('authForm').reset();
});

// View switching
function showAuthView() {
    document.getElementById('authView').classList.remove('hidden');
    document.getElementById('mainView').classList.add('hidden');
}

function showMainView() {
    document.getElementById('authView').classList.add('hidden');
    document.getElementById('mainView').classList.remove('hidden');
}

// Tabs - attach after DOM ready
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

            btn.classList.add('active');
            const tabName = btn.dataset.tab + 'Tab';
            document.getElementById(tabName).classList.remove('hidden');
        });
    });
}

// Profile
document.getElementById('profileForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = document.getElementById('profilePhone').value;

    const member = store.members.find(m => m.id === currentUser.id);
    if (member) {
        member.phone = phone;
        currentUser.phone = phone;
        setCurrentUser(currentUser);
        saveToStorage();
        alert('Profile saved!');
    }
});

// Issues
document.getElementById('issueForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('issueTitle').value;
    const description = document.getElementById('issueDesc').value;

    const issue = {
        id: Date.now(),
        title,
        description,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString()
    };

    store.issues.push(issue);
    saveToStorage();
    renderIssues();

    document.getElementById('issueForm').reset();
    updateTaskIssueSelect();
});

// Tasks
document.getElementById('taskForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const issueId = parseInt(document.getElementById('taskIssue').value);
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDesc').value;
    const assigneeId = document.getElementById('taskAssignee').value ? parseInt(document.getElementById('taskAssignee').value) : null;

    const task = {
        id: Date.now(),
        issueId,
        title,
        description,
        assignedTo: assigneeId,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString()
    };

    store.tasks.push(task);
    saveToStorage();
    renderTasks();

    document.getElementById('taskForm').reset();
});

// Comments
document.getElementById('commentForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskId = parseInt(document.getElementById('taskModal').dataset.taskId);
    const text = document.getElementById('commentText').value;

    const comment = {
        id: Date.now(),
        taskId,
        authorId: currentUser.id,
        text,
        createdAt: new Date().toISOString()
    };

    store.comments.push(comment);
    saveToStorage();
    renderComments(taskId);

    document.getElementById('commentForm').reset();
});

// Rendering
function renderAll() {
    renderMembers();
    renderIssues();
    renderTasks();
    updateTaskIssueSelect();
    updateTaskAssigneeSelect();
}

function renderMembers() {
    const list = document.getElementById('membersList');
    list.innerHTML = '';

    // Current user profile
    const phone = currentUser.phone || 'Not set';
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        document.getElementById('profilePhone').value = currentUser.phone || '';
    }

    // Other members
    store.members.filter(m => m.id !== currentUser.id).forEach(member => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <strong>${member.name}</strong>
            <div class="list-item-row">
                <span>${member.email}</span>
                <span>${member.phone || 'N/A'}</span>
            </div>
        `;
        list.appendChild(item);
    });
}

function renderIssues() {
    const list = document.getElementById('issuesList');
    list.innerHTML = '';

    store.issues.forEach(issue => {
        const creator = store.members.find(m => m.id === issue.createdBy);
        const taskCount = store.tasks.filter(t => t.issueId === issue.id).length;

        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <strong>${issue.title}</strong>
            <div class="list-item-row">
                <span>${issue.description}</span>
                <span class="badge badge-success">${taskCount} tasks</span>
            </div>
            <small>Created by ${creator?.name || 'Unknown'}</small>
        `;
        list.appendChild(item);
    });
}

function renderTasks() {
    const list = document.getElementById('tasksList');
    list.innerHTML = '';

    store.tasks.forEach(task => {
        const issue = store.issues.find(i => i.id === task.issueId);
        const assignee = task.assignedTo ? store.members.find(m => m.id === task.assignedTo) : null;
        const canEdit = task.createdBy === currentUser.id;
        const commentCount = store.comments.filter(c => c.taskId === task.id).length;

        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <strong>${task.title}</strong>
            <div class="list-item-row">
                <span>${issue?.title || 'Unknown'}</span>
                <span class="badge badge-success">${commentCount} comments</span>
            </div>
            <small>Assigned to: ${assignee?.name || 'Unassigned'}</small>
        `;
        item.addEventListener('click', () => openTaskModal(task));
        list.appendChild(item);
    });
}

function renderComments(taskId) {
    const list = document.getElementById('commentsList');
    list.innerHTML = '';

    const taskComments = store.comments.filter(c => c.taskId === taskId);

    taskComments.forEach(comment => {
        const author = store.members.find(m => m.id === comment.authorId);
        const canDelete = comment.authorId === currentUser.id;

        const item = document.createElement('div');
        item.className = 'comment-item';
        item.innerHTML = `
            <strong>${author?.name || 'Unknown'}</strong>
            <p>${comment.text}</p>
            <small>${new Date(comment.createdAt).toLocaleString()}</small>
            ${canDelete ? `<button class="btn-secondary" style="margin-top:8px; padding:4px 8px; font-size:12px;" onclick="deleteComment(${comment.id})">Delete</button>` : ''}
        `;
        list.appendChild(item);
    });
}

function openTaskModal(task) {
    const assignee = task.assignedTo ? store.members.find(m => m.id === task.assignedTo) : null;

    document.getElementById('taskModalTitle').textContent = task.title;
    document.getElementById('taskModalDesc').textContent = task.description;
    document.getElementById('taskModalAssignee').textContent = assignee?.name || 'Unassigned';
    document.getElementById('taskModal').dataset.taskId = task.id;

    renderComments(task.id);
    document.getElementById('taskModal').classList.remove('hidden');
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.add('hidden');
}

function deleteComment(commentId) {
    store.comments = store.comments.filter(c => c.id !== commentId);
    saveToStorage();
    const taskId = parseInt(document.getElementById('taskModal').dataset.taskId);
    renderComments(taskId);
}

function updateTaskIssueSelect() {
    const select = document.getElementById('taskIssue');
    select.innerHTML = '<option value="">Select issue</option>';
    store.issues.forEach(issue => {
        const opt = document.createElement('option');
        opt.value = issue.id;
        opt.textContent = issue.title;
        select.appendChild(opt);
    });
}

function updateTaskAssigneeSelect() {
    const select = document.getElementById('taskAssignee');
    select.innerHTML = '<option value="">Unassigned</option>';
    store.members.forEach(member => {
        const opt = document.createElement('option');
        opt.value = member.id;
        opt.textContent = member.name;
        select.appendChild(opt);
    });
}

// Modal control
document.querySelector('.modal-close')?.addEventListener('click', closeTaskModal);
document.getElementById('taskModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('taskModal')) closeTaskModal();
});

// Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {
            // Service worker not critical
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    setupTabs();
}

// Initialize on load
window.addEventListener('load', init);
