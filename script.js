const API_URL = 'https://178.128.81.19:3001'; // 定义 API 基础 URL

import { auth, signOut, onAuthStateChanged } from './firebase.js';

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
    if (user) {
        console.log("User is signed in:", user);
        // 用户已登录，可以在这里执行登录后的操作
    } else {
        console.log("No user is signed in.");
        window.location.href = "auth.html"; // 用户未登录，跳转到登录页面
    }
});

let notes = []; // 存储笔记的数组

// 异步函数：加载笔记
async function loadNotes() {
  const controller = new AbortController(); // 创建一个 AbortController 实例
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 设置超时为 10 秒

  try {
    const response = await fetch(`${API_URL}/notes`, { signal: controller.signal }); // 发送 GET 请求获取笔记
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
  const noteInput = document.getElementById('noteInput').value; // 获取输入的笔记内容
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' '); // 格式化时间戳

  if (noteInput) {
    try {
      const response = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: noteInput, timestamp }) // 发送 POST 请求添加笔记
      });

      if (!response.ok) { // 检查服务器响应状态码
        throw new Error(`Failed to add note: ${response.status} ${response.statusText}`);
      }
      const newNote = await response.json(); // 解析响应数据
      notes.push(newNote); // 将新笔记添加到笔记数组
      document.getElementById('noteInput').value = ''; // 清空输入框
      updateNoteList(); // 更新笔记列表
      // 添加成功反馈信息，例如：alert('笔记添加成功！');
    } catch (error) {
      console.error('Error adding note:', error); // 错误处理
      // 显示错误信息给用户，例如：alert('添加笔记失败，请稍后重试。');
    }
  } else {
    alert('笔记内容不能为空！'); // 输入内容为空时的提示
  }
}

// 异步函数：删除笔记
async function deleteNote(index) {
  const note = notes[index]; // 获取要删除的笔记
  try {
    await fetch(`${API_URL}/notes/${note.id}`, {
      method: 'DELETE' // 发送 DELETE 请求删除笔记
    });
    notes.splice(index, 1); // 从笔记数组中移除笔记
    updateNoteList(); // 更新笔记列表
  } catch (error) {
    console.error('Error deleting note:', error); // 错误处理
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

    const noteText = document.createElement('span'); // 创建笔记文本元素
    noteText.className = 'note-content';
    noteText.innerHTML = highlightText(note.text, searchInput); // 高亮显示搜索关键词

    const timestampDropdownContainer = document.createElement('div'); // 创建时间戳和下拉菜单容器
    timestampDropdownContainer.className = 'timestamp-dropdown-container';

    const timestamp = document.createElement('span'); // 创建时间戳元素
    timestamp.className = 'timestamp';
    timestamp.textContent = formatTimestamp(note.timestamp); // 格式化时间戳

    const dropdown = document.createElement('div'); // 创建下拉菜单
    dropdown.className = 'dropdown';

    const dropdownButton = document.createElement('button'); // 创建下拉菜单按钮
    dropdownButton.className = 'small-button'; // 修改为 small-button 类
    const dropdownContent = document.createElement('div'); // 创建下拉菜单内容
    dropdownContent.className = 'dropdown-content';

    const deleteLink = document.createElement('a'); // 创建删除链接
    deleteLink.innerHTML = '<i class="fas fa-trash-alt"></i> 删除'; // 使用 Font Awesome 图标
    deleteLink.href = '#';
    deleteLink.onclick = (event) => {
      event.preventDefault();
      deleteNote(index); // 删除笔记
    };

    dropdownContent.appendChild(deleteLink); // 将删除链接添加到下拉菜单内容
    dropdown.appendChild(dropdownButton); // 将按钮添加到下拉菜单
    dropdown.appendChild(dropdownContent); // 将内容添加到下拉菜单

    timestampDropdownContainer.appendChild(timestamp); // 将时间戳添加到容器
    timestampDropdownContainer.appendChild(dropdown); // 将下拉菜单添加到容器

    li.appendChild(noteText); // 将笔记文本添加到列表项
    li.appendChild(timestampDropdownContainer); // 将容器添加到列表项

    noteList.appendChild(li); // 将列表项添加到笔记列表
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
  const addNoteButton = document.getElementById('addNoteButton'); // 获取添加笔记按钮
  const noteInput = document.getElementById('noteInput'); // 获取笔记输入框
  const searchInput = document.getElementById('searchInput'); // 获取搜索输入框

  if (addNoteButton) {
    addNoteButton.addEventListener('click', addNote); // 添加笔记的逻辑
  }

  if (noteInput) {
    noteInput.addEventListener('input', () => {
      // 输入笔记的逻辑
    });

    // 添加 Command + Enter 监听器
    noteInput.addEventListener('keydown', (event) => {
      if (event.metaKey && event.key === 'Enter') {
        addNote();
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', searchNotes); // 搜索笔记的逻辑
  }
});

loadNotes(); // 加载笔记