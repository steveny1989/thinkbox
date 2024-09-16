// 从 firebase.js 导入 Firebase 认证实例
import { auth, onAuthStateChanged, signOut } from './firebase.js';
import noteOperations from './noteOperations.js';
import { updateNoteList } from './ui.js'; // 确保只导入一次

// 页面加载完成后执行的代码
document.addEventListener('DOMContentLoaded', function() {
  // 获取页面中的各个元素
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
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      addNote();
    }
  });

  // 添加笔记的函数
  async function addNote() {
    const text = noteInput.value.trim();
    if (text) {
      try {
        const timestamp = getMySQLDateTime(); // 获取当前时间
        await noteOperations.addNoteWithFeedback(text, timestamp);
        noteInput.value = '';
      } catch (error) {
        console.error('Error adding note:', error);
        alert('Failed to add note. Please try again.');
      }
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
  } else {
    console.error('Search input not found');
  }

  // 登出按钮事件监听器
  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      signOut(auth).then(() => {
        window.location.href = "auth.html"; // 登出后跳转到登录页面
      }).catch(error => {
        console.error('Error signing out:', error);
      });
    });
  } else {
    console.error('Logout button not found');
  }

  // 监听认证状态变化
  onAuthStateChanged(auth, (user) => {
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
});