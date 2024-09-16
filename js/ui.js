// 从 firebase.js 导入 Firebase 认证实例
import { auth, onAuthStateChanged } from './firebase.js';
import noteOperations from './noteOperations.js';
import { updateNoteList } from './ui.js';

// 更新笔记列表的函数
export function updateNoteList(notesToDisplay) {
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

// 辅助函数：格式化时间戳
export function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}

// 显示错误消息的函数
export function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// 隐藏错误消息的函数
export function hideError() {
  const errorDiv = document.getElementById('error');
  errorDiv.style.display = 'none';
}

// 事件监听器：页面加载完成后执行
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
      logoutUser();
    });
  }

  // 监督 delete note 的 noteID
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
});

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

// 其他 UI 相关的函数可以添加在这里