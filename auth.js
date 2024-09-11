import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from './firebase.js';

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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User registered:", userCredential.user);
        alert("注册成功！");
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
        console.log("User logged in:", userCredential.user);
        alert("登录成功！");
        window.location.href = "index.html"; // 登录成功后跳转到主页面
    } catch (error) {
        console.error("Error logging in user:", error);
        errorDiv.textContent = "登录失败：" + error.message;
        errorDiv.style.display = "block";
    } finally {
        loadingDiv.style.display = "none";
    }
}

// 绑定事件处理程序
document.getElementById('registerButton').addEventListener('click', registerUser);
document.getElementById('loginButton').addEventListener('click', loginUser);