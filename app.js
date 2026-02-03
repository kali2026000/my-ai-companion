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
    messageDiv.className = 'message ai';
    
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

        // More detailed error messages
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMsg = 'API Error: ';
            
            if (response.status === 401) {
                errorMsg += 'Invalid API key. Please check and re-enter it.';
            } else if (response.status === 429) {
                errorMsg += 'Rate limit reached. Please wait a moment.';
            } else if (response.status === 400) {
                errorMsg += 'Bad request. ' + (errorData.error?.message || '');
            } else {
                errorMsg += `Status ${response.status}. ${errorData.error?.message || 'Unknown error'}`;
            }
            
            throw new Error(errorMsg);
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
        if (chatMessages.contains(typingDiv)) {
            chatMessages.removeChild(typingDiv);
        }
        
        // Show the actual error message
        addMessage('Error: ' + error.message, false);
        console.error('Full error:', error);
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

