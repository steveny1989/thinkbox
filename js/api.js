// 从 firebase.js 导入 Firebase 认证实例
import { auth } from './firebase.js';

// 定义 API 基础 URL
const BASE_API_URL = 'https://178.128.81.19:3001';

// 定义 API 对象，包含与后端交互的所有方法
const api = {
  // 获取笔记列表
  async getNotes() {
    try {
      // 获取当前用户的 ID 令牌
      const idToken = await auth.currentUser.getIdToken();
      // 向后端发送 GET 请求以获取笔记列表
      const response = await fetch(`${BASE_API_URL}/notes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}` // 使用 ID 令牌进行认证
        }
      });
      // 检查响应是否成功
      if (!response.ok) {
        throw new Error('Failed to fetch notes'); // 如果失败，抛出错误
      }
      // 返回解析后的 JSON 数据
      return await response.json();
    } catch (error) {
      console.error('Error fetching notes:', error); // 打印错误信息
      throw error; // 重新抛出错误以便调用者处理
    }
  },

  // 添加新笔记
  async addNote(note) {
    try {
      // 获取当前用户的 ID 令牌
      const idToken = await auth.currentUser.getIdToken();
      // 向后端发送 POST 请求以添加新笔记
      const response = await fetch(`${BASE_API_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // 设置请求头为 JSON
          'Authorization': `Bearer ${idToken}` // 使用 ID 令牌进行认证
        },
        body: JSON.stringify(note) // 将笔记对象转换为 JSON 字符串
      });
      // 检查响应是否成功
      if (!response.ok) {
        throw new Error('Failed to add note'); // 如果失败，抛出错误
      }
      // 返回解析后的 JSON 数据
      return await response.json();
    } catch (error) {
      console.error('Error adding note:', error); // 打印错误信息
      throw error; // 重新抛出错误以便调用者处理
    }
  },

  // 删除笔记
  async deleteNote(noteId) {
    try {
      // 获取当前用户的 ID 令牌
      const idToken = await auth.currentUser.getIdToken();
      // 向后端发送 DELETE 请求以删除指定 ID 的笔记
      const response = await fetch(`${BASE_API_URL}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}` // 使用 ID 令牌进行认证
        }
      });
      // 检查响应是否成功
      if (!response.ok) {
        throw new Error('Failed to delete note'); // 如果失败，抛出错误
      }
      // 返回解析后的 JSON 数据
      return await response.json();
    } catch (error) {
      console.error('Error deleting note:', error); // 打印错误信息
      throw error; // 重新抛出错误以便调用者处理
    }
  },

  // 搜索笔记
  async searchNotes(query) {
    try {
      // 获取当前用户的 ID 令牌
      const idToken = await auth.currentUser.getIdToken();
      // 向后端发送 GET 请求以搜索笔记
      const response = await fetch(`${BASE_API_URL}/notes/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}` // 使用 ID 令牌进行认证
        }
      });
      // 检查响应是否成功
      if (!response.ok) {
        throw new Error('Failed to search notes'); // 如果失败，抛出错误
      }
      // 返回解析后的 JSON 数据
      return await response.json();
    } catch (error) {
      console.error('Error searching notes:', error); // 打印错误信息
      throw error; // 重新抛出错误以便调用者处理
    }
  },

  // 生成笔记反馈
  async generateFeedback(noteId, content) {
    try {
      // 获取当前用户的 ID 令牌
      const idToken = await auth.currentUser.getIdToken();
      // 向后端发送 POST 请求以生成笔记反馈
      const response = await fetch(`${BASE_API_URL}/notes/${noteId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // 设置请求头为 JSON
          'Authorization': `Bearer ${idToken}` // 使用 ID 令牌进行认证
        },
        body: JSON.stringify({ content }) // 将反馈内容转换为 JSON 字符串
      });
      // 检查响应是否成功
      if (!response.ok) {
        throw new Error('Failed to generate feedback'); // 如果失败，抛出错误
      }
      // 返回解析后的 JSON 数据
      return await response.json();
    } catch (error) {
      console.error('Error generating feedback:', error); // 打印错误信息
      throw error; // 重新抛出错误以便调用者处理
    }
  },

  // 获取笔记反馈
  async getFeedback(noteId) {
    try {
      // 获取当前用户的 ID 令牌
      const idToken = await auth.currentUser.getIdToken();
      // 向后端发送 GET 请求以获取指定 ID 的笔记反馈
      const response = await fetch(`${BASE_API_URL}/notes/${noteId}/feedback`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}` // 使用 ID 令牌进行认证
        }
      });
      // 检查响应是否成功
      if (!response.ok) {
        throw new Error('Failed to fetch feedback'); // 如果失败，抛出错误
      }
      // 返回解析后的 JSON 数据
      return await response.json();
    } catch (error) {
      console.error('Error fetching feedback:', error); // 打印错误信息
      throw error; // 重新抛出错误以便调用者处理
    }
  }
};

// 导出 API 对象，以便在其他模块中使用
export default api;