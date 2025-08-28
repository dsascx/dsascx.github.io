/**
 * Base64 加密解密工具
 * 所有处理均在本地浏览器中完成，不涉及服务器上传
 */

// DOM 元素
document.addEventListener('DOMContentLoaded', function() {
    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const copyBtn = document.getElementById('copyBtn');
    const encryptInput = document.getElementById('encryptInput');
    const decryptInput = document.getElementById('decryptInput');
    const resultOutput = document.getElementById('resultOutput');
    const copyNotification = document.getElementById('copyNotification');
    const fileEncryptArea = document.getElementById('fileEncryptArea');
    const fileDecryptArea = document.getElementById('fileDecryptArea');
    const fileEncryptInput = document.getElementById('fileEncryptInput');
    const fileDecryptInput = document.getElementById('fileDecryptInput');
    const errorModal = document.getElementById('errorModal');
    const closeErrorBtn = document.getElementById('closeErrorBtn');
    const errorMessage = document.getElementById('errorMessage');
    const themeToggle = document.getElementById('themeToggle');
    
    // 初始化暗色模式
    initDarkMode();
    
    // 暗色模式切换逻辑
    function initDarkMode() {
        // 检查用户偏好
        const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
                          (localStorage.getItem('darkMode') === null && 
                           window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        // 应用初始主题
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        // 添加主题切换事件监听器
        if (themeToggle) {
            themeToggle.addEventListener('click', function() {
                const isDark = document.documentElement.classList.toggle('dark');
                localStorage.setItem('darkMode', isDark);
            });
        }
    }

    // 加密按钮点击事件
    encryptBtn.addEventListener('click', function() {
        try {
            const text = encryptInput.value.trim();
            if (!text) {
                showError('请输入要加密的文本');
                return;
            }
            const encoded = btoa(unescape(encodeURIComponent(text)));
            resultOutput.value = encoded;
            // 自动选择解密框，并清空内容
            decryptInput.value = encoded;
        } catch (error) {
            showError('加密过程中发生错误：' + error.message);
        }
    });

    // 解密按钮点击事件
    decryptBtn.addEventListener('click', function() {
        try {
            const text = decryptInput.value.trim();
            if (!text) {
                showError('请输入要解密的Base64文本');
                return;
            }
            // 检查是否是有效的Base64格式
            if (!isValidBase64(text)) {
                showError('无效的Base64格式');
                return;
            }
            const decoded = decodeURIComponent(escape(atob(text)));
            resultOutput.value = decoded;
            // 自动选择加密框，并清空内容
            encryptInput.value = decoded;
        } catch (error) {
            showError('解密过程中发生错误：' + error.message);
        }
    });

    // 复制按钮点击事件
    copyBtn.addEventListener('click', function() {
        try {
            resultOutput.select();
            document.execCommand('copy');
            showCopyNotification();
        } catch (error) {
            showError('复制失败，请手动选择并复制');
        }
    });

    // 文件加密区域点击事件
    fileEncryptArea.addEventListener('click', function() {
        fileEncryptInput.click();
    });

    // 文件解密区域点击事件
    fileDecryptArea.addEventListener('click', function() {
        fileDecryptInput.click();
    });

    // 文件加密输入变化事件
    fileEncryptInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const arrayBuffer = event.target.result;
                const bytes = new Uint8Array(arrayBuffer);
                const binary = Array.prototype.map.call(bytes, function(byte) {
                    return String.fromCharCode(byte);
                }).join('');
                const encoded = btoa(binary);
                resultOutput.value = encoded;
                decryptInput.value = encoded;
                encryptInput.value = `[文件: ${file.name}]`;
                
                // 重置文件输入，允许重复选择同一文件
                fileEncryptInput.value = '';
            } catch (error) {
                showError('文件加密过程中发生错误：' + error.message);
                fileEncryptInput.value = '';
            }
        };
        reader.onerror = function() {
            showError('文件读取失败');
            fileEncryptInput.value = '';
        };
        reader.readAsArrayBuffer(file);
    });

    // 文件解密输入变化事件
    fileDecryptInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const base64Text = event.target.result.trim();
                
                // 检查是否是有效的Base64格式
                if (!isValidBase64(base64Text)) {
                    showError('无效的Base64文件');
                    fileDecryptInput.value = '';
                    return;
                }
                
                // 尝试解码Base64
                const binary = atob(base64Text);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                
                // 尝试将解码后的数据转换为文本
                try {
                    const decodedText = new TextDecoder().decode(bytes);
                    resultOutput.value = decodedText;
                    encryptInput.value = decodedText;
                    decryptInput.value = `[Base64文件: ${file.name}]`;
                } catch (e) {
                    // 如果无法转换为文本，则提供下载选项
                    resultOutput.value = '[二进制文件，点击下方按钮下载]';
                    encryptInput.value = '[二进制文件内容]';
                    decryptInput.value = `[Base64文件: ${file.name}]`;
                    
                    // 创建下载按钮
                    createDownloadButton(bytes, file.name.replace(/\.[^/.]+$/, ''));
                }
                
                // 重置文件输入
                fileDecryptInput.value = '';
            } catch (error) {
                showError('文件解密过程中发生错误：' + error.message);
                fileDecryptInput.value = '';
            }
        };
        reader.onerror = function() {
            showError('文件读取失败');
            fileDecryptInput.value = '';
        };
        reader.readAsText(file);
    });

    // 关闭错误提示模态框
    closeErrorBtn.addEventListener('click', function() {
        errorModal.classList.add('hidden');
    });

    // 点击模态框背景关闭
    errorModal.addEventListener('click', function(e) {
        if (e.target === errorModal) {
            errorModal.classList.add('hidden');
        }
    });

    // 辅助函数：检查Base64格式是否有效
    function isValidBase64(str) {
        // Base64只包含A-Z, a-z, 0-9, +, /, =，并且长度是4的倍数
        const base64Regex = /^[A-Za-z0-9+/]+[=]{0,2}$/;
        return base64Regex.test(str) && str.length % 4 === 0;
    }

    // 辅助函数：显示复制成功通知
    function showCopyNotification() {
        copyNotification.style.opacity = '1';
        setTimeout(function() {
            copyNotification.style.opacity = '0';
        }, 2000);
    }

    // 辅助函数：显示错误信息
    function showError(message) {
        errorMessage.textContent = message;
        errorModal.classList.remove('hidden');
    }

    // 辅助函数：创建下载按钮
    function createDownloadButton(bytes, originalName) {
        // 检查是否已存在下载按钮，如果存在则移除
        const existingButton = document.getElementById('downloadBinaryBtn');
        if (existingButton) {
            existingButton.remove();
        }

        const resultContainer = resultOutput.parentNode;
        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'downloadBinaryBtn';
        downloadBtn.className = 'mt-3 bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all-ease';
        downloadBtn.innerHTML = '<i class="fa fa-download" aria-hidden="true"></i> <span>下载二进制文件</span>';
        
        downloadBtn.addEventListener('click', function() {
            const blob = new Blob([bytes], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = originalName + '_decoded';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        resultContainer.appendChild(downloadBtn);
    }

    // 添加键盘快捷键支持
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Shift + E: 加密
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            encryptBtn.click();
        }
        // Ctrl/Cmd + Shift + D: 解密
        else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            decryptBtn.click();
        }
        // Ctrl/Cmd + C: 复制结果（仅在结果区域有内容时）
        else if ((e.ctrlKey || e.metaKey) && e.key === 'C' && resultOutput.value) {
            e.preventDefault();
            copyBtn.click();
        }
    });

    // 添加平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // 考虑导航栏高度
                    behavior: 'smooth'
                });
            }
        });
    });

    // 页面加载时的动画效果
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-10');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(section => {
        section.classList.add('transition-all', 'duration-700', 'ease-out', 'opacity-0', 'translate-y-10');
        observer.observe(section);
    });
});