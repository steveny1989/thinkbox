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
    try {
      const idToken = await user.getIdToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 秒超时
      const response = await fetch(`${BASE_API_URL}/notes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(note),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', errorText);
        throw new Error('Failed to add note: ${response.statusText}. ${errorText}');
      }
      return response.json();
    } catch (error) {
      console.error('Error in addNote:', error);
      throw error;
    }
  },

  async deleteNote(noteId) {
    console.log(`deleteNote called with id: ${noteId}`);
    const user = auth.currentUser;
    if (!user) {
      console.error('Delete attempt with no user logged in');
      throw new Error('No user logged in');
    }
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${BASE_API_URL}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
        // 检查响应状态
        if (response.status === 200 || response.status === 404) {
          console.log(`笔记 ${noteId} 删除成功`);
          return { success: true, message: 'Note deleted successfully' };
      } else if (response.status === 204) {
          console.log(`笔记 ${noteId} 未找到，可能已被删除`);
          return { success: true, message: 'Note not found, may have been already deleted' };
      }

        // 如果状态不是 200 或 204或404，尝试解析错误信息
        const errorText = await response.text();
        console.warn('API warning response:', errorText);
        
        // 即使有警告也视为成功
        return { success: true, message: 'Note may have been deleted, but with a warning', warning: errorText };

    } catch (error) {
        console.error('Error in deleteNote:', error);
        throw error;
    }
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
      // 在错误情况下也更新UI，显示空列表
      updateNoteList([]);
    }
  },

  async addNote(text) {
    console.log('addNote called with text:', text);
    try {
      const newNote = await api.addNote({ content: text });
      console.log('New note added:', newNote);
      
      // 将新笔记添加到本地 notes 数组的开头
      notes.unshift(newNote);
      updateNoteList(notes); // 更新 UI
      
      return newNote;
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    }
  },

  async deleteNote(noteId) {
    console.log(`deleteNote 被调用，笔记 ID: ${noteId}`);
    if (!noteId) {
        throw new Error('无效的笔记 ID');
    }

    try {
        const result = await api.deleteNote(noteId);
        if (result.success) {
            console.log(`笔记 ${noteId} 删除处理完成：${result.message}`);
            // 从本地 notes 数组中移除被删除的笔记
            notes = notes.filter(note => note.note_id !== noteId);
            updateNoteList(notes); // 更新 UI
            if (result.message.includes('not found') || result.message.includes('already deleted')) {
              console.log(`笔记 ${noteId} 未找到或已被删除`);
              // 可以选择是否向用户显示这个信息
              // alert('笔记未找到或已被删除');
          } else {
              console.log('笔记删除成功');
              // 可以选择向用户显示成功消息
              // alert('笔记已成功删除');
          }
      } else {
          console.warn('删除笔记失败:', result.message);
          alert('删除笔记失败。' + result.message);
      }
  } catch (error) {
      console.error('删除笔记时出错:', error);
      alert('删除笔记失败。请重试。');
  }
  },

  async searchNotes(query) {
    console.log('searchNotes called with query:', query);
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user logged in, skipping note search');
        return [];
      }
      const idToken = await user.getIdToken();
      const response = await fetch(`${BASE_API_URL}/notes/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', errorText);
        throw new Error(`Failed to search notes: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Search results received:', data);
      return data;
    } catch (error) {
      console.error('Error in searchNotes:', error);
      throw error;
    }
  }
};

// UI 更新函数
function updateNoteList(notesToDisplay) {
  console.log('updateNoteList called with:', notesToDisplay);
  const noteList = document.getElementById('noteList');
  const userEmailElement = document.getElementById('userEmail');

  if (!auth.currentUser) {
    console.log('No user logged in, updating UI accordingly');
    userEmailElement.textContent = 'Not logged in';
    noteList.innerHTML = '<li>Please log in to view your notes.</li>';
    return;
  }

  userEmailElement.textContent = auth.currentUser.email;

  if (!notesToDisplay || notesToDisplay.length === 0) {
    console.log('No notes found, displaying empty state');
    noteList.innerHTML = '<li>No notes found. Create your first note!</li>';
    return;
  }

  console.log('Updating note list with received notes');
  noteList.innerHTML = notesToDisplay.map(note => `
  <li class="note-item">
    <div class="note-container">
      <div class="note-content">
        <span class="note-text">${note.content}</span>
        <span class="note-timestamp">${formatTimestamp(note.created_at)}</span>
      </div>
      <div class="dropdown">
        <span class="dropdown-trigger">...</span>
        <div class="dropdown-content">
          <a href="#" class="delete-note" data-note-id="${note.note_id}">Delete</a>
        </div>
      </div>
    </div>
  </li>
`).join('');

  // 在生成笔记列表后添加这段代码
  const dropdowns = noteList.querySelectorAll('.dropdown');
  console.log('Found dropdowns:', dropdowns);

  dropdowns.forEach(dropdown => {
    let timeoutId;

    dropdown.addEventListener('mouseenter', function() {
      clearTimeout(timeoutId);
      const dropdownContent = this.querySelector('.dropdown-content');
      if (dropdownContent) {
        dropdownContent.style.display = 'block';
      }
    });

    dropdown.addEventListener('mouseleave', function() {
      const dropdownContent = this.querySelector('.dropdown-content');
      if (dropdownContent) {
        timeoutId = setTimeout(() => {
          dropdownContent.style.display = 'none';
        }, 500); // 延迟 500 毫秒隐藏
      }
    });

    const dropdownContent = dropdown.querySelector('.dropdown-content');
    if (dropdownContent) {
      dropdownContent.addEventListener('mouseenter', function() {
        clearTimeout(timeoutId);
      });

      dropdownContent.addEventListener('mouseleave', function() {
        timeoutId = setTimeout(() => {
          this.style.display = 'none';
        }, 500); // 延迟 500 毫秒隐藏
      });
    }
  });

  // 添加删除按钮的事件监听器
  const deleteButtons = document.querySelectorAll('.delete-note');
  console.log('Found delete buttons:', deleteButtons);

  deleteButtons.forEach(button => {
    button.addEventListener('click', async function() {
      const noteId = this.dataset.noteId;
      await noteOperations.deleteNote(noteId);
    });
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
    addNoteButton.addEventListener('click', addNote);
  } else {
    console.error('Add Note button not found');
  }

    // 添加键盘事件监听器
    noteInput.addEventListener('keydown', function(event) {
      console.log('Keydown event triggered:', event.key);
      // 检查是否按下了 Command+Enter (macOS) 或 Ctrl+Enter (其他操作系统)
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          console.log('Command/Ctrl + Enter detected');
          event.preventDefault(); // 阻止默认行为（换行）
          addNote();
      }
  });

  // 添加笔记的函数
  function addNote() {
    const noteText = noteInput.value.trim();
    if (noteText) {
      noteOperations.addNote(noteText).then(() => {
        noteInput.value = ''; // 清空输入框
      }).catch(error => {
        console.error('Error adding note:', error);
        alert('Failed to add note. Please try again.');
      });
    }
  }

// 搜索输入事件监听器
if (searchInput) {
  searchInput.addEventListener('input', function() {
    const query = searchInput.value.trim();
    if (query) {
      noteOperations.searchNotes(query).then(matchingNotes => {
        updateNoteList(matchingNotes);
      }).catch(error => {
        console.error('Error searching notes:', error);
        alert('Failed to search notes. Please try again.');
      });
    } else {
      noteOperations.loadNotes();
    }
  });

  // 添加键盘事件监听器
  searchInput.addEventListener('keydown', function(event) {
    console.log('Search keydown event triggered:', event.key);
    if (event.key === 'Enter') {
      event.preventDefault(); // 阻止默认行为（提交表单）
      const query = searchInput.value.trim();
      console.log('Search input detected on Enter:', query); // 添加日志以调试
      if (query) {
        noteOperations.searchNotes(query).then(matchingNotes => {
          updateNoteList(matchingNotes);
        }).catch(error => {
          console.error('Error searching notes:', error);
          alert('Failed to search notes. Please try again.');
        });
      } else {
        noteOperations.loadNotes();
      }
    }
  });
} else {
  console.error('Search input not found');
}

  // 登出按钮事件监听器
  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      // 登出逻辑
    });
  }

      // 为添加按钮添加点击事件监听器
      if (addNoteButton) {
        addNoteButton.addEventListener('click', addNote);
        console.log('Click event listener added to Add Note button');
    } else {
        console.error('Add Notelist button not found');
    }
    
  // 监督delete note的noteID
  if (noteList) {
    noteList.addEventListener('click', async function(e) {
      if (e.target.classList.contains('delete-note')) {
        const noteId = e.target.dataset.noteId;
        console.log('Attempting to delete note with ID:', noteId);

        if (!noteId) {
          console.error('Note ID is undefined');
          return;
        }

        try {
          await noteOperations.deleteNote(noteId);
          console.log(`Note ${noteId} deleted successfully`);
        } catch (error) {
          console.error('Error deleting note:', error);
          alert('Failed to delete note. Please try again.');
        }
      }
    });
  } else {
    console.error('Note list not found');
  }
}); // DOMContentLoaded 事件监听器结束

// 监听认证状态变化
onAuthStateChanged(auth, (user) => {
  console.log('Auth state changed:', user ? 'User logged in' : 'No user');
  if (user) {
    noteOperations.loadNotes().then(() => {
      console.log('Notes loading process completed');
    }).catch(error => {
      console.error('Error in loadNotes:', error);
    });
  } else {
    updateNoteList([]); // 用户登出时清空笔记列表
  }
});

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
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User is signed in:", user);
    try {
      // 继续加载用户数据、笔记等
      noteOperations.loadNotes();
    } catch (error) {
      console.error("Error syncing user data:", error);
      // 处理同步错误，但不影响用户使用应用
    }
  } else {
    console.log("No user is signed in.");
    // 处理用户登出逻辑
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
