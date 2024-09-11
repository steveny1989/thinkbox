import { auth, onAuthStateChanged, signOut, db, collection, addDoc, getDocs, deleteDoc, doc } from './firebase.js';

let notes = [];

// 检查用户认证状态
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user);
        loadNotes();
    } else {
        console.log("No user is signed in.");
        window.location.href = "auth.html";
    }
});

// 用户登出函数
async function logoutUser() {
    try {
        await signOut(auth);
        console.log("User logged out");
        notes = [];
        updateNoteList();
        window.location.href = "auth.html"; // 登出后跳转到登录页面
    } catch (error) {
        console.error("Error logging out user:", error);
    }
}

// 从 Firebase 加载笔记
async function loadNotes() {
    try {
        const querySnapshot = await getDocs(collection(db, "notes"));
        querySnapshot.forEach((doc) => {
            console.log(`${doc.id} => ${doc.data().content}`);
        });
    } catch (error) {
        console.error("Error loading notes: ", error);
    }
}

// 添加笔记的函数
async function addNote() {
    const noteInput = document.getElementById('noteInput').value;
    const timestamp = new Date().toLocaleString();

    if (noteInput) {
        try {
            console.log("Adding note:", noteInput, timestamp);
            // 将新笔记添加到 Firebase
            const docRef = await addDoc(collection(db, "notes"), {
                text: noteInput,
                timestamp
            });
            console.log("Note added with ID:", docRef.id);
            // 将新笔记添加到本地数组
            notes.push({ id: docRef.id, text: noteInput, timestamp });
            // 清空输入框
            document.getElementById('noteInput').value = '';
            // 更新笔记列表显示
            updateNoteList();
        } catch (error) {
            console.error("Error adding note:", error);
        }
    } else {
        alert("笔记内容不能为空！");
    }
}

// 删除笔记的函数
async function deleteNote(index) {
    const note = notes[index];
    await deleteDoc(doc(db, "notes", note.id));
    notes.splice(index, 1);
    updateNoteList();
}

// 搜索笔记的函数
function searchNotes() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const filteredNotes = notes.filter(note => note.text.toLowerCase().includes(searchInput));
    updateNoteList(filteredNotes, searchInput);
}

// 更新笔记列表显示的函数
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
        dropdownButton.textContent = '...';

        const dropdownContent = document.createElement('div');
        dropdownContent.className = 'dropdown-content';

        const deleteLink = document.createElement('a');
        deleteLink.textContent = '删除';
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

// 高亮显示匹配的文本
function highlightText(text, searchInput) {
    if (!searchInput) return text;
    const regex = new RegExp(`(${searchInput})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// 绑定事件处理程序
document.getElementById('logoutButton').addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log("User signed out.");
        window.location.href = "auth.html";
    } catch (error) {
        console.error("Sign out error:", error);
    }
});

document.getElementById('addNoteButton').addEventListener('click', async () => {
    const noteContentElement = document.getElementById('noteContent');
    if (noteContentElement) {
        const noteContent = noteContentElement.value;
        try {
            const docRef = await addDoc(collection(db, "notes"), {
                content: noteContent,
                timestamp: new Date()
            });
            console.log("Document written with ID: ", docRef.id);
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    } else {
        console.error("Element with ID 'noteContent' not found.");
    }
});

// 加载笔记
loadNotes();