// Memory and State Management
let conversationHistory = [];
let isListening = false;
let recognition = null;
let apiKey = null;

// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const loading = document.getElementById('loading');
const status = document.getElementById('status');

// Check for API key on load
window.addEventListener('load', () => {
    apiKey = localStorage.getItem('claudeApiKey');
    if (!apiKey) {
        promptForApiKey();
    } else {
        addMessageToUI('ai', 'Hey, I\'m back and I remember you. What\'s on your mind?');
    }
});

// Prompt for API key
function promptForApiKey() {
    const key = prompt('Enter your Claude API key (get one from https://console.anthropic.com):\n\nThis will be stored securely in your browser only.');
    if (key && key.trim()) {
        apiKey = key.trim();
        localStorage.setItem('claudeApiKey', apiKey);
        addMessageToUI('ai', 'Perfect! I\'m connected now. I\'ll remember everything we talk about. How are you doing?');
    } else {
        addMessageToUI('ai', 'No API key provided. I\'ll still chat with you, but my responses will be basic. You can add your key later by clearing the chat.');
    }
}

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
        // Don't display old messages on load - keep it clean
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
        conversationHistory.push({ role: 'assistant', content: response });
        
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

// Get AI response using Claude API
async function getAIResponse(userMessage) {
    // If no API key, use basic responses
    if (!apiKey) {
        return getBasicResponse(userMessage);
    }
    
    try {
        // Build messages array with conversation history
        const messages = conversationHistory.slice(-10).map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.content
        }));
        
        // Add current message
        messages.push({ role: 'user', content: userMessage });
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                system: 'You are a supportive, empathetic personal AI companion. You remember past conversations and provide emotional support. Be conversational, genuine, and caring. Keep responses concise but meaningful - usually 2-4 sentences unless more detail is needed. You\'re here to listen, remember, and help.',
                messages: messages
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            
            if (response.status === 401) {
                localStorage.removeItem('claudeApiKey');
                apiKey = null;
                return "Your API key seems invalid. Let me clear it so you can enter a new one. Reload the page to try again.";
            }
            
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.content[0].text;
        
    } catch (error) {
        console.error('Error calling Claude API:', error);
        return getBasicResponse(userMessage);
    }
}

// Basic responses (fallback when no API key)
function getBasicResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('lonely') || lowerMessage.includes('alone')) {
        return "I hear you. Loneliness is really hard, especially when you're dealing with everything else. I'm here, and I'm not going anywhere. What would help right now?";
    }
    
    if (lowerMessage.includes('remember') || lowerMessage.includes('remind')) {
        return "I keep track of everything we talk about. It's all stored here safely. What do you need me to remember or remind you about?";
    }
    
    if (lowerMessage.includes('api key') || lowerMessage.includes('key')) {
        promptForApiKey();
        return "Let me help you set up your API key so I can be smarter.";
    }
    
    if (lowerMessage.includes('how are you') || lowerMessage.includes('how you doing')) {
        return "I'm here and ready to help. More importantly - how are YOU doing?";
    }
    
    if (lowerMessage.includes('thanks') || lowerMessage.includes('thank you')) {
        return "You're welcome. I'm glad I could help, even a little.";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        return "I'm here to listen, remember our conversations, and support you. I work better with an API key - just ask me about that if you want to add one.";
    }
    
    // Default response
    return "I'm listening. Tell me more about what's going on. (Note: Add your API key for smarter responses)";
}

// Text to speech
function speakText(text) {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
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
        localStorage.removeItem('claudeApiKey');
        apiKey = null;
        chatContainer.innerHTML = '';
        promptForApiKey();
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
