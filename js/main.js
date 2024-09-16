import { auth, signOut, onAuthStateChanged } from './firebase.js';
import noteOperations from './noteOperations.js';
import { updateNoteList } from './ui.js';
import { getMySQLDateTime } from './utils.js'; // 导入 getMySQLDateTime 函数

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

    searchInput.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
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
      }
    });
  } else {
    console.error('Search input not found');
  }

  // 登出按钮事件监听器
  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      logoutUser();
    });
  }

  // 监督 delete note 的 noteID
  if (noteList) {
    noteList.addEventListener('click', async function(e) {
      if (e.target.classList.contains('delete-note')) {
        const noteId = e.target.dataset.noteId;
        if (!noteId) {
          console.error('Note ID is undefined');
          return;
        }
        try {
          await noteOperations.deleteNote(noteId);
        } catch (error) {
          console.error('Error deleting note:', error);
          alert('Failed to delete note. Please try again.');
        }
      }
    });
  } else {
    console.error('Note list not found');
  }
});

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

// 用户登出函数
async function logoutUser() {
  try {
    await signOut(auth);
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
    try {
      noteOperations.loadNotes();
    } catch (error) {
      console.error("Error syncing user data:", error);
    }
  } else {
    console.log("No user is signed in.");
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