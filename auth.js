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
        const response = await fetch('https://178.128.81.19:3001/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error === 'Email already in use') {
                errorDiv.textContent = "This email is already registered. Please use a different email or try logging in.";
            } else {
                throw new Error(errorData.error || 'Failed to register');
            }
        } else {
            const data = await response.json();
            console.log('User registered successfully:', data);
            alert("注册成功！");
            window.location.href = "index.html";
        }
    } catch (error) {
        console.error("Error registering user:", error);
        errorDiv.textContent = "注册失败：" + error.message;
    } finally {
        errorDiv.style.display = "block";
        loadingDiv.style.display = "none";
    }
}

// 用户登录函数
async function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    const loadingDiv = document.getElementById('loginLoading');

    // 表单验证
    if (!email || !password) {
        errorDiv.textContent = "请填写所有字段";
        errorDiv.style.display = "block";
        return;
    }

    errorDiv.style.display = "none";
    loadingDiv.style.display = "block";

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('User logged in:', user);

        // 获取 Firebase ID token
        const idToken = await user.getIdToken();

        // 从后端获取用户数据
        const response = await fetch(`https://178.128.81.19:3001/users/${user.uid}`, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to fetch user data: ${errorData.error}`);
        }

        const userData = await response.json();
        console.log('User data from backend:', userData);

        // ... 处理成功登录 ...

        alert("登录成功！");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error logging in user:", error);
        // ... 错误处理 ...
    } finally {
        loadingDiv.style.display = "none";
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