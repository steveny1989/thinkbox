const API_URL = 'https://178.128.81.19:3001'; 

let notes = [];

async function loadNotes() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 增加超时时间到 10 秒

  try {
    const response = await fetch(`${API_URL}/notes`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const notesData = await response.json();
    console.log('Loaded notes:', notesData); // 添加调试信息
    notes = notesData;
    updateNoteList(notes);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Error loading notes: Request timed out');
    } else {
      console.error('Error loading notes:', error);
    }
  }
}

async function addNote() {
  const noteInput = document.getElementById('noteInput').value;
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' '); // 格式化时间戳

  if (noteInput) {
    try {
      const response = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: noteInput, timestamp })
      });

      if (!response.ok) { // 检查服务器响应状态码
        throw new Error(`Failed to add note: ${response.status} ${response.statusText}`);
      }
      const newNote = await response.json();
      notes.push(newNote);
      document.getElementById('noteInput').value = '';
      updateNoteList();
      // 添加成功反馈信息，例如：alert('笔记添加成功！');
    } catch (error) {
      console.error('Error adding note:', error);
      // 显示错误信息给用户，例如：alert('添加笔记失败，请稍后重试。');
    }
  } else {
    alert('笔记内容不能为空！');
  }
}

async function deleteNote(index) {
  const note = notes[index];
  try {
    await fetch(`${API_URL}/notes/${note.id}`, {
      method: 'DELETE'
    });
    notes.splice(index, 1);
    updateNoteList();
  } catch (error) {
    console.error('Error deleting note:', error);
  }
}

function searchNotes() {
  const searchInput = document.getElementById('searchInput').value.toLowerCase();
  const filteredNotes = notes.filter(note => note.text.toLowerCase().includes(searchInput));
  updateNoteList(filteredNotes, searchInput);
}

function updateNoteList(filteredNotes = notes, searchInput = '') {
  const noteList = document.getElementById('noteList');
  noteList.innerHTML = '';

  filteredNotes.forEach((note, index) => {
    const li = document.createElement('li');

    const noteText = document.createElement('span');
    noteText.className = 'note-content';
    noteText.innerHTML = highlightText(note.text, searchInput);

    const timestampDropdownContainer = document.createElement('div');
    timestampDropdownContainer.className = 'timestamp-dropdown-container';

    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = note.timestamp;

    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';

    const dropdownButton = document.createElement('button');
    dropdownButton.innerHTML = '<i class="fas fa-ellipsis-h"></i>'; // 使用 Font Awesome 图标

    const dropdownContent = document.createElement('div');
    dropdownContent.className = 'dropdown-content';

    const deleteLink = document.createElement('a');
    deleteLink.innerHTML = '<i class="fas fa-trash-alt"></i> 删除'; // 使用 Font Awesome 图标
    deleteLink.href = '#';
    deleteLink.onclick = (event) => {
      event.preventDefault();
      deleteNote(index);
    };

    dropdownContent.appendChild(deleteLink);

    dropdown.appendChild(dropdownButton);
    dropdown.appendChild(dropdownContent);

    timestampDropdownContainer.appendChild(timestamp);
    timestampDropdownContainer.appendChild(dropdown);

    li.appendChild(noteText);
    li.appendChild(timestampDropdownContainer);

    noteList.appendChild(li);
  });
}

function highlightText(text, searchInput) {
  if (!searchInput) return text;
  const regex = new RegExp(`(${searchInput})`, 'gi');
  return text.replace(regex, '<span class="highlight">$1</span>');
}

document.addEventListener('DOMContentLoaded', (event) => {
  const addNoteButton = document.getElementById('addNoteButton');
  const noteInput = document.getElementById('noteInput');
  const searchInput = document.getElementById('searchInput');

  if (addNoteButton) {
    addNoteButton.addEventListener('click', addNote); // 添加笔记的逻辑
  }

  if (noteInput) {
    noteInput.addEventListener('input', () => {
      // 输入笔记的逻辑
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', searchNotes); // 搜索笔记的逻辑
  }
});

loadNotes();