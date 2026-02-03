// AI Companion with Claude API and Memory
const chatMessages = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendBtn');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyButton = document.getElementById('saveKeyBtn');
const apiKeySection = document.getElementById('apiKeySection');

let conversationHistory = [];
let apiKey = sessionStorage.getItem('claude_api_key');

// Check if API key exists on load
if (apiKey) {
    apiKeySection.style.display = 'none';
}

function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (key) {
        sessionStorage.setItem('claude_api_key', key);
        apiKey = key;
        apiKeySection.style.display = 'none';
        addMessage('API key saved! You can now chat with me. I\'ll remember our conversation.', false);
    }
}

function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'message ai' : 'message ai';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    if (!apiKey) {
        alert('Please enter your API key first');
        return;
    }

    const message = userInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    userInput.value = '';
    
    // Add user message to history
    conversationHistory.push({
        role: 'user',
        content: message
    });

    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai';
    typingDiv.innerHTML = '<div class="message-content">Thinking...</div>';
    chatMessages.appendChild(typingDiv);

    try {
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
                messages: conversationHistory
            })
        });

        chatMessages.removeChild(typingDiv);

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        const assistantMessage = data.content[0].text;
        
        // Add assistant response to history
        conversationHistory.push({
            role: 'assistant',
            content: assistantMessage
        });

        addMessage(assistantMessage, false);

    } catch (error) {
        chatMessages.removeChild(typingDiv);
        addMessage('Sorry, I encountered an error. Please check your API key and try again.', false);
        console.error('Error:', error);
    }
}

// Event listeners
if (saveKeyButton) {
    saveKeyButton.addEventListener('click', saveApiKey);
}

if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
}

if (userInput) {
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Add initial greeting if API key exists
if (apiKey) {
    addMessage('Hey, I\'m here for you. What\'s on your mind?', false);
}
