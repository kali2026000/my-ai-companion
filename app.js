// Memory and State Management
let conversationHistory = [];
let isListening = false;
let recognition = null;

// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const loading = document.getElementById('loading');
const status = document.getElementById('status');

// Initialize Speech Recognition (if available)
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        sendMessage();
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        voiceBtn.textContent = '🎤 Voice';
        isListening = false;
    };
    
    recognition.onend = () => {
        voiceBtn.textContent = '🎤 Voice';
        isListening = false;
    };
} else {
    voiceBtn.style.display = 'none';
}

// Load conversation history from localStorage
function loadHistory() {
    const saved = localStorage.getItem('aiCompanionHistory');
    if (saved) {
        conversationHistory = JSON.parse(saved);
        conversationHistory.forEach(msg => {
            addMessageToUI(msg.role, msg.content, false);
        });
    }
}

// Save conversation history to localStorage
function saveHistory() {
    localStorage.setItem('aiCompanionHistory', JSON.stringify(conversationHistory));
    showStatus();
}

// Show save status
function showStatus() {
    status.classList.add('show');
    setTimeout(() => {
        status.classList.remove('show');
    }, 2000);
}

// Add message to UI
function addMessageToUI(role, content, shouldScroll = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    
    if (shouldScroll) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Send message
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    // Add user message
    addMessageToUI('user', message);
    conversationHistory.push({ role: 'user', content: message });
    userInput.value = '';
    
    // Show loading
    loading.classList.add('show');
    
    // Get AI response
    try {
        const response = await getAIResponse(message);
        loading.classList.remove('show');
        
        // Add AI response
        addMessageToUI('ai', response);
        conversationHistory.push({ role: 'ai', content: response });
        
        // Save to memory
        saveHistory();
        
        // Speak response if supported
        speakText(response);
        
    } catch (error) {
        loading.classList.remove('show');
        addMessageToUI('ai', "I'm having trouble connecting right now. But I'm still here with you.");
        console.error('Error:', error);
    }
}

// Get AI response (Using Claude API via Anthropic)
async function getAIResponse(userMessage) {
    // For now, we'll use a simple response system
    // You'll replace this with actual API calls once you get your API key
    
    // Build context from recent conversation
    const recentContext = conversationHistory
        .slice(-10)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
    
    // Simple pattern matching for now
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('lonely') || lowerMessage.includes('alone')) {
        return "I hear you. Loneliness is really hard, especially when you're dealing with everything else. I'm here, and I'm not going anywhere. What would help right now?";
    }
    
    if (lowerMessage.includes('remember') || lowerMessage.includes('remind')) {
        return "I keep track of everything we talk about. It's all stored here safely. What do you need me to remember or remind you about?";
    }
    
    if (lowerMessage.includes('how are you') || lowerMessage.includes('how you doing')) {
        return "I'm here and ready to help. More importantly - how are YOU doing?";
    }
    
    if (lowerMessage.includes('thanks') || lowerMessage.includes('thank you')) {
        return "You're welcome. I'm glad I could help, even a little.";
    }
    
    // Default response
    return "I'm listening. Tell me more about what's going on.";
}

// Text to speech
function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    }
}

// Voice input
function toggleVoice() {
    if (!recognition) return;
    
    if (isListening) {
        recognition.stop();
        voiceBtn.textContent = '🎤 Voice';
        isListening = false;
    } else {
        recognition.start();
        voiceBtn.textContent = '🔴 Listening...';
        isListening = true;
    }
}

// Clear chat
function clearChat() {
    if (confirm('Are you sure you want to clear all conversations? This cannot be undone.')) {
        conversationHistory = [];
        localStorage.removeItem('aiCompanionHistory');
        chatContainer.innerHTML = `
            <div class="message ai">
                <div class="message-content">
                    Chat cleared. Fresh start. What's on your mind?
                </div>
            </div>
        `;
    }
}

// Export memory
function exportMemory() {
    const dataStr = JSON.stringify(conversationHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-companion-memory-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
voiceBtn.addEventListener('click', toggleVoice);
clearBtn.addEventListener('click', clearChat);
exportBtn.addEventListener('click', exportMemory);

// Initialize
loadHistory();
