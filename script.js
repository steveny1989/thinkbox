const BASE_API_URL = 'https://178.128.81.19:3001'; // 定义 API 基础 URL

import { auth, signOut, onAuthStateChanged } from './firebase.js';

// Hugging Face API 相关设置
const HF_API_KEY = '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';
const HF_API_URL = 'https://api-inference.huggingface.co/models/gpt2';

// 全局变量
let notes = [];
let feedbacks = {};

// API 调用函数
const api = {
  async getNotes() {
    console.log('getNotes called');
    const user = auth.currentUser;
    if (!user) {
      console.log('No user logged in');
      return []; // 返回空数组
    }
    console.log('Getting ID token for user:', user.uid);
    try {
      const idToken = await user.getIdToken();
      console.log('ID token obtained, making API call');
      const response = await fetch(`${BASE_API_URL}/notes`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      console.log('API response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', errorText);
        throw new Error(`Failed to fetch notes: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Notes data received:', data);
      return data; // 这可能是空数组，但不应该导致错误
    } catch (error) {
      console.error('Error in getNotes:', error);
      throw error;
    }
  },

  async addNote(note) {
    console.log('API addNote called with:', note);
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      throw new Error('No user logged in');
    }
    const idToken = await user.getIdToken();
    const response = await fetch(`${BASE_API_URL}/notes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(note)
    });
    console.log('API response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      throw new Error('Failed to add note');
    }
    return response.json();
  },

  async deleteNote(id) {
    const response = await fetch(`${BASE_API_URL}/notes/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete note');
  },

  async getFeedback(input) {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: input })
    });
    if (!response.ok) throw new Error('Failed to get feedback');
    const data = await response.json();
    return data[0]?.generated_text || 'No feedback available';
  }
};

// 笔记操作函数
const noteOperations = {
  async loadNotes() {
    console.log('loadNotes called');
    try {
      console.log('Checking auth state...');
      const user = auth.currentUser;
      if (!user) {
        console.log('No user logged in, skipping note loading');
        updateNoteList([]); // 更新UI以显示未登录状态
        return;
      }
      console.log('User logged in, fetching notes...');
      notes = await api.getNotes(); // 更新全局 notes 数组
      console.log('Notes loaded successfully:', notes);
      updateNoteList(notes);
    } catch (error) {
      console.error('Error loading notes:', error);
      alert('Failed to load notes. Please try again later.');
    }
  },

  async addNote(text) {
    console.log('addNote called with text:', text);
    try {
      const timestamp = getMySQLDateTime();
      const newNote = await api.addNote({ text, timestamp });
      console.log('New note added:', newNote);
      notes.unshift(newNote);
      updateNoteList(notes); // 传递整个笔记数组
      return newNote;
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    }
  },

  async deleteNote(id) {
    try {
      await api.deleteNote(id);
      notes = notes.filter(note => note.id !== id);
      delete feedbacks[id];
      updateNoteList();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    }
  }
};

// UI 更新函数
function updateNoteList(notes) {
  console.log('updateNoteList called with:', notes);
  const noteList = document.getElementById('noteList');
  const userEmailElement = document.getElementById('userEmail');

  if (!auth.currentUser) {
    console.log('No user logged in, updating UI accordingly');
    userEmailElement.textContent = 'Not logged in';
    noteList.innerHTML = '<li>Please log in to view your notes.</li>';
    return;
  }

  userEmailElement.textContent = auth.currentUser.email;

  if (!notes || notes.length === 0) {
    console.log('No notes found, displaying empty state');
    noteList.innerHTML = '<li>No notes found. Create your first note!</li>';
    return;
  }

  console.log('Updating note list with received notes');
  noteList.innerHTML = notes.map(note => `
    <li>
      <div class="note-content">
        <span>${note.text}</span>
        <div class="timestamp-container">
          <span class="timestamp">${formatTimestamp(note.timestamp)}</span>
          <button class="delete-note" data-id="${note.id}">删除</button>
        </div>
        ${feedbacks[note.id] ? `
          <div class="feedback-container">
            <p class="feedback">ThinkBox: ${feedbacks[note.id]}</p>
          </div>
        ` : ''}
      </div>
    </li>
  `).join('');

  // 添加删除按钮的事件监听器
  document.querySelectorAll('.delete-note').forEach(button => {
    button.addEventListener('click', () => noteOperations.deleteNote(button.dataset.id));
  });
}

// 辅助函数
function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}

// 事件监听器
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded event fired');
  // 获取元素
  const noteInput = document.getElementById('noteInput');
  const addNoteButton = document.getElementById('addNoteButton');
  const searchInput = document.getElementById('searchInput');
  const noteList = document.getElementById('noteList');
  const logoutButton = document.getElementById('logoutButton');
  const userEmailSpan = document.getElementById('userEmail');

  // 添加笔记按钮事件监听器
  if (addNoteButton) {
    addNoteButton.addEventListener('click', function() {
      const noteText = noteInput.value.trim();
      if (noteText) {
        noteOperations.addNote(noteText).then(() => {
          noteInput.value = ''; // 清空输入框
        });
      }
    });
  } else {
    console.error('Add Note button not found');
  }

  // 搜索输入事件监听器
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      // 搜索笔记的逻辑
    });
  }

  // 登出按钮事件监听器
  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      // 登出逻辑
    });
  }

  // 监听认证状态变化
  onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? 'User logged in' : 'No user');
    if (user) {
      loadNotes().then(() => {
        console.log('Notes loading process completed');
      }).catch(error => {
        console.error('Error in loadNotes:', error);
      });
    } else {
      updateNoteList([]); // 用户登出时清空笔记列表
    }
  });
});

// 定义 loadNotes 函数
async function loadNotes() {
  console.log('loadNotes called');
  try {
    console.log('Checking auth state...');
    const user = auth.currentUser;
    if (!user) {
      console.log('No user logged in, skipping note loading');
      updateNoteList([]); // 更新UI以显示未登录状态
      return;
    }
    console.log('User logged in, fetching notes...');
    notes = await api.getNotes(); // 更新全局 notes 数组
    console.log('Notes loaded successfully:', notes);
    updateNoteList(notes);
  } catch (error) {
    console.error('Error loading notes:', error);
    alert('Failed to load notes. Please try again later.');
  }
}

// 用户登出函数
async function logoutUser() {
    try {
        await signOut(auth);
        console.log("User signed out");
        window.location.href = "auth.html"; // 登出后跳转到登录页面
    } catch (error) {
        console.error("Error signing out:", error);
    }
}

// 绑定登出按钮事件处理程序
document.getElementById('logoutButton').addEventListener('click', logoutUser);

// 监听用户状态变化
onAuthStateChanged(auth, (user) => {
    const userEmailElement = document.getElementById('userEmail');
    if (user) {
        console.log("User is signed in:", user);
        userEmailElement.textContent = user.email; // 显示用户的邮箱
        noteOperations.loadNotes(); // 加载用户的笔记
    } else {
        console.log("No user is signed in.");
        userEmailElement.textContent = ''; // 清空用户邮箱
        notes = []; // 清空笔记
        updateNoteList(); // 更新 UI 以显示空的笔记列表
        window.location.href = "auth.html"; // 用户未登录，跳转到登录页面
    }
});

// 页面加载完成后检查用户状态
document.addEventListener('DOMContentLoaded', (event) => {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "auth.html"; // 用户未登录，跳转到登录页面
        }
    });
});

function getMySQLDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}