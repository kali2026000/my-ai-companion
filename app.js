``javascript
// AI Companion with Cloudflare Worker Backend
const WORKER_URL = 'YOUR-WORKER-URL';  // REPLACE THIS WITH YOUR ACTUAL WORKER URL

const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

let conversationHistory = JSON.parse(localStorage.getItem('conversation')) || [];

// Load previous conversation on startup
function loadConversation() {
    conversationHistory.forEach(msg => {
        addMessageToUI(msg.content, msg.role === 'user');
    });
    
    if (conversationHistory.length === 0) {
        addMessageToUI("Hey, I'm here for you. What's on your mind?", false);
    }
}

function addMessageToUI(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function saveConversation() {
    localStorage.setItem('conversation', JSON.stringify(conversationHistory));
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Disable send button
    sendBtn.disabled = true;
    
    // Add user message
    addMessageToUI(message, true);
    conversationHistory.push({ role: 'user', content: message });
    saveConversation();
    
    userInput.value = '';

    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai';
    typingDiv.innerHTML = '<div class="message-content">Thinking...</div>';
    chatContainer.appendChild(typingDiv);

    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: conversationHistory
            }),
        });

        chatContainer.removeChild(typingDiv);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = data.content[0].text;
        
        addMessageToUI(assistantMessage, false);
        conversationHistory.push({ role: 'assistant', content: assistantMessage });
        saveConversation();

    } catch (error) {
        if (chatContainer.contains(typingDiv)) {
            chatContainer.removeChild(typingDiv);
        }
        addMessageToUI('Sorry, I encountered an error. Please try again.', false);
        console.error('Error:', error);
    } finally {
        sendBtn.disabled = false;
    }
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

// Load conversation on page load
loadConversation();
```
