const BASE_API_URL = 'https://178.128.81.19:3001'; // 定义 API 基础 URL

import { auth, signOut, onAuthStateChanged } from './firebase.js';

//llm API调用
const API_KEY = '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'; // 替换为你的 Hugging Face API 密钥
const API_URL = 'https://api-inference.huggingface.co/models/gpt2';

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

// 函数：调用 Hugging Face API 获取反馈
async function getFeedback(noteInput, retries = 3) {
  console.log('Calling Hugging Face API with input:', noteInput);

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: noteInput
        })
      });

      if (!response.ok) {
        console.error('Hugging Face API response error:', response.status);
        if (i === retries - 1) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // 如果不是最后一次重试，等待一段时间后继续
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }

      const data = await response.json();
      console.log('Hugging Face API response data:', data);
      return data[0]?.generated_text || 'No feedback available';
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      // 如果不是最后一次重试，等待一段时间后继续
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
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
        // 用户已登录，可以在这里执行登录后的操作
    } else {
        console.log("No user is signed in.");
        userEmailElement.textContent = ''; // 清空用户邮箱
        window.location.href = "auth.html"; // 用户未登录，跳转到登录页面
    }
});

let notes = []; // 存储笔记的数组

// 异步函数：加载笔记
async function loadNotes() {
  const controller = new AbortController(); // 创建一个 AbortController 实例
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 设置超时为 10 秒

  try {
    const response = await fetch(`${BASE_API_URL}/notes`, { signal: controller.signal }); // 发送 GET 请求获取笔记
    clearTimeout(timeoutId); // 清除超时
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`); // 检查响应状态
    }
    const notesData = await response.json(); // 解析响应数据
    console.log('Loaded notes:', notesData); // 打印调试信息
    notes = notesData; // 更新笔记数组
    updateNoteList(notes); // 更新笔记列表
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Error loading notes: Request timed out'); // 请求超时错误处理
    } else {
      console.error('Error loading notes:', error); // 其他错误处理
    }
  }
}

// 异步函数：添加笔记
async function addNote() {
  const noteInput = document.getElementById('noteInput').value;
  if (noteInput) {
    try {
      const timestamp = new Date().toISOString();
      
      let feedback = 'Unable to get feedback at this time';
      try {
        // 获取反馈
        feedback = await getFeedback(noteInput);
      } catch (feedbackError) {
        console.error('Error getting feedback:', feedbackError);
        // 继续执行，使用默认反馈消息
      }

      // 创建新笔记对象
      const newNote = {
        text: noteInput,
        timestamp: timestamp,
        feedback: feedback
      };

      // 发送新笔记到服务器
      const response = await fetch(`${BASE_API_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNote),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedNote = await response.json();
      
      // 将新笔记添加到数组
      notes.unshift(savedNote);

      // 更新笔记列表显示
      updateNoteList();

      // 清空输入框
      document.getElementById('noteInput').value = '';
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Error adding note. The note was saved without feedback. Please try again later for feedback.');
    }
  } else {
    alert('Note content cannot be empty!');
  }
}

// 异步函数：删除笔记
async function deleteNote(index) {
  try {
    const noteId = notes[index].id;
    console.log('Attempting to delete note with ID:', noteId); // 调试日志

    const response = await fetch(`${BASE_API_URL}/notes/${noteId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Note deleted successfully on server'); // 调试日志

    notes.splice(index, 1); // 从笔记数组中移除笔记
    updateNoteList(); // 更新笔记列表
    console.log('Note removed from local array and list updated'); // 调试日志
  } catch (error) {
    console.error('Error deleting note:', error);
    alert('Error deleting note. Please try again.');
  }
}

// 函数：搜索笔记
function searchNotes() {
  const searchInput = document.getElementById('searchInput').value.toLowerCase(); // 获取搜索输入并转换为小写
  const filteredNotes = notes.filter(note => note.text.toLowerCase().includes(searchInput)); // 过滤笔记
  updateNoteList(filteredNotes, searchInput); // 更新笔记列表
}

// 函数：更新笔记列表
function updateNoteList(filteredNotes = notes, searchInput = '') {
  const noteList = document.getElementById('noteList'); // 获取笔记列表元素
  noteList.innerHTML = ''; // 清空笔记列表

  filteredNotes.forEach((note, index) => {
    const li = document.createElement('li'); // 创建列表项

    li.innerHTML = `
      <div class="note-content">
        <span>${highlightText(note.text, searchInput)}</span>
        <div class="timestamp-container">
          <span class="timestamp">${formatTimestamp(note.timestamp)}</span>
          <div class="dropdown">
            <button class="small-button"></button>
            <div class="dropdown-content">
              <a href="#" class="delete-note" data-index="${index}"><i class="fas fa-trash-alt"></i> 删除</a>
            </div>
          </div>
        </div>
        <div class="feedback-container">
          ${note.feedback ? `<p class="feedback">ThinkBox: ${note.feedback}</p>` : ''}
        </div>
      </div>
    `;

    noteList.appendChild(li); // 将列表项添加到笔记列表
  });

  // 为所有删除按钮添加事件监听器
  document.querySelectorAll('.delete-note').forEach(button => {
    button.addEventListener('click', function(event) {
      event.preventDefault();
      const index = parseInt(this.getAttribute('data-index'));
      deleteNote(index);
    });
  });
}

// 函数：高亮显示搜索关键词
function highlightText(text, searchInput) {
  if (!searchInput) return text; // 如果没有搜索输入，返回原文本
  const regex = new RegExp(`(${searchInput})`, 'gi'); // 创建正则表达式
  return text.replace(regex, '<span class="highlight">$1</span>'); // 替换匹配的文本
}

// 函数：格式化时间戳
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// DOMContentLoaded 事件：页面加载完成后执行
document.addEventListener('DOMContentLoaded', (event) => {
  console.log('DOM fully loaded and parsed'); // 调试日志

  const addNoteButton = document.getElementById('addNoteButton'); // 获取添加笔记按钮
  const noteInput = document.getElementById('noteInput'); // 获取笔记输入框
  const searchInput = document.getElementById('searchInput'); // 获取搜索输入框

  if (addNoteButton) {
    console.log('Add Note button found'); // 调试日志
    addNoteButton.addEventListener('click', addNote); // 添加笔记的逻辑
  } else {
    console.error('Add Note button not found'); // 调试日志
  }

  if (noteInput) {
    console.log('Note input found'); // 调试日志
    noteInput.addEventListener('input', () => {
      // 输入笔记的逻辑
    });

    // 添加 Command + Enter 监听器
    noteInput.addEventListener('keydown', (event) => {
      if (event.metaKey && event.key === 'Enter') {
        addNote();
      }
    });
  } else {
    console.error('Note input not found'); // 调试日志
  }

  if (searchInput) {
    console.log('Search input found'); // 调试日志
    searchInput.addEventListener('input', searchNotes); // 搜索笔记的逻辑
  } else {
    console.error('Search input not found'); // 调试日志
  }
});

loadNotes(); // 加载笔记

// 页面加载完成后检查用户状态
document.addEventListener('DOMContentLoaded', (event) => {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "auth.html"; // 用户未登录，跳转到登录页面
        }
    });
});