import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 전역 BloomFilter 오류 처리
window.addEventListener('error', (event) => {
  if (event.error && event.error.name === 'BloomFilterError') {
    console.warn('BloomFilter 오류 무시됨:', event.error);
    event.preventDefault(); // 오류 이벤트 전파 방지
    return false;
  }
});

// 전역 Promise rejection 처리
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.name === 'BloomFilterError') {
    console.warn('BloomFilter Promise rejection 무시됨:', event.reason);
    event.preventDefault(); // 오류 이벤트 전파 방지
    return false;
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
