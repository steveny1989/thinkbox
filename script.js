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
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user logged in');
        throw new Error('No user logged in');
      }
      console.log('Getting ID token for user:', user.uid);
      const idToken = await user.getIdToken();
      console.log('ID token obtained, making API call');
      const response = await fetch(`${BASE_API_URL}/notes`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      console.log('API response status:', response.status);
      console.log('API response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to fetch notes: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Notes data received:', data);
      return data;
    } catch (error) {
      console.error('Error in getNotes:', error);
      if (error instanceof TypeError) {
        console.error('Network error: ', error.message);
      }
      throw error;
    }
  },

  async addNote(note) {
    const user = auth.currentUser;
    if (!user) {
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
    if (!response.ok) throw new Error('Failed to add note');
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
    try {
      console.log('Loading notes...');
      const notes = await api.getNotes();
      console.log('Notes loaded successfully:', notes);
      updateNoteList(notes);
    } catch (error) {
      console.error('Error loading notes:', error);
      if (error.message.includes('Failed to fetch')) {
        alert('Network error. Please check your internet connection and try again.');
      } else {
        alert('Failed to load notes. Please try again later.');
      }
    }
  },

  async addNote(text) {
    try {
      const feedback = await api.getFeedback(text);
      const newNote = await api.addNote({ text, timestamp: new Date().toISOString() });
      feedbacks[newNote.id] = feedback;
      notes.unshift(newNote);
      updateNoteList();
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
function updateNoteList() {
  const noteList = document.getElementById('noteList');
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
      // 添加笔记的逻辑
    });
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

  // 加载笔记
  loadNotes().then(() => {
    console.log('Notes loading process completed');
  });
});

// 定义 loadNotes 函数
async function loadNotes() {
  try {
    console.log('Loading notes...');
    const notes = await api.getNotes();
    console.log('Notes loaded successfully:', notes);
    updateNoteList(notes);
  } catch (error) {
    console.error('Error loading notes:', error);
    if (error.message.includes('Failed to fetch')) {
      alert('Network error. Please check your internet connection and try again.');
    } else {
      alert('Failed to load notes. Please try again later.');
    }
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