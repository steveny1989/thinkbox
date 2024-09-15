import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from './firebase.js';

// 用户注册函数
async function registerUser() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('registerError');

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('User registered:', user);
        // 注册成功后可能需要进行的操作，比如跳转到主页
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Registration error:', error);
        errorDiv.textContent = error.message;
    }
}

// 用户登录函数
async function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('User logged in:', user);
        // 登录成功后跳转到主页
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = error.message;
    }
}

// 绑定事件处理程序
document.addEventListener('DOMContentLoaded', function() {
    const registerButton = document.getElementById('registerButton');
    const loginButton = document.getElementById('loginButton');

    if (registerButton) {
        registerButton.addEventListener('click', registerUser);
    }

    if (loginButton) {
        loginButton.addEventListener('click', loginUser);
    }
});