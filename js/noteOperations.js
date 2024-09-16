// 从 api.js 导入 API 对象
import api from './api.js';
// 从 ui.js 导入更新笔记列表的函数
import { updateNoteList } from './ui.js';

const noteOperations = {
  // 加载笔记
  async loadNotes() {
    try {
      // 调用 API 获取笔记列表
      const notes = await api.getNotes();
      // 更新 UI 中的笔记列表
      updateNoteList(notes);
    } catch (error) {
      console.error('Error loading notes:', error); // 打印错误信息
    }
  },

  // 添加带反馈的笔记
  async addNoteWithFeedback(text) {
    try {
      // 创建笔记对象
      const note = { content: text };
      // 调用 API 添加新笔记
      const addedNote = await api.addNote(note);
      // 调用 API 生成笔记反馈
      const feedback = await api.generateFeedback(addedNote.id, text);
      // 将反馈添加到笔记对象中
      addedNote.feedback = feedback;
      // 重新加载笔记列表
      this.loadNotes();
    } catch (error) {
      console.error('Error adding note with feedback:', error); // 打印错误信息
    }
  },

  // 生成笔记反馈
  async generateFeedbackForNote(noteId, content) {
    try {
      // 调用 API 生成笔记反馈
      const feedback = await api.generateFeedback(noteId, content);
      console.log('Feedback generated:', feedback); // 打印反馈信息
      // 更新 UI 中的反馈输出
      document.getElementById('feedbackOutput').textContent = feedback.feedback_text;
    } catch (error) {
      console.error('Error generating feedback:', error); // 打印错误信息
      // 更新 UI 中的反馈输出为错误信息
      document.getElementById('feedbackOutput').textContent = 'Failed to generate feedback.';
    }
  },

  // 删除笔记
  async deleteNote(noteId) {
    try {
      // 调用 API 删除笔记
      await api.deleteNote(noteId);
      // 重新加载笔记列表
      this.loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error); // 打印错误信息
    }
  },

  // 搜索笔记
  async searchNotes(query) {
    try {
      // 调用 API 搜索笔记
      const notes = await api.searchNotes(query);
      // 更新 UI 中的笔记列表
      updateNoteList(notes);
    } catch (error) {
      console.error('Error searching notes:', error); // 打印错误信息
    }
  }
};

// 导出笔记操作对象
export default noteOperations;