import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './firebase.js';

const BASE_API_URL = 'https://178.128.81.19:3001'; // 定义 API 基础 URL

// 用户注册函数
async function registerUser() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('registerError');
    const loadingDiv = document.getElementById('registerLoading');

    // 表单验证
    if (!email || !password) {
        errorDiv.textContent = "请填写所有字段";
        errorDiv.style.display = "block";
        return;
    }

    errorDiv.style.display = "none";
    loadingDiv.style.display = "block";

    try {
        // 使用 Firebase 创建用户
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 获取 ID token
        const idToken = await user.getIdToken();

        // 同步用户信息到后端
        const response = await fetch('https://178.128.81.19:3001/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                email: user.email,
                uid: user.uid,
                // 如果你想包含用户名，可以添加一个输入字段并在这里包含
                // name: document.getElementById('registerName').value
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error;
            } catch (e) {
                errorMessage = errorText;
            }
            throw new Error(errorMessage || 'Failed to sync user with backend');
        }

        const data = await response.json();
        console.log('User registered and synced successfully:', data);
        alert("注册成功！");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error registering user:", error);
        errorDiv.textContent = "注册失败：" + error.message;
        errorDiv.style.display = "block";
    } finally {
        loadingDiv.style.display = "none";
    }
}

// 用户登录函数
async function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    const loadingDiv = document.getElementById('loginLoading');

    errorDiv.style.display = "none";
    loadingDiv.style.display = "block";

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('User logged in:', user);

        // 获取 Firebase ID token
        const idToken = await user.getIdToken();

        // 同步用户数据到后端
        await syncUserToBackend(user, idToken);

        alert("登录成功！");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error logging in user:", error);
        errorDiv.textContent = "登录失败：" + error.message;
        errorDiv.style.display = "block";
    } finally {
        loadingDiv.style.display = "none";
    }
}

async function syncUserToBackend(user, idToken) {
    try {
        const response = await fetch('https://178.128.81.19:3001/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                uid: user.uid,
                email: user.email
                // 可以添加其他需要同步的用户信息
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to sync user data: ${errorText}`);
        }

        const result = await response.json();
        console.log('User data synced with backend:', result);
    } catch (error) {
        console.error('Error syncing user data:', error);
        // 这里可以选择是否要抛出错误。如果不抛出，用户仍可以继续使用应用
        // throw error;
    }
}

// 绑定事件处理程序
document.getElementById('registerButton').addEventListener('click', registerUser);
document.getElementById('loginButton').addEventListener('click', loginUser);

// 监听用户状态变化
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user);
        // 用户已登录，可以在这里执行登录后的操作
    } else {
        console.log("No user is signed in.");
        // 用户未登录，可以在这里执行未登录时的操作
    }
});