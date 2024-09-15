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
        // 直接在这里同步用户信息到后端
        const idToken = await user.getIdToken();
        const response = await fetch('https://178.128.81.19:3001/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                uid: user.uid,
                email: user.email,
                username: user.displayName || user.email.split('@')[0]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error:', errorText);
            console.warn('Failed to sync user data after registration, but allowing process to continue');
        } else {
            const data = await response.json();
            console.log('User synced successfully after registration:', data);
        }
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
        
        // 直接在这里同步用户信息到后端
        const idToken = await user.getIdToken();
        const response = await fetch('https://178.128.81.19:3001/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                uid: user.uid,
                email: user.email,
                username: user.displayName || user.email.split('@')[0]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error:', errorText);
            // 即使同步失败，我们也允许用户继续使用应用
            console.warn('Failed to sync user data, but allowing login to proceed');
        } else {
            const data = await response.json();
            console.log('User synced successfully:', data);
        }

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